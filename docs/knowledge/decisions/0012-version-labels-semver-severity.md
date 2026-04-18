# ADR-0012: Version labels follow semver severity, not chronology

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** roadmap/shipped.md, roadmap/in-flight.md

## Context
The extraction rework was initially labeled "v1.3.1" by the
implementing agent, implying a patch release to v1.3. Over the
course of spec review, the scope expanded to include: switching
extraction model (Anthropic→Gemini), new doc-type enum (7 types
replacing 28), three new indexed identifier columns, a new
ExtractionAudit table, new extraction pipeline (OCR+text-LLM →
vision-direct), bulk upload as the default pipeline, five new
tables for clustering, cross-doc relationship detection, stub
organization creation, per-field authority hierarchy, amendment
reconciliation, and a review UI.

That's not a patch. Semantic versioning says patch releases fix
bugs without adding features or changing interfaces. This release
adds many features and changes several interfaces.

## Options considered
- **Keep v1.3.1 label:** already in commit messages and doc
  filenames. Renaming is churn.
- **Call it v1.4:** but v1.4 is already in flight (multi-user
  memberships + audit log). Two in-flight releases can't share a
  number.
- **Skip to v1.5:** cleanly separates from v1.4, accurately
  represents the scope of change.

## Decision
Rename internal use of "v1.3.1" to "v1.5" going forward. All new
commit messages, release notes, and conversation use v1.5. Existing
doc filenames referencing v1.3.1 may be left as-is (rename is
optional; grep-ability is preserved by the filename itself).

Version number policy going forward:
- **Patch (v1.5.1):** bug fixes, no new user-facing features, no
  schema changes, no breaking changes.
- **Minor (v1.6):** new features, additive schema changes (new
  columns, new tables), backward-compatible changes to existing
  interfaces.
- **Major (v2.0):** breaking changes — removed features, renamed
  APIs, schema migrations users must adapt to.

## Rationale
Version numbers are communication. When a future engineer or investor
asks "what shipped in 2026?" the answer should be legible at a
glance — major steps forward should look like major steps forward,
not hide behind patch numbers. Calling the extraction + bulk upload
rework v1.3.1 would understate both the engineering scope and the
user-facing impact.

Renaming is cheap now (13 commits on a branch, not yet merged) and
expensive later (once shipped, changing version numbers in release
notes confuses everyone). Doing it now.

## Consequences
- Spec review doc at `docs/v1.3.1-spec-review.md` is renamed to
  `docs/v1.5-spec-review.md` in the same pass as content updates.
- Commit messages going forward use "v1.5" prefix: `feat(web v1.5):`,
  `chore(db v1.5):`, etc.
- v1.4 stays labeled v1.4. v1.4.1 is reserved for the org-switcher
  follow-up (a genuine minor bump after v1.4 Commit B ships).
- Future scope expansions trigger re-labeling proactively. If v1.6
  grows into a major change mid-flight, re-label to v2.0 before
  shipping, not after.

## When to revisit
- Never as a policy change. Version numbers are what they are per
  semver. But: when a release's scope grows mid-stream, ADR-0012
  is the reminder to check whether the number still matches.