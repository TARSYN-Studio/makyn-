#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/makyn"
APP_USER="makyn"
DB_CA_PATH="/etc/ssl/vultr-db-ca.crt"
CADDYFILE="/etc/caddy/Caddyfile"
PNPM_VERSION="9.15.0"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

cd "$APP_DIR"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg ufw unzip

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -qE '^v20\.'; then
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g "pnpm@${PNPM_VERSION}"
fi

if ! command -v caddy >/dev/null 2>&1; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

mkdir -p /var/makyn/media /var/log/makyn /etc/secrets
chown -R "$APP_USER:$APP_USER" /var/makyn /var/log/makyn "$APP_DIR"
chmod 750 /var/makyn /var/log/makyn

if [[ ! -f "$DB_CA_PATH" ]]; then
  echo "DB CA cert missing at $DB_CA_PATH — attempting download."
  if ! curl -fsSL https://docs.vultr.com/public/documents/managed-databases/ca-certificates/vultr-global-root-ca.crt -o "$DB_CA_PATH"; then
    echo "WARNING: could not auto-download Vultr CA cert. Place it at $DB_CA_PATH manually before the bot starts."
  fi
fi
[[ -f "$DB_CA_PATH" ]] && chmod 644 "$DB_CA_PATH"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Create $APP_DIR/.env before continuing."
  exit 1
fi

# Make .env readable by both the bot (runuser makyn) and the web app
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 640 "$APP_DIR/.env"

# Prisma CLI, tsx, dotenv, and Next.js all read .env from the working
# directory. Symlink the single root .env into each workspace app so
# migrations, seeds, the bot process, and next start all see the same
# config without duplicating secrets.
for target in packages/db apps/bot apps/web; do
  runuser -u "$APP_USER" -- ln -sfn "$APP_DIR/.env" "$APP_DIR/$target/.env"
done

runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" install --frozen-lockfile
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" --filter @makyn/db run prisma:generate
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" --filter @makyn/db run prisma:deploy
runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" run seed

runuser -u "$APP_USER" -- pnpm --dir "$APP_DIR" run build

if [[ -f "$APP_DIR/Caddyfile" ]]; then
  cp "$APP_DIR/Caddyfile" "$CADDYFILE"
fi

systemctl enable --now caddy
systemctl reload caddy

runuser -u "$APP_USER" -- pm2 delete all 2>/dev/null || true
runuser -u "$APP_USER" -- pm2 start "$APP_DIR/ecosystem.config.js"
runuser -u "$APP_USER" -- pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
systemctl enable "pm2-$APP_USER"

echo "Installation complete."
echo "Bot:  http://localhost:8080  (webhook path /webhook/<SECRET>)"
echo "Web:  http://localhost:3000"
