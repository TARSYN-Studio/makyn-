# MAKYN v0

MAKYN v0 is a Telegram-based concierge MVP for Saudi compliance and professional-services communication. This build uses grammY, Prisma, OpenAI GPT, Google Cloud Vision, PM2, and Caddy with a webhook-only production setup.

## Stack

- Node.js 20 LTS
- TypeScript
- grammY
- Prisma + PostgreSQL 16
- OpenAI GPT (`gpt-5-mini` by default)
- Google Cloud Vision OCR
- PM2
- Caddy
- Pino structured logging with daily rotation
- Zod environment validation

## Project Layout

```text
/opt/makyn
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── ecosystem.config.js
├── Caddyfile
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── queries/
│   └── daily-review.sql
├── scripts/
│   ├── add-user.ts
│   ├── deploy.sh
│   └── install.sh
└── src/
    ├── index.ts
    ├── config.ts
    ├── ai/
    ├── bot/
    ├── db/
    ├── ocr/
    ├── services/
    └── utils/
```

## Security Rules

- Put real credentials only in `/opt/makyn/.env`.
- Do not commit `.env`.
- Run the app as the dedicated `makyn` system user, not `root`.
- Keep only ports `22` and `443` open.
- Store the Vultr PostgreSQL CA certificate at `/etc/ssl/vultr-db-ca.crt`.
- Store the Google Vision service account JSON at `/etc/secrets/gcp-vision.json`.

## 1. Copy Code To The Server

1. SSH into the server as `root`.
2. Install `git` if it is not already installed.
3. Clone this repository into `/opt/makyn`:

```bash
mkdir -p /opt
cd /opt
git clone <your-repo-url> makyn
cd /opt/makyn
```

## 2. Prepare The Environment File

Copy the example file and edit it:

```bash
cp /opt/makyn/.env.example /opt/makyn/.env
nano /opt/makyn/.env
```

Fill in all values manually. Do not leave secrets in shell history files or any extra documents.

Required keys:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=
FOUNDER_TELEGRAM_USER_ID=
FOUNDER_ADMIN_CHAT_ID=
DATABASE_URL=
DATABASE_CA_CERT_PATH=/etc/ssl/vultr-db-ca.crt
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-vision.json
NODE_ENV=production
LOG_LEVEL=info
PORT=8080
AUTO_SEND_CONFIDENCE_THRESHOLD=0.85
AUTO_SEND_MAX_URGENCY=3
```

### DATABASE_URL Notes

Use the Vultr managed PostgreSQL connection string with SSL enabled. Make sure it references the CA certificate path you downloaded onto the server. Keep the full connection string only inside `/opt/makyn/.env`.

## 3. Prepare DNS And Webhook Domain

1. Point your domain’s A record to `139.84.138.94`.
2. Edit `/opt/makyn/Caddyfile`.
3. Replace `<your-domain>` with the real domain that will receive Telegram webhooks.
4. Set `TELEGRAM_WEBHOOK_URL` in `.env` to:

```text
https://your-domain.com/webhook/<TELEGRAM_WEBHOOK_SECRET>
```

## 4. Prepare External Credential Files

Create the Vision credentials directory and upload the Google service account JSON:

```bash
mkdir -p /etc/secrets
nano /etc/secrets/gcp-vision.json
chmod 600 /etc/secrets/gcp-vision.json
```

The install script downloads the Vultr database CA certificate automatically to `/etc/ssl/vultr-db-ca.crt`.

## 5. Run The Installer

Run the install script as `root`:

```bash
cd /opt/makyn
chmod +x scripts/install.sh scripts/deploy.sh
./scripts/install.sh
```

The installer will:

1. Install Node.js 20 from NodeSource.
2. Install PM2 globally.
3. Install Caddy.
4. Create `/var/makyn/media` and `/var/log/makyn`.
5. Create the `makyn` system user.
6. Download the Vultr PostgreSQL CA certificate.
7. Configure UFW to allow only `22` and `443`.
8. Disable SSH password authentication.
9. Install npm dependencies.
10. Run Prisma generate, migrate deploy, and seed.
11. Build TypeScript.
12. Start the bot under PM2.
13. Configure PM2 startup on boot.

## 6. Add Allowed Telegram Users

Only users in the `User` table can interact with the bot.

Example:

```bash
cd /opt/makyn
npm run add-user -- --telegram-id 12345 --name "Ahmed" --role TESTER
```

Suggested founder entry:

```bash
npm run add-user -- --telegram-id <FOUNDER_TELEGRAM_USER_ID> --name "Founder" --role FOUNDER
```

## 7. Deploy Future Updates

After the first install, future updates should use:

```bash
cd /opt/makyn
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

`deploy.sh` runs:

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart makyn-bot
```

## 8. Runtime Behavior

- Telegram runs in webhook mode only.
- Caddy terminates HTTPS and proxies `/webhook/*` to `localhost:8080`.
- Unauthorized Telegram senders are silently dropped and logged to `AuditLog`.
- Low-risk, high-confidence messages may be auto-sent in Arabic.
- Higher-risk messages are queued to the founder admin chat with Approve, Edit, Reject, and Escalate actions.

## 9. Logs And Review Queries

Logs:

- Application logs rotate daily under `/var/log/makyn/app.log`.
- PM2 stdout/stderr logs are stored in `/var/log/makyn/out.log` and `/var/log/makyn/error.log`.

Daily SQL review query:

```bash
cat /opt/makyn/queries/daily-review.sql
```

This query returns:

- Messages processed today by government body
- Average classification confidence
- Auto-sent vs queued percentages
- Open conversations with urgency `>= 4`
- Unauthorized attempts in the last 24 hours

## 10. Manual Acceptance Tests

Run these after the bot is live:

1. Send: `استلمت رسالة من الزكاة بخصوص متأخرات ضريبة القيمة المضافة`
   Expect: `ZATCA`, urgency `4`, `requires_professional=true`, queued to admin chat.
2. Send a ZATCA-style photo notice.
   Expect: OCR text extraction and classification on extracted Arabic text.
3. Send a message from a Telegram account not in the allowlist.
   Expect: no reply, `AuditLog` row with `unauthorized_attempt`.
4. Tap `Approve` in the admin chat.
   Expect: draft sent to original user, `sentAt` populated, `founderAction=APPROVED`.
5. Tap `Edit`, then send custom Arabic text.
   Expect: edited response sent, `founderEditedResponse` stored.
6. Run:

```sql
SELECT "detectedGovernmentBody", COUNT(*), AVG("aiConfidence")
FROM "Message"
WHERE "direction" = 'INBOUND'
GROUP BY "detectedGovernmentBody";
```

## 11. Manual Founder Checklist

- Rotate the Telegram bot token and paste the new value into `/opt/makyn/.env`.
- Rotate the database password and paste the new `DATABASE_URL` into `/opt/makyn/.env`.
- Obtain the OpenAI API key and paste it into `/opt/makyn/.env`.
- Obtain the Google Cloud Vision service account JSON and place it at `/etc/secrets/gcp-vision.json`.
- Point your domain’s A record to `139.84.138.94` and replace `<your-domain>` in `/opt/makyn/Caddyfile`.
- Create the Telegram admin group, add the bot, capture the group chat ID, and paste it into `/opt/makyn/.env` as `FOUNDER_ADMIN_CHAT_ID`.
- Run `/opt/makyn/scripts/install.sh` as `root`.
