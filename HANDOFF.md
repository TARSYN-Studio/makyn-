# MAKYN — Handoff

You're taking over from Mohammed. MAKYN is **live in production** at
`app.makyn.site` and `api.makyn.site`. Read this end to end before
touching anything.

---

## 1. What this is

Telegram concierge for Saudi SME owners. User forwards a government
notice (ZATCA, GOSI, MOJ, etc.) to the bot; a 3-stage OpenAI pipeline
classifies it, drafts an Arabic response, and creates an Issue in a
Next.js dashboard. Live in production with 1 test user (Mohammed) and
2 companies. **No other users yet.**

**Stack:** Node 20 + TypeScript + pnpm monorepo. Telegram bot (grammY)
+ Next.js 14 dashboard + Prisma + Postgres (Vultr Managed) + OpenAI
gpt-5-mini + Google Vision OCR. PM2 + Caddy on a Vultr VPS.

---

## 2. Access you need Mohammed to give you

None of this is in the repo — ask Mohammed directly:

- [ ] **SSH key added to server** — send him your public key
      (`cat ~/.ssh/id_ed25519.pub`); he runs
      `ssh-copy-id` or pastes it into `/root/.ssh/authorized_keys` on
      the server. Test: `ssh root@139.84.138.94 whoami` should print
      `root`.
- [ ] **`.env` file** — he'll send it over a secure channel (Signal,
      1Password share). Contains DATABASE_URL, TELEGRAM_BOT_TOKEN,
      OPENAI_API_KEY, etc. Save as `./.env` at the repo root. **Never
      commit it.**
- [ ] **GCP service account JSON** — `makyn-*.json`. Save at repo root.
      **Never commit it.**
- [ ] **DB CA cert** — `ca-certificate.crt`. Save at repo root. **Never
      commit it.**
- [ ] **GitHub collaborator access** to `TARSYN-Studio/makyn-`
      (note trailing dash in repo name).
- [ ] **Vultr console access** (Mohammed's call — only needed if the VPS
      hangs or DNS breaks).

`.gitignore` already covers all three secret files. Always run
`git status` before `git add`, never `git add .`.

---

## 3. Repo layout

```
apps/bot         Telegram webhook server (grammY, port 8080)
apps/web         Next.js dashboard (port 3000)
packages/db      Prisma schema + client, seed data
packages/core    3-stage AI pipeline, matcher, status calculator
packages/channels Channel adapters (telegram active, whatsapp stub)
scripts/         install.sh (first setup) + deploy.sh (every push)
```

The Prisma schema is the source of truth for the data model:
`packages/db/prisma/schema.prisma`.

---

## 4. Server layout

- **Host:** `root@139.84.138.94` (Vultr VPS, Bangalore region)
- **App user:** `makyn` (no login shell; use `runuser -u makyn -- <cmd>`)
- **Workspace:** `/opt/makyn/` (git clone of this repo)
- **Logs:** `/var/log/makyn/{bot,web}-{out,error}-<idx>.log`
- **Caddy config:** `/etc/caddy/Caddyfile` (copied from repo)
- **DB CA cert:** `/etc/ssl/vultr-db-ca.crt`
- **GCP SA:** `/etc/secrets/gcp-vision.json`

**Live subdomains** (all point to this VPS):

| URL                   | Routes to      | Purpose            |
|-----------------------|----------------|--------------------|
| `app.makyn.site`      | localhost:3000 | Next.js dashboard  |
| `api.makyn.site`      | localhost:8080 | Telegram webhook   |
| `makyn.site`          | 301 → app      | Root redirect      |

---

## 5. Critical gotcha: `.env` symlinks

Prisma CLI, tsx seed, and Next.js all read `.env` from CWD. The
monorepo runs commands from `packages/db`, `apps/bot`, `apps/web` —
so `/opt/makyn/.env` is **symlinked** into each of them:

```
/opt/makyn/packages/db/.env → /opt/makyn/.env
/opt/makyn/apps/bot/.env    → /opt/makyn/.env
/opt/makyn/apps/web/.env    → /opt/makyn/.env
```

`scripts/install.sh` creates these symlinks on every run. If you see
`Environment variable not found: DATABASE_URL` or a bot crash-looping
with Zod validation errors, the symlinks are missing — rerun
install.sh or create them manually.

Locally on your Mac, keep the single `.env` at the repo root and
create the same three symlinks (`ln -sf ../../.env packages/db/.env`
etc.) before running prisma commands.

---

