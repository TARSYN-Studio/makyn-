# ADR-0006: Issue creator as three fields, not one

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0005 (multi-user), v1.6+ bot routing

## Context
The v1.0 Issue model had a single `ownerId` field representing who
"owned" the issue — both the user who caused the record to exist and
the implied assignee. This collapsing worked when every user owned
their own company and acted alone. In multi-user + bot-detection +
multi-org routing, it doesn't: an issue can be detected by a bot
(no human creator), forwarded by one user but assigned to another
(different creator and assignee), or routed to an org via identifier
match (creator and destination org are separate concepts).

## Options considered
- **Keep single `ownerId`, overload meaning:** simplest migration,
  but ambiguous semantics produce bugs and block future features.
- **Split into `createdBy` and `assignedTo`:** two fields, better
  but still conflates detection source with human authorship.
- **Three fields: `detectedBy` + `createdByUserId` + `assignedToUserId`:**
  fully separates the three orthogonal concepts. No ambiguity.

## Decision
Split into three columns on Issue:

- `detectedBy` (enum, required): `HUMAN | BOT | INBOUND_TELEGRAM |
  INBOUND_EMAIL | SYSTEM`. What surfaced this issue into MAKYN.
- `createdByUserId` (nullable FK): the human user who caused the
  record to be created. Null for pure bot/system detection.
- `assignedToUserId` (nullable FK): who is responsible for resolving
  it. Stays null in v1.4; will be populated by routing logic in v1.6+.

Plus six trace fields for cross-org audit (`sourceChannel`,
`sourceUserId`, `matchedByIdentifier`, `matchedToOrganizationId`,
`matchConfidence`, `needsManualRouting`) to handle the accounting-firm
case where one user is a member of many orgs.

## Rationale
Shape the schema correctly now so future features (assignment
workflows, bot routing, SLA tracking, handoff between users) add
behavior without requiring migrations. The marginal cost of three
columns vs. one is zero; the cost of collapsing them and migrating
later is high. Trace fields exist because with many-orgs-per-user,
ambiguous matching becomes real and every auto-routing decision
needs to be traceable after the fact.

## Consequences
- `Issue.organizationId` becomes nullable — the "manual routing
  queue" contains issues whose matcher couldn't confidently assign
  them to any org the forwarding user belongs to.
- Query patterns change: `where: { ownerId }` no longer works. Routes
  filter by `{ organizationId: { in: listUserOrgIds(userId) } }`.
- Bot routing in v1.6+ has a clean target: set `assignedToUserId` +
  `organizationId` based on rules; `detectedBy` and `createdByUserId`
  stay immutable after creation.
- Supersession/dedup (when the same notice arrives twice) is not
  handled in this ADR; revisit in v1.5 or v1.6.

## When to revisit
- When building assignment workflows or SLA tracking.
- When implementing notice deduplication (two Telegram forwards of
  the same ZATCA notice should not create two issues).
- If a fifth `detectedBy` source appears — enum extends cleanly.