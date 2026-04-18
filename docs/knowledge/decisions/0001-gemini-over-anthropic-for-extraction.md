# ADR-0001: Gemini over Anthropic for document extraction

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0002 (Vertex AI path), v1.5 extraction rework

## Context
v1.5 extraction rework needs a vision-capable LLM to read Saudi
government PDFs — CRs, VAT certificates, MOCI Registration Packages,
Articles of Association, National Address proofs. PDFs are bilingual
(Arabic/English), often use subsetted fonts that break text extraction,
and span three CR format generations plus GAZT vs ZATCA VAT variants.
The chosen model runs on every customer upload forever.

Initial instinct was to add Anthropic Claude Sonnet 4.6 as a new vendor,
but MAKYN already had Google Cloud wired up for Vision API OCR.

## Options considered
- **Anthropic Claude Sonnet 4.6:** excellent Arabic, best structured
  output via forced tool-use schemas, ~$3/$15 per 1M input/output
  tokens. Requires new vendor, new API key, new billing relationship.
- **OpenAI GPT-4o:** good Arabic, mature JSON mode, ~$2.50/$10.
  Partially wired in current extraction code already.
- **Google Gemini 2.5 Pro/Flash:** strong Arabic (Google has the
  largest Arabic training corpus of the three providers — decade of
  search and OCR investment), good structured output in the 2.x
  generation. Dramatically cheaper: Flash ~$0.10 per 1M input.
  Already paying for Google Cloud for Vision OCR.

## Decision
Use Gemini 2.5 Pro as the default extraction model, with Gemini 2.5
Flash as the cost-optimized fallback for simpler document types.

## Rationale
Tool consolidation beats best-of-breed when the quality delta is
small. Arabic quality is at parity with Anthropic for Saudi government
documents. Zero new vendor overhead — same billing account, same IAM,
same dashboard. Cost at scale matters: Flash is 30× cheaper than
Sonnet, and the extraction call runs on every customer upload.
Accepting: slightly quirkier structured output than Anthropic, which
we mitigate with strict Zod validation on every response.

## Consequences
- One fewer vendor, API key, and billing relationship to manage.
- Need robust Zod validation on every extraction response; retry
  with Flash on validation failure before flagging for manual review.
- Accuracy tracked per doc-type in ExtractionAudit; Flash can be
  promoted to default for specific types if logs show it's
  sufficient, or Pro held as default where it isn't.

## When to revisit
- If per-doc-type logs show >5% Zod validation failures on any type.
- If Gemini pricing changes materially (e.g., Flash becomes paid-only
  with higher minimums).
- If Anthropic publishes a ME-region-hosted Claude model — would
  strengthen compliance posture vs. Google's current non-KSA hosting.
- When migrating to Saudi-region hosting (see hosting-residency-plan
  in domain docs).