-- ============================================================================
--  v1.4 Commit B — Invitations + per-org invite domain restriction.
--
--  Additive migration. Rollback = DROP TABLE "Invitation" + DROP COLUMN
--  "Company"."inviteDomainRestriction". No data-loss scenario because
--  both are net-new and empty at creation.
--
--  Note on naming: PascalCase table + camelCase columns to match the
--  style established in the 2026-04-17 init and preserved in v1.4 Commit
--  A. `"Company"` (not `"Organization"`) per the Commit A app-layer-only
--  rename — Prisma model is Organization, DB table stays "Company".
-- ============================================================================

-- 1. Invitation table
CREATE TABLE "Invitation" (
  "id"                TEXT PRIMARY KEY,
  "organizationId"    TEXT NOT NULL,
  "email"             TEXT NOT NULL,
  "role"              "OrgRole" NOT NULL,
  "token"             TEXT NOT NULL,
  "invitedByUserId"   TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"         TIMESTAMP(3) NOT NULL,
  "acceptedAt"        TIMESTAMP(3),
  "acceptedByUserId"  TEXT,
  "revokedAt"         TIMESTAMP(3),
  "revokedByUserId"   TEXT,

  CONSTRAINT "Invitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invitation_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Invitation_acceptedByUserId_fkey"
    FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invitation_revokedByUserId_fkey"
    FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- Defense in depth beyond the enum: OWNER role is produced only by
  -- the ownership-transfer flow, never by invite-accept.
  CONSTRAINT "Invitation_role_not_owner_check"
    CHECK ("role" <> 'OWNER')
);

CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX "Invitation_organizationId_acceptedAt_revokedAt_expiresAt_idx"
  ON "Invitation"("organizationId", "acceptedAt", "revokedAt", "expiresAt");
CREATE INDEX "Invitation_email_organizationId_acceptedAt_revokedAt_idx"
  ON "Invitation"("email", "organizationId", "acceptedAt", "revokedAt");
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- 2. Per-org invite domain allow-list. Empty array = no restriction.
--    Non-empty = only emails in these exact-match domains may be
--    invited. Lowercased on write. OWNER-only modification enforced
--    in the route layer.
ALTER TABLE "Company"
  ADD COLUMN "inviteDomainRestriction" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
