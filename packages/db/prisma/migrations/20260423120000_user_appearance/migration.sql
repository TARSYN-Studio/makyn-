-- Appearance preferences: Light/Dark theme and Side/Top dock position.
-- Both default safely so existing rows backfill without a NULL-scan.

ALTER TABLE "User"
  ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light',
  ADD COLUMN "dockPosition" TEXT NOT NULL DEFAULT 'side';
