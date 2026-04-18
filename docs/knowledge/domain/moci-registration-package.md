# MOCI Registration Package (Saudi Business Center)

The single most valuable document in MAKYN's extraction pipeline. Issued by the Saudi Business Center (SBC) to all companies registered or re-registered under the 2021+ unified registration system. Contains the Unified Number plus every agency-specific identifier linked to it. One upload can populate 80% of an organization's MAKYN profile.

## Why this document matters

Before 2021, a Saudi business had to present a stack of agency-specific certificates to prove all its registrations: CR from MOC, VAT from ZATCA, GOSI from Social Insurance, Chamber membership, Balady municipal license, Nitaqat classification from HRSD. Each certificate carried one identifier, and a bookkeeper managing 20 client companies had to maintain 120+ documents.

The MOCI Registration Package consolidates all of this. One document, three pages, enumerates every linked registration. For MAKYN specifically: this document is the single extraction target where one upload produces one fully-populated organization profile.

This is why MOCI Registration Package is the highest-priority extraction target in v1.5. The classifier must reliably detect it, and the per-type schema must extract every field completely.

## Structure: three pages

Every MOCI Registration Package has the same three-page structure:

**Page 1 — QR cover sheet.**
Large QR code containing a verification URL (decoded token from `qr.mc.gov.sa/info/review?lang=ar&q=<token>`). Company name below the QR. CR Number printed below the QR as plain text. Saudi Business Center / Ministry of Commerce branding.

**Page 2 — Company data page.**
The detailed record: company name (Arabic), entity type and subtype, duration, addresses, capital, managers, authorities, commercial registration details including the renewal receipt number. **This page uses subsetted Arabic fonts with Private Use Area (PUA) Unicode codepoints that break text extraction.** Vision OCR or LLM vision is mandatory; text-based PDF extraction returns garbage.

**Page 3 — Linked services page.**
The block that makes this document so valuable. Enumerates agency IDs:
- **Ministry of Commerce** (unified number / establishment number)
- **HRSD** (Human Resources & Social Development / Ministry of Labor)
- **SPL** (Saudi Post / National Address)
- **ZATCA** (Zakat, Tax and Customs — tax identification number)
- **GOSI** (Social Insurance establishment number)
- **Federation of Saudi Chambers** (chamber membership number)
- **Balady** (municipal license — often shows "لا يوجد" meaning "None" for service-only companies)

Each row pairs an agency logo with its specific ID for this company. For companies without a specific registration (e.g., no employees → no GOSI number yet), the row shows "لا يوجد" (none), "تحت الإجراء" (in progress), or is omitted.

## Fields to extract (v1.5 Phase B schema)

```json
Null (not empty string) for missing linked services. The extractor prompt must explicitly handle the "لا يوجد" and "تحت الإجراء" strings by returning `null` for those service IDs.

## Validation rules

All identifiers must pass validation before being accepted. Implemented as pure functions in the core package's validators:

- `unified_number`: 10 digits, first digit must be `7`
- `cr_number`: 10 digits
- `zatca_number`: 15 digits, first digit must be `3`
- `gosi_number`: 9 digits (verify against more real samples during v1.5 testing)
- `chamber_number`: numeric, variable length (typically 6-8 digits)
- `hrsd_number`: numeric, variable length (typically 6-8 digits)

If any extracted value fails validation, flag for manual review rather than silently storing garbage. See ADR-0009 for the retry-once-with-Flash fallback pattern.

## What to do with the extracted data

After extraction succeeds and validation passes:

1. Populate Organization's three identifier columns: `unified_number`, `cr_number`, `national_number` (if present).
2. Store every linked service identifier on Organization: `zatcaTin`, `gosiEmployerNumber`, `chamberMembershipNumber`, `hrsdEstablishmentId`, etc.
3. Store QR token on ExtractionResult for dedup across future uploads of the same company.
4. Populate address fields from the address sub-object.
5. The partners list is NOT populated from MOCI Registration Package — partners come from the Articles of Association (authority hierarchy per ADR-0009).
6. Mark the extraction's `source_authenticated = true` based on QR decode success.

## Common edge cases in real documents

Observations from the sample PDF set:

**Linked services block may be partial.** Companies without a physical location skip Balady. Companies with no employees show "تحت الإجراء" on GOSI. Companies that haven't enrolled in the Chamber Federation skip that line. The extractor must tolerate any subset of the full linked services list.

**Some linked services pages show Arabic-Indic digits only.** The IDs may print as `٦٥٠٢٧٨٤٩٦` rather than `650278496`. The extractor prompt must normalize Arabic-Indic digits to Western digits before writing. Post-extraction validator re-asserts the format.

**Manager names can include multi-part titles.** Some registrations include honorifics or nisba (tribal affiliations). Extract verbatim — do not strip honorifics — so the stored value matches the printed document.

**CR expiry date may be absent.** The 2021+ reform included an "indefinite validity" option for some entity types. If no expiry date is printed, return `null`. Do NOT default to a date in the far future; downstream queries treat `null` as "indefinite," not as "expired."

## Detection from other signals

Even before the classifier reads the document content, layout signals identify a MOCI Registration Package:

- Three pages, structured as QR cover / data page / linked services page
- QR token decodes to `qr.mc.gov.sa` (not `qr.saudibusiness.gov.sa`, which is Gen 3 CR)
- Page 3 always contains agency logos arranged in a grid

The classifier can use any of these as a fast pre-check before the full extraction call, reducing cost by running cheaper Gemini Flash for classification and reserving Pro for the extraction itself.

## Versioning note

The linked services list has grown over time. Earlier packages (2021-2022) listed fewer agencies; later packages (2023+) include more. The extractor should not hardcode a fixed list — iterate the rows present on page 3 and extract whichever agency IDs are shown.

If Saudi Arabia adds a new agency to the linked services block (likely, given the Digital Government Authority's ongoing consolidation roadmap), the extractor should extract it as a generic `additional_linked_service` record and the schema will be extended in a future release. Do not reject documents with unrecognized service rows.
