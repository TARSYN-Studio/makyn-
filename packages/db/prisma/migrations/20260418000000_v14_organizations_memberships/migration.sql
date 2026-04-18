-- ============================================================================
--  v1.4 Commit A — multi-user per organization (app-layer Organization rename
--  + memberships + polymorphic AuditLog).
--
--  DB-layer strategy: keep the physical table name `companies` for one
--  release cycle. The Prisma model is renamed to Organization; field
--  rename from `ownerId` → `createdById` on Issue is @map only (no SQL).
--  The `owner_id` column on `companies` is DROPPED after Memberships are
--  backfilled, since permissions now go through the join table.
--
--  Safety order:
--    1. Create `memberships` (empty)
--    2. Create `audit_log` (new, polymorphic)
--    3. Create `OrgRole` enum
--    4. Backfill one owner-role Membership per existing (user, company)
--    5. Rename old `AuditLog` → `ai_event_log` to preserve AI pipeline logs
--    6. Drop `companies.owner_id` (now redundant)
-- ============================================================================

-- 1. OrgRole enum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

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

-- 6. Drop the now-redundant `companies.owner_id` column.
--    FK companies.ownerId → User no longer referenced; permissions go
--    through memberships.
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_ownerId_fkey";
DROP INDEX IF EXISTS "companies_ownerId_idx";
ALTER TABLE "companies" DROP COLUMN "ownerId";

-- Field rename summary (Prisma @map only, no SQL needed):
--   Issue.ownerId (DB col: owner_id)        → Issue.createdById
--   Issue.companyId (DB col: company_id)    → Issue.organizationId
--   Message.companyId (DB col: company_id)  → Message.organizationId
--   CompanyDocument.companyId (DB col: company_id) → CompanyDocument.organizationId
