# ADR-0002: Vertex AI over AI Studio for Gemini access

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0001 (Gemini choice), hosting-residency-plan

## Context
Having chosen Gemini for extraction (ADR-0001), there are two paths
to call Gemini from production code: Google's AI Studio (developer
key-based, simpler) or Vertex AI (Google Cloud's enterprise ML
platform, service account-based). The MAKYN codebase already
authenticates to Google Cloud via a service account for Vision OCR
(`GOOGLE_APPLICATION_CREDENTIALS`).

## Options considered
- **AI Studio with `GEMINI_API_KEY`:** fastest to set up (paste one
  key in env, install `@google/generative-ai`). Separate billing
  surface from existing GCP usage. No region pinning — calls hit
  Google's consumer endpoints. Quota caps are less transparent.
- **Vertex AI with existing service account:** enable the Vertex AI
  API on the current GCP project, grant `roles/aiplatform.user` to
  the existing service account, use `@google-cloud/vertexai` SDK.
  Same IAM, same billing, same dashboard as Vision OCR. Region can
  be explicitly pinned. Quotas visible and raiseable in GCP console.

## Decision
Use Vertex AI. Reuse the existing service account already configured
for Vision OCR; grant `roles/aiplatform.user`. Region starts at
`us-central1` with a TODO to migrate to `me-central2` (Dammam) when
doing Saudi data residency work.

## Rationale
One IAM surface, one billing invoice, one authentication mechanism
for the same provider. The small simplicity advantage of AI Studio
(paste-a-key) matters for day-one dogfooding, but not for production.
Vertex aligns with our eventual Saudi residency trajectory — Gemini is
available in me-central2, AI Studio endpoints have no regional
guarantees. We accept a slightly more involved initial setup (IAM role
grant, different SDK) in exchange for a cleaner production posture.

## Consequences
- No new environment variable needed — reuses `GOOGLE_APPLICATION_CREDENTIALS`.
- Must use `@google-cloud/vertexai`, not `@google/generative-ai`.
- Region is an explicit configuration, not a default. Change requires
  code deploy, not just env swap.
- Verify the exact Gemini 2.5 Pro model ID available on Vertex for
  each region at deploy time; suffix naming occasionally varies.

## When to revisit
- If Vertex's per-region model availability lags AI Studio by more
  than one minor version for a feature we need.
- When doing the Saudi residency migration — confirm me-central2
  still supports the model we're using.