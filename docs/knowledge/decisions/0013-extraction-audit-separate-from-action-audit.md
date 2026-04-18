# ADR-0013: Extraction audit and action audit are separate tables

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0001 (Gemini), ADR-0005 (multi-user), v1.4 audit_log, v1.5 extraction_audit

## Context
Two different "audit log" concepts appeared in overlapping specs:

- **v1.4 `audit_log`:** polymorphic table tracking member actions
  (invite/accept/remove, org create/update/delete, issue status
  changes, document uploads, channel connect/disconnect). Fields:
  `actor_user_id`, `organization_id`, `entity_type`, `entity_id`,
  `action`, `diff` (JSONB), `ip`, `user_agent`, `timestamp`.
- **v1.5 `extraction_audit`:** per-extraction forensic record
  (which model was used, input image hash, raw JSON output, Zod
  validation passed/failed, latency, token usage, rate-limit errors).
  Fields: `document_id`, `document_type`, `rasterized_image_hash`,
  `prompt_version`, `extracted_json`, `zod_validation_passed`,
  `latency_ms`, `token_usage`, `model_used`, `timestamp`, `user_id`.

The question: collapse into one polymorphic table, or keep them
separate?

## Options considered
- **Single polymorphic `audit_log`:** one table, all audit concerns.
  Reuses v1.4's shape. Extraction forensics (image hash, prompt
  version, raw JSON blob, token counts) stuff into the `diff` JSONB
  column.
- **Two separate tables:** `audit_log` for member actions,
  `extraction_audit` for extraction forensics. Different shapes,
  different retention policies, different query patterns.
- **Three tables:** split further into per-feature audit trails
  (issue audit, document audit, extraction audit, member audit).
  Rejected — over-normalized.

## Decision
Keep `audit_log` and `extraction_audit` as separate tables. Plus
preserve the existing flat AuditLog table under a new name
(`ai_event_log`) to retain continuity for AI pipeline logging that
doesn't fit either of the new tables.

## Rationale
The two concepts are operationally different:

- **Query patterns differ:** `audit_log` queries are user-scoped ("show
  me what admin X did in org Y") or entity-scoped ("show history of
  this issue"). `extraction_audit` queries are model-performance
  scoped ("what's Gemini Flash's failure rate on VAT certs?") and
  debugging-scoped ("why did this doc's extraction fail?").
- **Retention policies differ:** `audit_log` must respect PDPL
  retention (lifetime of parent org + 6 years post-soft-delete).
  `extraction_audit` can be pruned more aggressively once a doc's
  extraction is verified (e.g., 90 days after the doc's
  `extraction_status = confirmed`).
- **Schema cost of polymorphic is real:** stuffing `token_usage` and
  `rasterized_image_hash` into a JSONB `diff` column means no
  indexes, slow aggregate queries, and no Prisma type safety.
  Separate tables with dedicated columns give us the indexes and
  types we'd want to write anyway.
- **Failure modes differ:** extraction pipeline bugs produce
  extraction-audit-only anomalies; member permission bugs produce
  action-audit-only anomalies. Keeping them separate means a bad
  day in extraction doesn't bloat or slow member-action queries.

## Consequences
- Three audit-ish tables exist: `audit_log` (member actions, v1.4),
  `extraction_audit` (extraction forensics, v1.5), `ai_event_log`
  (renamed existing flat table, preserves historic AI pipeline logs).
- `audit_log` lands in v1.4 Commit A schema. `extraction_audit`
  lands in v1.5 Phase A schema. `ai_event_log` rename lands in v1.4
  Commit A as part of the schema rework.
- `writeAudit(...)` helper in `apps/web/src/lib/audit.ts` writes to
  `audit_log`. Extraction pipeline writes directly to
  `extraction_audit` at the end of each extraction call.
- Analytics on extraction performance (per-model success rate,
  avg latency, failure modes per doc type) become straightforward
  queries against `extraction_audit` rather than JSONB expression
  indexes.

## When to revisit
- If a third audit-like table appears (it probably will — channel
  events, billing events, etc.), consolidate into a pattern but
  don't retroactively merge.
- If storage cost of `extraction_audit` grows beyond projection
  (current estimate: 2KB per extraction × 1M extractions/yr = 2GB/yr
  — trivial), add compression or archival.
- If Prisma's polymorphic support improves enough to make type-safe
  JSONB queries ergonomic, reconsider — but not for v1.5.