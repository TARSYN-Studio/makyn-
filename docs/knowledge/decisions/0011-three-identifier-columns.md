# ADR-0011: Three indexed identifier columns on Organization

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0007 (bulk upload), ADR-0009 (authority hierarchy), v1.5 Phase A

## Context
Saudi business registration uses multiple overlapping identifier
systems:

- **Commercial Registration Number (CR):** 10 digits, issued by
  MOCI. Historic identifier (pre-2015). Still printed on most
  documents. Examples: 2051247283, 2051236256.
- **Unified Number (الرقم الموحد):** 10 digits starting with 7.
  Introduced ~2021 as a cross-government identifier linking CR to
  GOSI, HRSD, ZATCA, Balady, Chamber of Commerce. Examples:
  7033107165, 7023947554.
- **National Number:** appears on some CR certificates and MOCI
  Registration Packages; overlaps with or aliases Unified Number
  depending on the doc generation.

Inbound government notices reference different identifiers depending
on the issuing agency: ZATCA notices cite the ZATCA TIN and
sometimes the CR; GOSI cites the GOSI number; MOCI cites either the
CR or the Unified Number; Balady cites its own ID. The matcher
must look up the same organization by any of these.

Additionally, the three CR format generations contribute different
identifier subsets: Gen 1 (pre-2015) has CR only; Gen 2 (2015-2021)
has CR; Gen 3 (2021+) is the MOCI Registration Package generation
and carries Unified + CR + linked-service IDs.

## Options considered
- **One identifier column (keep only CR):** simplest, breaks for
  post-2021 companies registered without a traditional CR
  (increasingly common) and for notices that cite Unified only.
- **Unified-only going forward:** cleaner than CR for new records
  but fails every old company in the database and every legacy
  doc format.
- **JSON blob with all identifier types:** flexible but unindexed,
  slow to query, hard to enforce uniqueness constraints.
- **Three separate indexed columns:** `unified_number`, `cr_number`,
  `national_number`. Each indexed for matcher lookups. Uniqueness
  per-column where appropriate.

## Decision
Add three indexed columns on `Organization`: `unified_number`
(10 digits starting with 7, `@unique`), `cr_number` (10 digits,
`@unique`), `national_number` (indexed, not unique — can collide
with owner's national ID on sole-prop entities). All nullable; no
single column is required. At least one must be present for
matcher lookups to succeed.

Validation rules enforced at extraction and at write time:
- `unified_number`: 10 digits, first digit = 7
- `cr_number`: 10 digits
- `zatca_tin`: 15 digits, starts with 3 (stored elsewhere; included
  here for completeness)
- `gosi_number`: 9 digits (verify against real samples during v1.5
  testing)

## Rationale
One-column designs fail because Saudi identifiers coexist in the
wild — a matcher that only knows one type can't route notices that
cite a different one. JSON blobs fail at index scale; the matcher
runs on every inbound notice and needs O(log n) lookups. Three
indexed columns match the real cardinality of identifiers on actual
documents, and the nullability handles the generational differences
(Gen 1 companies will have CR only; post-2021 sole-prop companies
might have only Unified).

Accepting: three columns is more schema surface than one. The cost
is three indexed columns' worth of storage and write overhead,
which is negligible at current and projected scale. The benefit is
every inbound notice can be routed regardless of which identifier
system the issuing agency uses.

## Consequences
- Matcher (`packages/core/matching/company-matcher.ts`) keys on
  `unifiedNumber` OR `crNumber` OR `nationalNumber` OR `zatcaTin`
  OR `gosiEmployerNumber`. Priority: unified > cr > national.
- Bulk upload clustering (ADR-0007) uses all three as "strong
  identifiers" for union-find edges. Shared value in any of the
  three creates a cluster edge.
- Authority hierarchy (ADR-0009) specifies which document wins when
  two docs disagree on the same identifier — MOCI Registration
  Package is canonical for Unified and CR.
- QR tokens are a fourth dedup signal (ADR-0008), stored separately
  from the three identifier columns.

## When to revisit
- If Saudi introduces a new identifier system (possible — DGA
  roadmap hints at further consolidation).
- When a validation rule fails on real customer data at rate >1%
  (meaning the rule is wrong, not the data).
- If matcher performance degrades — consider denormalized lookup
  tables or materialized matcher indexes at higher scale.