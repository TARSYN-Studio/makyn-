# Commercial Registration (CR) Format Generations

The Saudi Commercial Registration certificate has three format generations in active circulation. Each differs in layout, identifier content, and extractability. Customer uploads contain a mix — accountants managing legacy clients will have Gen 1 scans, new companies only have Gen 3. The extraction pipeline must handle all three.

## Identifying the generation

The extraction prompt must determine generation before applying a schema. Heuristics, in order of reliability:

1. **QR code present?** Gen 3 only. Gen 1 and Gen 2 have no QR. The QR domain is also diagnostic: `qr.saudibusiness.gov.sa` is Gen 3 CR, `qr.mc.gov.sa` is Gen 2 MOCI Package (see ADR-0008).
2. **Layout style.** Gen 1 is multi-column bilingual form on official MOC letterhead. Gen 2 is a single-column PDF with a structured table. Gen 3 is a minimal card-style one-page layout with large company name and a handful of bullet fields.
3. **Unified Number printed?** Only Gen 3 (introduced 2021).
4. **Scan quality.** Gen 1 is often a scan of a paper original and has OCR artifacts. Gen 2 is born-digital, clean. Gen 3 is born-digital, extremely clean.

## Generation 1 (pre-2015): bilingual paper form

**Visual signature:** MOC letterhead top-left, Vision 2030 logo top-right, dense multi-column form with Arabic on the right and English on the left.

**Fields typically present:**
- Company trade name (AR + EN transliteration)
- CR number (10 digits, typically starts with 2, 3, 4, or 5)
- Company nationality ("Saudi Arabia")
- Duration ("30 year"), start date (Hijri + Gregorian), end date
- Head Quarter (address, city, sometimes street)
- Total capital (in SAR)
- Managers (up to 18 numbered slots, typically 1-3 populated)
- Manager authorities ("As stipulated in the company's contract")
- Issuing city
- Validity end date (Hijri + Gregorian)
- Ticket number (the serial that issued this certificate)
- Certificate department manager name + signature

**What's NOT on Gen 1:**
- Unified Number (didn't exist)
- National Number (sometimes aliased to CR)
- Linked services list
- QR code

**Extraction confidence:** medium. OCR quality varies with scan quality. Hand-annotated versions exist — treat any handwriting as extraction failure signal, not as data.

## Generation 2 (2015–2021): online-issued PDF

**Visual signature:** born-digital single-column PDF, dark blue MOC header, fields laid out as labeled sections, sometimes includes a structured services table.

**Fields typically present:**
- Same as Gen 1
- Plus: sometimes a services-rendered block showing Balady, HRSD, Social Insurance, Zakat IDs

**What's NOT on Gen 2:**
- Unified Number (still pre-2021)
- QR code

**Extraction confidence:** high. Born-digital, consistent formatting, clean OCR. The main extraction risks are Arabic-Indic digit normalization (١٠٠٬٠٠٠ vs 100,000) and Hijri-to-Gregorian date conversion.

## Generation 3 (2021+): single-page minimal with QR

**Visual signature:** dramatically simpler layout than prior generations. Large company name top of page, 5 bullet fields (Unified Number, Issue Date, Entity Type, Company Characteristics, Status), QR code occupying the right half or bottom-center. Modern MOC / Saudi Business Center branding with Vision 2030 iconography.

**Fields typically present on the printed page:**
- Company name (Arabic, sometimes transliterated English below)
- Unified Number (10 digits starting with 7) — this is new in Gen 3
- Release date (Gregorian)
- Entity type (LLC, JSC, etc.)
- Company characteristics (e.g., "Holding")
- Registration status (Active / Suspended)

**Fields NOT on the printed page but reachable:**
- CR Number — often encoded in the QR token. The QR on Natej Rubber's Gen 3 CR decodes to a URL containing the CR lookup token.
- Linked agency IDs — only on the separate MOCI Registration Package, not on the standalone CR certificate.

**Extraction confidence:** very high for the fields that are printed. Limited field set means most fields MAKYN needs for a full profile must come from other documents (MOCI Registration Package, Articles of Association). A Gen 3 CR uploaded alone produces a ~20%-complete org profile.

## The Gen 3 isolation problem

A customer who uploads only a Gen 3 CR has given MAKYN very little to work with. Onboarding UX must handle this gracefully: extract what's on the page, display clearly what's missing, and prompt for the companion documents that would complete the profile.

Most commonly needed companion docs:
- **MOCI Registration Package** — fills CR Number, capital, managers, address, and linked agency IDs.
- **Articles of Association** — fills partners, shareholdings, authorized signatories.
- **National Address Proof** — fills physical address with short code and postal code.

Design intent: never treat a Gen 3 CR upload as a failure. It's a valid starting point; the system prompts for more.

## Sample set of Gen 3 CRs in the fixtures

The test set contains six Gen 3 CRs covering different company types: Natej Rubber Industrial (operating subsidiary), Netaj Metals, Gulf Wooden Industries Factory, Badira Catering, Gulf Wooden Platforms Factory, and Natej Rubber (newer re-issued version). All share the same layout. Any extractor that handles one correctly should handle all of them. The regression fixture set is the permanent ground-truth against which extraction accuracy is measured.
