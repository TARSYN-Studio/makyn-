-- ============================================================================
--  OAuth accounts — Google / Microsoft social login.
--
--  Additive migration:
--   1. User.passwordHash becomes nullable (OAuth-only users have no password).
--   2. New OAuthAccount table links (provider, providerAccountId) -> User.
--
--  Rollback: DROP TABLE "OAuthAccount"; ALTER "User" column back to NOT NULL
--  after verifying no rows with passwordHash IS NULL remain.
-- ============================================================================

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TABLE "OAuthAccount" (
  "id"                 TEXT PRIMARY KEY,
  "userId"             TEXT NOT NULL,
  "provider"           TEXT NOT NULL,
  "providerAccountId"  TEXT NOT NULL,
  "email"              TEXT NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OAuthAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key"
  ON "OAuthAccount"("provider", "providerAccountId");
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");
