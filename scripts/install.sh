#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/makyn"
APP_USER="makyn"
DB_CA_PATH="/etc/ssl/vultr-db-ca.crt"
CADDYFILE="/etc/caddy/Caddyfile"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

cd "$APP_DIR"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg ufw unzip

mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs
npm install -g pm2

apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

mkdir -p /var/makyn/media /var/log/makyn /etc/secrets
chown -R "$APP_USER:$APP_USER" /var/makyn /var/log/makyn "$APP_DIR"
chmod 750 /var/makyn /var/log/makyn

curl -fsSL https://docs.vultr.com/public/documents/managed-databases/ca-certificates/vultr-global-root-ca.crt -o "$DB_CA_PATH"
chmod 644 "$DB_CA_PATH"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 443/tcp
ufw --force enable

sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Create $APP_DIR/.env before continuing."
  exit 1
fi

npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build

if [[ -f "$APP_DIR/Caddyfile" ]]; then
  cp "$APP_DIR/Caddyfile" "$CADDYFILE"
fi

systemctl enable --now caddy
systemctl reload caddy

runuser -u "$APP_USER" -- pm2 start "$APP_DIR/ecosystem.config.js" --only makyn-bot
runuser -u "$APP_USER" -- pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
systemctl enable "pm2-$APP_USER"

echo "Installation complete."
