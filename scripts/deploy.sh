#!/usr/bin/env bash
set -euo pipefail

cd /opt/makyn

git pull
npm ci
npx prisma migrate deploy
npm run build
runuser -u makyn -- pm2 restart makyn-bot
