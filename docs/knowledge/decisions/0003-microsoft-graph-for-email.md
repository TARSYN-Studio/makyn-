# ADR-0003: Microsoft Graph API for transactional email (internal phase)

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** v1.4 Commit B (invitations), future external launch

## Context
v1.4 multi-user architecture requires magic-link invitations sent via
email. MAKYN has no transactional email provider wired up — only a
stubbed Unifonic client for SMS. The domain `makyn.site` is registered
on an active Microsoft 365 business subscription, with DNS records
(SPF, DKIM, DMARC) already configured for Microsoft-originated mail.
Current user base is internal (team dogfooding only), not external
paying customers.

## Options considered
- **Resend:** Node-first DX, $0 for 3,000 emails/month, $20/mo
  after. Requires new vendor, new API key, DNS setup on `makyn.site`
  for their sending IPs.
- **AWS SES:** cheapest at scale ($0.10 per 1,000), but MAKYN is on
  Vultr not AWS — setup means a new AWS account, IAM, and sender
  verification. Detour.
- **SendGrid:** worst DX of the majors, frequent deliverability
  issues on shared IPs. Rejected.
- **Microsoft Graph API via existing M365:** already paying for it,
  `makyn.site` already verified on the tenant, SPF/DKIM/DMARC
  already correct. Send via `POST /users/{sender}/sendMail`. Throttled
  at 30 messages/minute and 10,000 recipients/day per mailbox.

## Decision
Use Microsoft Graph API via the existing M365 subscription for
transactional email during the internal dogfooding phase. When
onboarding external customers, migrate to a dedicated transactional
provider (Resend or AWS SES).

## Rationale
"Use what you're already paying for" before adding vendors. For
internal dogfooding we send maybe 5–50 invites total — nowhere near
Graph's throttle limits, and we don't need click analytics or
deliverability dashboards for team members emailing each other. The
M365 sender reputation is excellent for small-volume transactional
traffic. We accept the throttle and the lack of analytics because
volume is low; we'll revisit when external customers arrive.

## Consequences
- Must register an app in Entra ID, grant `Mail.Send` application
  permission (admin consent, client credentials flow — not delegated).
- Env vars: `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`,
  `GRAPH_SENDER_UPN`.
- Implementation abstracts behind an `EmailService` interface
  (`sendEmail({to, subject, html, text})`). Swapping providers later
  is a one-file change, not an invite-flow rewrite.
- Sender: `invites@makyn.site`, friendly-from "MAKYN Invites",
  reply-to a monitored inbox.

## When to revisit
- Before onboarding the first external paying customer.
- If monthly invite volume approaches 5,000 (throttle headroom shrinking).
- If deliverability issues appear — transactional providers have
  dedicated IPs and feedback loops that M365 doesn't.