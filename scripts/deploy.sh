#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/makyn"
APP_USER="makyn"

cd "$APP_DIR"

git pull

runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" install --frozen-lockfile
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" --filter @makyn/db run prisma:generate
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" --filter @makyn/db run prisma:deploy
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" run build
runuser -u "$APP_USER" -- pm2 reload "$APP_DIR/ecosystem.config.js"
