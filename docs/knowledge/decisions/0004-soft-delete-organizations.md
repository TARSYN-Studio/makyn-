# ADR-0004: Soft delete for organizations, not hard delete

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0005 (multi-user architecture), PDPL compliance posture

## Context
v1.4 adds role-based permissions including "delete organization"
(OWNER role only). In a regulated-documents product handling Saudi
CRs, VAT certs, GOSI registrations, and ZATCA notices, the question
is what "delete" should actually do. Saudi ZATCA requires business
records retained for 6 years. PDPL requires clear handling of personal
data deletion requests. Simple `DELETE FROM organizations` is
almost always wrong in this domain.

## Options considered
- **Hard delete:** row removed, children cascade. Simplest code,
  worst compliance posture. No audit trail after deletion.
- **Soft delete (`isActive = false`):** existing schema already has
  the column. Row stays, children stay, org disappears from user's
  active list. Ambiguous timing — no record of when or by whom.
- **Soft delete with full audit (`deletedAt`, `deletedByUserId`):**
  adds timestamps and actor tracking. Clear retention semantics.

## Decision
Soft delete only, using `deletedAt` (timestamp) and `deletedByUserId`
(actor) alongside the existing `isActive` boolean. OWNER role is the
only role that can trigger soft-delete. `requireOrgAccess` rejects
soft-deleted orgs by default; admins may get a separate code path
later for audit/restore.

## Rationale
Hard delete is disallowed by our domain: regulatory records need to
survive accidental user action. Soft delete preserves the audit trail
and makes "delete my org" recoverable. The extra two columns
(`deletedAt`, `deletedByUserId`) pay for themselves the first time
someone asks "when was this deleted and by whom?" Cascade behavior
for related orgs is handled explicitly: soft-deleting an org does NOT
cascade to related orgs; `parent_subsidiary` edges become
`status: stale` on either side's soft-delete; stub organizations
(inferred from partner lists, see ADR-0010) have their edges hard-removed.

## Consequences
- A hard-delete cron job will eventually be needed for full PDPL
  "right to erasure" compliance. Scoped to v2+, after retention
  window passes (parent org lifetime + 6 years post-soft-delete).
- Queries must filter soft-deleted orgs by default; `requireOrgAccess`
  enforces this centrally.
- The `companies` DB table accumulates soft-deleted rows over time;
  acceptable at current scale, may need archival table at 10M+ rows.

## When to revisit
- Before first external customer launch (verify PDPL posture documented).
- When building the hard-delete job (v2+).
- If the `companies` table exceeds 5M rows and query performance degrades.