## 6. Deploying

After pushing to `main`:

```bash
ssh root@139.84.138.94 'bash /opt/makyn/scripts/deploy.sh'
```

This does: `git pull`, `pnpm install`, `prisma generate`, `prisma migrate deploy`,
`pnpm build` for both apps, `pm2 reload all`. Takes ~60–90 seconds.

**First-time or schema-heavy changes:** use `scripts/install.sh` instead
(~5 min — installs apt packages + pnpm from scratch).

PM2 runs both apps in fork mode:

```
makyn-bot  cwd: /opt/makyn/apps/bot  script: ./dist/index.js
makyn-web  cwd: /opt/makyn/apps/web  script: node_modules/next/dist/bin/next  args: start -p 3000
```

---

## 7. Monitoring one-liners

```bash
# PM2 status
ssh root@139.84.138.94 'runuser -u makyn -- pm2 list'

# Live logs (both apps, streaming)
ssh root@139.84.138.94 'runuser -u makyn -- pm2 logs --raw'

# Errors only, last 50 lines
ssh root@139.84.138.94 'runuser -u makyn -- pm2 logs --err --nostream --lines 50'

# Restart (zero-downtime reload)
ssh root@139.84.138.94 'runuser -u makyn -- pm2 reload all'

# Telegram webhook state (pending updates, last error)
ssh root@139.84.138.94 'TOKEN=$(awk -F= "/^TELEGRAM_BOT_TOKEN/{print \$2}" /opt/makyn/.env | tr -d "\""); curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo" | python3 -m json.tool'
```

---

## 8. v1.1 — Document-driven onboarding (PR open, not yet deployed)

A large feature branch (`claude/funny-moore-4c6862`) is open as a PR and
**needs to be merged and deployed before it goes live**.

### What the PR adds

- `/companies/new` is now a 3-stage AI-assisted onboarding flow:
  - **Stage A** — 4-question business profile quiz (employees? premises?
    sector? foreign ownership?) determines which default upload slots appear.
  - **Stage B** — Upload grid: drag-drop cards, 2-second polling until
    extraction completes, searchable add-doc dialog (all 28 types), CR
    enforcement gate.
  - **Stage C** — Pre-filled review form grouped by document source with
    ⚠ low-confidence indicators. User edits + confirms. Saves company.
- **AI pipeline** (`packages/core/ai/document-extractors.ts`): Google Vision
  OCR → gpt-5-mini extraction with per-doc-type prompts for all 28 Saudi
  government document types. Runs fire-and-forget via `setImmediate`.
- **Upload API** in `apps/web`:
  - `POST /api/upload/company-doc` — multipart, 10 MB max, starts async extraction
  - `GET /api/upload/status` — polling endpoint
  - `POST /api/companies/onboard` — saves company + moves uploaded files to
    permanent path `/var/makyn/uploads/{userId}/{companyId}/`
- **DB schema** — `CompanyDocument` model, `DocumentType` (28 values) +
  `ExtractionStatus` (5 values) enums, ~35 new nullable fields on `Company`.
  Migration SQL is at `packages/db/prisma/migrations/20260417210000_add_company_documents/`.
- **Seed** — 15 new `GovernmentBody` codes added.

### Deploy after merging the PR

```bash
ssh root@139.84.138.94

cd /opt/makyn

# Pull merged code
git pull

# Install new packages (@google-cloud/vision, pdf-to-img)
pnpm install

# Apply the new migration
pnpm --filter @makyn/db exec prisma migrate deploy

# Seed new government bodies
pnpm --filter @makyn/db seed

# Create upload directory (first time only)
mkdir -p /var/makyn/uploads
chown -R makyn:makyn /var/makyn/uploads

# Rebuild + restart
bash scripts/deploy.sh
```

### Environment vars needed for v1.1

These should already be in `.env` from v1. Confirm they are:

```
OPENAI_API_KEY=...        # already set (used by extraction pipeline)
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-vision.json  # already set
```

No new env vars needed.

### PR link

https://github.com/TARSYN-Studio/makyn-/pull/new/claude/funny-moore-4c6862

---

## 9. Current state (as of 2026-04-17 PM)

Mohammed tested v1 end-to-end. The acceptance flow works: signup →
add company → connect Telegram via deep-link → forward notice → Issue
appears on dashboard.

**Database is freshly cleaned.** Only data you'll see:

