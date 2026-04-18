# ADR-0007: Bulk upload as the default extraction pipeline

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0001 (Gemini), ADR-0009 (authority hierarchy), v1.5 Phase A schema

## Context
The initial extraction flow assumed one document per upload: user
picks doc type, uploads PDF, system extracts, fields land on the
organization. This flow doesn't match how target customers actually
have their documents. Accounting firms onboarding 12 clients receive
folders of 60 mixed PDFs. A single business owner typing details
usually has 4–6 docs on their desktop already. Forcing one-doc-at-a-
time with per-file type declaration is the single biggest friction
point in the onboarding flow — and the reason MAKYN can be the
"drop your folder, we figure out the rest" product for firms
managing multiple client orgs.

## Options considered
- **Single-doc pipeline only:** simplest. Users upload one file at
  a time, declare type each time. Breaks the multi-client firm case.
- **Single-doc as default, separate "bulk mode" path:** two code
  paths to maintain. Bulk mode becomes second-class, stays buggy.
- **Bulk upload as the only pipeline (N=1 for single):** every upload
  goes through classify → extract → cluster → review → commit.
  Single-doc is just N=1 with a trivial review step.

## Decision
Bulk upload is the only pipeline. Every upload — whether one file or
one hundred — routes through the same flow: classify each doc with
Gemini, extract via per-type schema, build identifier graph via
union-find, cluster into proposed organizations, present a review UI
before commit, atomically commit the batch on user confirmation.

New tables landing in v1.5 Phase A: `BulkUpload` (batch record with
status machine), `ProposedCluster` (transient cluster state),
`ExtractionResult` (persistent per-file record), `OrganizationRelationship`
(parent/subsidiary edges), plus `Organization.source` enum
(`user_created | inferred_from_partner_list | imported_from_bulk`).

## Rationale
One pipeline is dramatically cheaper to maintain than two. The
"review" step for a single-doc upload is trivial (one cluster, one
doc, confirm) so the unified flow costs little for simple cases.
For firm customers the pipeline is transformative — drop 60 PDFs,
get 12 proposed orgs with docs attached, split/merge as needed,
commit in one transaction. Every feature premise (fuzzy name
matching, supersession, stub orgs, corporate-shareholder edges)
requires the cluster stage, so collapsing it into a "bulk mode
only" branch would mean single uploads miss out on those
behaviors or duplicate the code.

## Consequences
- Single-doc uploads go through BulkUpload → one ProposedCluster.
  The review UI must render gracefully for N=1 (usually auto-confirm
  if no conflicts).
- Schema complexity is higher than single-doc-only would be. Four
  new tables plus one enum column on Organization.
- All extraction-time logic (authority hierarchy, amendment
  reconciliation, stub creation) runs at cluster-build time, not
  at write time. Commit is the atomic boundary.
- Re-uploads of existing orgs route through "attach to existing"
  rather than creating duplicates — idempotent by design.
- Merge, split, reassign, discard all happen pre-commit. Nothing
  writes to `organizations` until user confirms.

## When to revisit
- If the review UI becomes a bottleneck for single-doc users
  (measure: time from upload to commit for N=1 cases).
- When adding a new doc type — verify it fits the classify-extract-
  cluster flow without special cases.
- If clustering accuracy drops below 90% on real customer uploads,
  revisit the threshold and the identifier hierarchy in ADR-0009.