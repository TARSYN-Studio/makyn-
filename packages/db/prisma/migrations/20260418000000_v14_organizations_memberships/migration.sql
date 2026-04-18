-- ============================================================================
--  v1.5 Commit A — multi-user per organization (app-layer rename +
--  memberships + polymorphic AuditLog + Issue provenance + org soft-delete).
--
--  DB layer: keep the physical table "Company" PascalCase for one release
--  cycle. Prisma model is `Organization`. Field-level renames
--  (organizationId ← companyId, createdByUserId ← ownerId) are @map only,
--  no SQL column rename. Every new column is camelCase to match the
--  pre-existing naming style of the DB.
--
--  Spec-update Q1 (Issue provenance tri-field), Q2 (cross-org trace), Q3
--  (soft-delete) absorbed. Q5 active-org switcher is purely code-level
--  (permissions.listUserOrgIds) and needs no SQL.
--
--  Safety order:
--    1. Enums: OrgRole, DetectedBy
--    2. Table Membership + backfill one OWNER row per existing
--       (Company.ownerId, Company.id).
--    3. Rename existing AuditLog → AiEventLog to free the name.
--    4. Create new polymorphic AuditLog.
--    5. Add Issue provenance + cross-org trace columns.
--    6. Relax NOT NULLs on Issue.ownerId + Issue.companyId so the
--       manual-routing queue + bot-detected rows fit.
--    7. Add Organization soft-delete columns (deletedAt, deletedByUserId).
--    8. Drop Company.ownerId (permissions now via Membership).
-- ============================================================================

-- 1. Enums
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "DetectedBy" AS ENUM ('HUMAN', 'BOT', 'INBOUND_TELEGRAM', 'INBOUND_EMAIL', 'SYSTEM');

-- 2. Membership table
CREATE TABLE "Membership" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role"           "OrgRole" NOT NULL DEFAULT 'MEMBER',
  "invitedById"    TEXT,
  "invitedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Membership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Membership_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Membership_userId_organizationId_key"
  ON "Membership"("userId", "organizationId");
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- 2b. Backfill: every existing Company → one OWNER Membership for its owner.
--     Preserves access for every current user. ON CONFLICT so re-running
--     the migration against a shadow DB that already has rows is safe.
INSERT INTO "Membership"
  ("id", "userId", "organizationId", "role",
   "invitedById", "invitedAt", "acceptedAt", "createdAt", "updatedAt")
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
FROM "Company"
ON CONFLICT ("userId", "organizationId") DO NOTHING;

-- 3. Rename existing AuditLog → AiEventLog. Column names unchanged
--    (Prisma model tracks them 1:1). Indexes renamed to match.
ALTER TABLE "AuditLog" RENAME TO "AiEventLog";
ALTER INDEX "AuditLog_pkey"         RENAME TO "AiEventLog_pkey";
ALTER INDEX "AuditLog_eventType_idx"  RENAME TO "AiEventLog_eventType_idx";
ALTER INDEX "AuditLog_occurredAt_idx" RENAME TO "AiEventLog_occurredAt_idx";

-- 4. New polymorphic AuditLog
CREATE TABLE "AuditLog" (
  "id"             TEXT PRIMARY KEY,
  "actorUserId"    TEXT,
  "organizationId" TEXT,
  "entityType"     TEXT NOT NULL,
  "entityId"       TEXT,
  "action"         TEXT NOT NULL,
  "diff"           JSONB,
  "ip"             TEXT,
  "userAgent"      TEXT,
  "timestamp"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Company"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_organizationId_timestamp_idx"
  ON "AuditLog"("organizationId", "timestamp" DESC);
CREATE INDEX "AuditLog_entityType_entityId_idx"
  ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- 5. Issue provenance + cross-org trace columns. All nullable so every
--    existing row keeps the defaults (detectedBy='HUMAN', rest NULL).
ALTER TABLE "Issue" ADD COLUMN "detectedBy" "DetectedBy" NOT NULL DEFAULT 'HUMAN';
ALTER TABLE "Issue" ADD COLUMN "assignedToUserId"        TEXT;
ALTER TABLE "Issue" ADD COLUMN "sourceChannel"           TEXT;
ALTER TABLE "Issue" ADD COLUMN "sourceUserId"            TEXT;
ALTER TABLE "Issue" ADD COLUMN "matchedByIdentifier"     TEXT;
ALTER TABLE "Issue" ADD COLUMN "matchedToOrganizationId" TEXT;
ALTER TABLE "Issue" ADD COLUMN "matchConfidence"         DOUBLE PRECISION;
ALTER TABLE "Issue" ADD COLUMN "needsManualRouting"      BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Issue"
  ADD CONSTRAINT "Issue_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Issue_assignedToUserId_idx" ON "Issue"("assignedToUserId");
CREATE INDEX "Issue_needsManualRouting_idx" ON "Issue"("needsManualRouting");

-- 6. Relax Issue.ownerId (→ createdByUserId, nullable for bot-only
--    detection) and Issue.companyId (→ organizationId, nullable for
--    manual-routing queue).
ALTER TABLE "Issue" ALTER COLUMN "ownerId"   DROP NOT NULL;
ALTER TABLE "Issue" ALTER COLUMN "companyId" DROP NOT NULL;

-- 7. Organization soft-delete columns on the Company table.
ALTER TABLE "Company" ADD COLUMN "deletedAt"       TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN "deletedByUserId" TEXT;
ALTER TABLE "Company"
  ADD CONSTRAINT "Company_deletedByUserId_fkey"
    FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- 8. Drop Company.ownerId. Permissions now live in Membership; every
--    existing (user → company) pair is covered by backfill in step 2b.
ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_ownerId_fkey";
DROP INDEX IF EXISTS "Company_ownerId_idx";
ALTER TABLE "Company" DROP COLUMN "ownerId";