- 1 User (Mohammed's login)
- 2 Companies
- 0 Messages, 0 Issues, 0 Conversations
- 7 TelegramUpdate entries (idempotency ledger — don't wipe)
- 16 GovernmentBody + 35 NoticeTypeTemplate (seeded reference data)

Send a Telegram notice to the bot to generate real data.

---

## 10. Recent fixes (already deployed, don't redo)

- **Bot webhook ACK-first + idempotency** (commits `474e4f7`, `cc0caa9`):
  The webhook now returns 200 immediately and runs `bot.handleUpdate`
  in the background. Every `update_id` is recorded in the
  `TelegramUpdate` table with a unique index — retries hit P2002 and
  are skipped. Fixed a bug where the AI pipeline exceeded Telegram's
  10s deadline, causing Telegram to retry each update 10+ times and
  creating duplicate Issues.
- **SSR redirect on missing session** (commit `035af65`):
  `requireUser()` in `lib/session.ts` now calls `redirect("/login")`
  instead of throwing `"UNAUTHENTICATED"`. Fixed a bug where
  logged-out visitors to `/companies` etc. got a 500 instead of the
  login page.

**Webhook pattern matters for future bot work:** do not re-introduce
`webhookCallback` from grammY. `createWebhookServer` in
`apps/bot/src/bot/bot.ts` deliberately bypasses it to implement
fast-ACK + DB idempotency. If you need `bot.handleUpdate` somewhere,
remember to `await bot.init()` at startup first (see `apps/bot/src/index.ts`).

---

## 11. Things descoped from v1 — do NOT add unless asked

- **SMS / Unifonic**: stubbed. No `PhoneVerification` model exists.
  `User.phoneNumber` is nullable. Telegram-only for v1 testing.
- **next-intl**: not used. Thin Arabic/English dict at
  `apps/web/src/lib/i18n.ts`.
- **shadcn CLI**: not used. UI primitives written by hand in Tailwind
  at `apps/web/src/components/ui/`.
- **WhatsApp adapter**: stubbed in `packages/channels`. Types defined,
  no implementation.

---

## 12. Known open items

- `README.md` still describes v0 architecture (single bot, no
  dashboard). Needs rewrite — low priority.
- First-time TLS issuance on `app.makyn.site` can take 2–3 retry
  cycles if Caddy's cert cache is wiped. Let's Encrypt's
  multi-perspective validators occasionally fail from filtered
  networks. If you ever see `no certificate for domain`, wait 2 min
  and retry — don't change DNS.

---

## 13. Before you push anything

1. `git status` — confirm no `.env`, `makyn-*.json`, or
   `ca-certificate.crt` in staged files.
2. `pnpm -r typecheck` — or run `tsc --noEmit` in `apps/bot` and
   `apps/web` individually.
3. Commit with a clear "why" in the body, not just the "what".
4. Push to `main`, then run `deploy.sh` on the server.
5. Tail logs for ~30s after deploy to confirm clean startup.
6. If anything is destructive (dropping data, force push, disabling a
   feature): **ping Mohammed first**.

---

## 14. If something breaks

- **Bot not responding:** check `pm2 list` (is makyn-bot online?) →
  check `pm2 logs --err --nostream --lines 50` → check
  `getWebhookInfo` for pending updates + last error.
- **Dashboard 500:** check makyn-web error log. 99% of the time it's
  a missing env var (symlink broken) or a Prisma client out of sync
  with the schema (run `prisma generate` + redeploy).
- **"Environment variable not found: DATABASE_URL":** symlinks broken.
  Rerun `scripts/install.sh`.
- **TLS errors hitting `app.makyn.site`:** check Caddy
  (`systemctl status caddy`, `journalctl -u caddy -n 100`).

---

### v1.1-specific issues

- **Document upload failing with 401:** session cookie missing — user is
  not logged in or cookie expired.
- **Extraction stuck on PROCESSING:** check `pm2 logs --err` for Vision
  API errors. Most likely `GOOGLE_APPLICATION_CREDENTIALS` not set or
  the GCP SA JSON is missing at `/etc/secrets/gcp-vision.json`.
- **`/var/makyn/uploads` permission denied:** run
  `mkdir -p /var/makyn/uploads && chown -R makyn:makyn /var/makyn/uploads`.
- **Migration not applied:** `prisma migrate status` on the server will
  show the pending migration. Run `prisma migrate deploy`.
- **New Company fields missing from DB:** same as above — migration not
  deployed yet.

---

Welcome. Don't commit secrets, don't skip typecheck, and message
Mohammed before anything destructive.
