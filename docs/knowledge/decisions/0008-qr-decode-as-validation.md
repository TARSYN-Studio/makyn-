# ADR-0008: QR decode as validation layer, not extraction path

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0001 (Gemini extraction), ADR-0007 (bulk upload)

## Context
Saudi MOCI-issued documents (CR certificates, MOCI Registration
Packages) carry QR codes. The instinct was to investigate whether
QRs could replace or front-run OCR/vision extraction — decode the
QR, hit the government verification endpoint, get structured data
back. QRs decode reliably from real documents (~95%+ with OpenCV's
built-in QR detector, 50ms per page, no external dependencies).

However, the data *behind* the QR is the problem. Sample decodes
from the sample PDF set produced URLs in two families:
`https://qr.mc.gov.sa/info/review?lang=ar&q=<base64 token>` and
`https://qr.saudibusiness.gov.sa/viewcr?nCrNumber=<base64 token>`.
The token is opaque (base64-encoded, probably encrypted server-side
lookup ID) — not a plaintext CR or Unified number. The URL points
to a human-facing verification webpage, not a developer JSON API.
Gen 2 MOCI Registration Packages don't have verification QRs on
their data pages at all.

## Options considered
- **QR-first extraction (decode → fetch URL → scrape HTML):** bypasses
  OCR entirely when QR is present. Network-dependent, likely
  rate-limited or IP-blocked by the Saudi government, ToS-risky
  (verification portals typically prohibit automated access), fragile
  to HTML layout changes, doesn't work for Gen 2 MOCI packages.
- **QR-only-as-validation:** decode QR locally, store the token as a
  stable per-company identifier, use it for dedup and as an
  authenticity signal. Never fetch the URL.
- **Both:** mandatory OCR/vision extraction + QR decode in parallel,
  results merged at cluster stage. Best of both worlds if
  government ever publishes a real API.

## Decision
Vision extraction via Gemini is always primary, authoritative, and
runs on every document. QR decode runs in parallel, always, as a
secondary layer. Decode locally with OpenCV's `QRCodeDetector`. Store
the raw token on the ExtractionResult row. Never fetch the URL behind
the QR. Never scrape the verification page.

QR's role in the pipeline:
- Deduplication: same token across different uploads = same company.
- Authenticity flag: QR decodes to known gov domain → mark doc
  `source_authenticated: true`. Useful but not gating.
- Cross-doc bridging for sparse Gen 3 CRs: QR token acts as an
  additional identifier entering the union-find clustering graph.
- Future-proof hook: when/if Saudi publishes a real JSON API, swap
  the "no fetch" rule for an API call; everything else stays.

## Rationale
QR data isn't self-contained — the token requires an external call
to resolve. Every resolution is a new failure mode: network
availability, rate limits, CAPTCHAs, geofencing, bot detection,
ToS exposure, HTML brittleness. Vision extraction via Gemini has
none of these: one provider, known SLA, controllable cost. The
marginal value of "maybe the government will serve us JSON one day"
doesn't justify architecting around it. Meanwhile, the cheap half
of QR handling — local decode — is genuinely useful for dedup and
as a bridging identifier, at ~50ms and zero marginal cost.

## Consequences
- Extraction pipeline is independent of Saudi government network
  availability. MAKYN onboarding works at 3am on a national holiday.
- Every Document row stores a QR token when present (nullable).
  Dedup queries index on it.
- Two QR URL families recognized as validation-worthy domains:
  `qr.mc.gov.sa` and `qr.saudibusiness.gov.sa`. Other domains don't
  flip the `source_authenticated` flag.
- Same company's Gen 1 English CR and Gen 3 Arabic CR share the
  same token across language variants — confirmed against sample
  PDFs. This is useful for dedup: re-uploads with different
  language versions don't create duplicate organizations.

## When to revisit
- If Saudi Business Center or MOCI publishes a real JSON verification
  API — convert the "no fetch" rule to an API lookup. Token becomes
  the lookup key.
- If QR tokens ever change format (e.g., government rotates token
  schema) — the dedup logic needs to tolerate token migration.
- If vision extraction accuracy drops and we need a secondary source
  for validation — revisit whether HTML scraping is justified
  despite the risks.