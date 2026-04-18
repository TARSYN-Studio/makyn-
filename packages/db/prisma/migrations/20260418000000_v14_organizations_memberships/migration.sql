-- ============================================================================
--  v1.4 Commit A — multi-user per organization (app-layer Organization
--  rename + memberships + polymorphic AuditLog + Issue provenance +
--  soft-delete).
--
--  DB-layer strategy: keep the physical table `companies` for one release
--  cycle. Prisma model is `Organization`. Issue.ownerId (column name
--  `owner_id`) stays as the column but is renamed at the Prisma layer to
--  `createdByUserId` and made nullable. New Issue + Organization columns
--  land as ADD COLUMN (non-destructive).
--
--  Schema absorbs spec-update Q1 (Issue provenance split into detectedBy /
--  createdByUserId / assignedToUserId + source/match trace fields) and
--  Q3 (Organization soft-delete). Q5 active-org switcher is a code-layer
--  behavior of listUserOrgIds — no SQL needed.
--
--  Safety order:
--    1. Create OrgRole + DetectedBy enums
--    2. Create `memberships` + backfill from companies.owner_id
--    3. Rename old AuditLog → ai_event_log
--    4. Create new polymorphic `audit_log`
--    5. Add new Issue columns (detected_by, assigned_to_user_id, source/
--       match trace fields, needs_manual_routing) — ADD COLUMN, safe
--    6. Make Issue.owner_id nullable + add Issue.organization_id nullable
--       (was company_id NOT NULL — now nullable for manual-routing queue)
--    7. Add Organization soft-delete columns (deleted_at, deleted_by_user_id)
--    8. Drop companies.owner_id (permissions now via memberships)
-- ============================================================================

-- 1. OrgRole + DetectedBy enums
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "DetectedBy" AS ENUM ('HUMAN', 'BOT', 'INBOUND_TELEGRAM', 'INBOUND_EMAIL', 'SYSTEM');

-- 2. memberships
CREATE TABLE "memberships" (
  "id"              TEXT PRIMARY KEY,
  "user_id"         TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "role"            "OrgRole" NOT NULL DEFAULT 'MEMBER',
  "invited_by"      TEXT,
  "invited_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "memberships_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key"
  ON "memberships"("user_id", "organization_id");
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

-- 3. Backfill memberships — every existing company → one OWNER membership
--    for its owner. Preserves access for every current user. Tested
--    idempotently via (user_id, organization_id) unique.
INSERT INTO "memberships"
  ("id", "user_id", "organization_id", "role",
   "invited_by", "invited_at", "accepted_at", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  "ownerId",
  "id",
  'OWNER'::"OrgRole",
  NULL,
  "createdAt",
  "createdAt",
  "createdAt",
  "updatedAt"
FROM "companies"
ON CONFLICT ("user_id", "organization_id") DO NOTHING;

-- 4. Rename existing `AuditLog` → `ai_event_log` (historical AI pipeline
--    debug rows). Free up the name for the new polymorphic audit_log.
ALTER TABLE "AuditLog" RENAME TO "ai_event_log";
ALTER INDEX "AuditLog_eventType_idx" RENAME TO "ai_event_log_event_type_idx";
ALTER INDEX "AuditLog_occurredAt_idx" RENAME TO "ai_event_log_occurred_at_idx";
ALTER TABLE "ai_event_log" RENAME COLUMN "eventType" TO "event_type";
ALTER TABLE "ai_event_log" RENAME COLUMN "eventData" TO "event_data";
ALTER TABLE "ai_event_log" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "ai_event_log" RENAME COLUMN "occurredAt" TO "occurred_at";

-- 5. New polymorphic audit_log
CREATE TABLE "audit_log" (
  "id"              TEXT PRIMARY KEY,
  "actor_user_id"   TEXT,
  "organization_id" TEXT,
  "entity_type"     TEXT NOT NULL,
  "entity_id"       TEXT,
  "action"          TEXT NOT NULL,
  "diff"            JSONB,
  "ip"              TEXT,
  "user_agent"      TEXT,
  "timestamp"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_log_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "audit_log_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "companies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "audit_log_organization_id_timestamp_idx"
  ON "audit_log"("organization_id", "timestamp" DESC);
CREATE INDEX "audit_log_entity_type_entity_id_idx"
  ON "audit_log"("entity_type", "entity_id");
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log"("actor_user_id");

-- 6. Issue provenance — new columns for detectedBy / assignedTo / source-
--    channel + matcher-trace. All nullable so backfill is trivial (every
--    existing Issue keeps detected_by='HUMAN' by default).
ALTER TABLE "Issue" ADD COLUMN "detected_by" "DetectedBy" NOT NULL DEFAULT 'HUMAN';
ALTER TABLE "Issue" ADD COLUMN "assigned_to_user_id" TEXT;
ALTER TABLE "Issue" ADD COLUMN "source_channel" TEXT;
ALTER TABLE "Issue" ADD COLUMN "source_user_id" TEXT;
ALTER TABLE "Issue" ADD COLUMN "matched_by_identifier" TEXT;
ALTER TABLE "Issue" ADD COLUMN "matched_to_organization_id" TEXT;
ALTER TABLE "Issue" ADD COLUMN "match_confidence" DOUBLE PRECISION;
ALTER TABLE "Issue" ADD COLUMN "needs_manual_routing" BOOLEAN NOT NULL DEFAULT FALSE;

-- Relax existing NOT NULLs on Issue.owner_id (creator now nullable — bot
-- detection has no human creator) and Issue.company_id (manual-routing
-- queue holds issues not yet bound to an org).
ALTER TABLE "Issue" ALTER COLUMN "owner_id"   DROP NOT NULL;
ALTER TABLE "Issue" ALTER COLUMN "company_id" DROP NOT NULL;

-- FKs + indexes for the new Issue columns. Existing companies_id_fkey is
-- unchanged (still points at companies.id); we only re-create as
-- deferrable-friendly if needed later.
ALTER TABLE "Issue"
  ADD CONSTRAINT "Issue_assigned_to_user_id_fkey"
    FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Issue_assigned_to_user_id_idx" ON "Issue"("assigned_to_user_id");
CREATE INDEX "Issue_needs_manual_routing_idx" ON "Issue"("needs_manual_routing");

-- 7. Organization soft-delete columns.
ALTER TABLE "companies" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "deleted_by_user_id" TEXT;
ALTER TABLE "companies"
  ADD CONSTRAINT "companies_deleted_by_user_id_fkey"
    FOREIGN KEY ("deleted_by_user_id") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- 8. Drop the now-redundant `companies.owner_id` column. Permissions go
--    through memberships from here on.
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_ownerId_fkey";
DROP INDEX IF EXISTS "companies_ownerId_idx";
ALTER TABLE "companies" DROP COLUMN "ownerId";

-- Field rename summary (Prisma @map only, no SQL needed):
--   Issue.company_id (NOT NULL)  → Issue.organizationId (nullable, see step 6)
--   Issue.owner_id (NOT NULL)    → Issue.createdByUserId (nullable, see step 6)
--   Message.company_id           → Message.organizationId
--   CompanyDocument.company_id   → CompanyDocument.organizationId
