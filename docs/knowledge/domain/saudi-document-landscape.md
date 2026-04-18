# Saudi Business Document Landscape

Reference overview of the document types MAKYN's extraction pipeline handles, how they relate to each other, and which government agency issues each. Used by anyone building extraction schemas, the matcher, or customer-facing doc flows.

## The seven document types in v1.5 scope

| Type (enum) | Arabic name | Issuer | Required for onboarding? |
|---|---|---|---|
| `CR_CERTIFICATE` | السجل التجاري | Ministry of Commerce (MOC) | Required |
| `MOCI_REGISTRATION_PACKAGE` | حزمة تسجيل الشركة | Saudi Business Center (SBC) | Required (for 2021+ companies) |
| `ARTICLES_OF_ASSOCIATION` | عقد تأسيس | MOC via Notary (Kitabat Al-Adl) | Required for multi-partner entities |
| `NATIONAL_ADDRESS_PROOF` | إثبات عنوان وطني | Saudi Post (SPL) | Required |
| `VAT_CERTIFICATE` | شهادة التسجيل في ضريبة القيمة المضافة | ZATCA (formerly GAZT) | Required if VAT-registered |
| `CHAMBER_MEMBERSHIP` | عضوية الغرفة التجارية | Federation of Saudi Chambers | Optional |
| `GOSI_REGISTRATION` | تسجيل التأمينات الاجتماعية | General Organization for Social Insurance | Required if has employees |

## How the documents relate

Saudi business registration is a layered system. One company has several identity facets — its commercial registration, its tax registration, its social insurance registration, its municipal license — each issued by a different agency, each with its own identifier. The documents we handle are the paper evidence of these registrations.

Before 2021, each agency operated somewhat independently. A company had a CR number (from MOC), a GOSI number (from Social Insurance), a chamber number (from the Chamber Federation), a VAT TIN (from GAZT), and so on. Notices flowed agency-by-agency with no cross-referencing.

In 2021, Saudi Arabia introduced the **Unified Number** (الرقم الموحد) as a cross-government identifier. All new company registrations now receive one Unified Number that links every agency registration together. The Saudi Business Center (SBC) issues the MOCI Registration Package, which explicitly enumerates the Unified Number and lists the agency-specific numbers it links to. For 2021+ companies, this document is the single most valuable extraction target — one upload gives MAKYN every identifier the matcher needs.

For companies registered before 2021, the Unified Number was backfilled onto their records but is not present on their original CR certificate. These companies require multiple documents to fully populate their MAKYN profile.

## Authority hierarchy (see ADR-0009)

When multiple documents disagree on a field, source authority wins over upload order. The per-field hierarchy is documented in ADR-0009. Summary:

- **Structural identity (Unified Number, CR Number, entity type, capital):** MOCI Registration Package is authoritative.
- **Governance (partners, signatories, profit splits):** Articles of Association (latest amendment) is authoritative.
- **Physical address:** National Address Proof is authoritative.
- **Tax registration:** VAT Certificate is authoritative for TIN and registration dates.

## Document generations

Most document types have multiple format generations in circulation because Saudi Arabia's digital government infrastructure has modernized in waves:

- **CR Certificate:** three generations (see `cr-format-generations.md`). Gen 1 pre-2015 (paper/scanned), Gen 2 2015-2021 (online PDF, no QR), Gen 3 2021+ (SBC-issued with QR).
- **VAT Certificate:** two generations (see `vat-gazt-to-zatca-transition.md`). Pre-June 2021 (GAZT letterhead), post-June 2021 (ZATCA letterhead).
- **National Address Proof:** two generations (see `national-address-format.md`). Pre-2022 (Arabic-only fields), post-2022 (bilingual fields).
- **Articles of Association:** a base document plus an ordered chain of amendments (see `articles-of-association-amendments.md`).

Any client might upload any generation of any type. The extraction pipeline must handle all of them without asking the user to identify the generation.

## What MAKYN does with each type at onboarding

1. **Classify:** Gemini 2.5 Pro identifies the document type from a lightweight vision call.
2. **Extract:** the per-type extraction schema pulls every field present on that document.
3. **Cluster:** union-find over strong identifiers (Unified, CR, VAT) groups documents belonging to the same company.
4. **Merge:** per-field authority hierarchy resolves conflicts across documents in the same cluster.
5. **Commit:** atomically creates the Organization, attaches documents, and writes audit entries.

See ADR-0007 (bulk upload as default pipeline) for why this is the flow for single-doc uploads as well.

## What MAKYN does with each type after onboarding

Inbound government notices (via Telegram, email, or future channels) are routed to the correct Organization by matching on whatever identifier the notice cites. The matcher keys on Unified Number, CR Number, ZATCA TIN, GOSI number, National Address customer account, and QR token — any of the above.

This is why all three identifier columns on Organization are indexed (see ADR-0011) and why the QR token is stored for dedup (see ADR-0008). A notice citing "CR 2051247283" and a notice citing "Unified 7033107165" should route to the same organization, and they will, because both identifiers are indexed on the same Organization row.

## Documents deliberately out of scope (v1.5)

The v1.0 schema defined 28 doc types covering every conceivable Saudi registration: Balady (municipal), SFDA (food & drug), Mudad (payroll), Muqeem (residency), CST (telecom), SAMA (banking), CMA (capital markets), MISA (investment), SASO (standards), Nitaqat (saudization), various MOJ/MOH/MOT/MOE/MOC/MOS licenses, and others.

These were aspirational — MAKYN never built extractors for them. v1.5 drops all 21 unused types and focuses on the 7 that represent actual customer onboarding needs. The agency IDs for Balady, Saudization, etc. are captured from the MOCI Registration Package's `linked_services` block rather than requiring separate certificate uploads.

If customer feedback reveals real demand for a specific dropped type, it can be added back with its own extraction schema.
