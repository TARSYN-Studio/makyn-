# ADR-0009: Per-field authority hierarchy for multi-document merge

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0007 (bulk upload), v1.5 Phase B clustering logic

## Context
Bulk upload (ADR-0007) means one organization is typically
constructed from multiple documents: CR certificate, MOCI Registration
Package, Articles of Association, VAT certificate, National Address
Proof. Each document contains overlapping fields — company name,
CR number, capital, managers, address — that may disagree.

Concrete example from the sample PDF set: Netaj Industrial Holding's
CR certificate shows the English name "Nataaj AlSinaaiyya Holding
Company" (transliteration). Its Articles of Association shows the
Arabic name "شركة نتاج الصناعية القابضة" (legal name). The English
version on the MOCI Registration Package differs slightly again.
Neither is "wrong" — they are different canonical names, and the
merge layer must decide which wins when reconciling into a single
organization profile.

## Options considered
- **First-write-wins:** whichever doc is uploaded first sets each
  field; later uploads skip non-null fields. Fails if the first doc
  has an OCR-garbled name — the error persists and gets enriched
  onto subsequent correct uploads instead of being corrected.
- **Last-write-wins:** latest upload overrides. Erratic — merge
  result depends on upload order, not on which doc is authoritative.
- **User-picks-on-conflict:** every disagreement prompts the user.
  Unworkable at bulk-upload scale: 60 docs × 10 overlapping fields
  = 600 prompts.
- **Per-field authority hierarchy:** rank document types by
  authority per field type. Authoritative source wins automatically;
  user only sees conflicts that can't be resolved by hierarchy.

## Decision
Apply a per-field authority hierarchy during cluster-stage merge.
Higher-authority source wins over lower; user is surfaced only
where hierarchy is ambiguous (same authority level, conflicting
values). The field-by-field priority:

- **Arabic legal name:** MOCI Registration Package > Articles of
  Association > CR Certificate > VAT Certificate
- **CR number:** MOCI Registration Package > CR Certificate > any
  doc referencing it
- **Unified number:** MOCI Registration Package > CR Certificate
  (Gen 3) > QR-decoded token (when token maps to a Unified number)
- **Capital:** Articles of Association > MOCI Registration Package >
  CR Certificate
- **Partners/shareholders:** Articles of Association (latest
  amendment, see ADR below) > MOCI Registration Package > null
- **Registered address:** National Address Proof > MOCI Registration
  Package > CR Certificate

Every extracted field stores its source document ID. The UI can
show "this value came from the MOCI Registration Package" on
hover for any org profile field.

## Rationale
Authority is real in this domain — MOCI Registration Package is
government-authoritative for most structural fields, Articles of
Association is authoritative for governance and partner structure,
National Address Proof is authoritative for physical address.
Following authority in code matches the source-of-truth reality
in the Saudi business registration system. Users don't want to
be asked "which CR number is correct?" when MOCI and an old
GAZT-era VAT cert disagree — MOCI is right, period.

Amendment reconciliation is handled separately (see v1.5 merge
layer spec): AoA amendments (ملحق عقد التأسيس) are processed as
diffs over the original AoA. Fields explicitly changed by the
amendment win; fields untouched fall back to the original. This
is cluster-stage logic, not a separate merge pass.

## Consequences
- Merge layer implementation is deterministic and testable —
  given a set of extractions, the merged output is the same
  regardless of processing order.
- Every merged field has provenance: the source doc ID is stored
  alongside the value, so users can trace "where did this come
  from" when reviewing or correcting.
- Conflicts remaining after hierarchy application are surfaced in
  the review UI with a "force overwrite" option. Rare, but must
  exist — e.g., user realizes their old MOCI package is wrong and
  a newer one supersedes it.
- New document types must be slotted into the hierarchy when added,
  not appended arbitrarily. The hierarchy is a maintained artifact.

## When to revisit
- When adding a new document type to the 7-type enum.
- If user complaints reveal a systematic authority inversion (e.g.,
  MOCI data is reliably stale for a specific field).
- If supersession rules become complex enough to warrant their own
  layer (currently: newer documents of the same type supersede
  older within a cluster — both retained, older flagged).