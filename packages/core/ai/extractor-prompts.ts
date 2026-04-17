import type { DocumentType } from "@makyn/db";

export const EXTRACTOR_PROMPT_VERSION = "v1.1.0";

// Shared foundational rules injected into every prompt
const SHARED_RULES = `
Rules:
- Output ONLY valid JSON matching the schema — no prose, no markdown fences.
- Use null for any field you cannot confidently determine. Do NOT guess.
- Dates: prefer YYYY-MM-DD. If only Hijri is present, convert to Gregorian and add a note in the "notes" field.
- Amounts are always in SAR (Saudi Riyals).
- Saudi identifier formats: CR = 10 digits starting 1/2/4/7. TIN = 15 digits starting 3. National ID = 10 digits starting 1 (Saudi citizen) or 2 (resident).
- confidence: a float 0.0–1.0 reflecting how complete and legible the data was.
- notes: short string describing any caveats, partial reads, or unclear fields. Null if nothing to note.
`.trim();

export const EXTRACTOR_PROMPTS: Record<DocumentType, string> = {
  COMMERCIAL_REGISTRATION: `
You are extracting data from a Saudi Commercial Registration (سجل تجاري) certificate.

Return JSON with this exact shape:
{
  "cr_number": string | null,
  "legal_name_ar": string | null,
  "legal_name_en": string | null,
  "trade_name_ar": string | null,
  "business_type_ar": string | null,
  "business_type_en": string | null,
  "owner_name_ar": string | null,
  "owner_national_id": string | null,
  "capital_sar": number | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "activities_ar": string | null,
  "city_ar": string | null,
  "region_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  ZATCA_VAT_CERTIFICATE: `
You are extracting data from a Saudi ZATCA VAT Registration certificate (شهادة تسجيل ضريبة القيمة المضافة).

Return JSON with this exact shape:
{
  "zatca_tin": string | null,
  "vat_registration_number": string | null,
  "legal_name_ar": string | null,
  "commercial_registration_number": string | null,
  "vat_effective_date": string | null,
  "tax_period": string | null,
  "business_address_ar": string | null,
  "confidence": number,
  "notes": string | null
}

The TIN (رقم تعريف دافع الضريبة) is 15 digits starting with 3.
${SHARED_RULES}
`.trim(),

  ZAKAT_ASSESSMENT: `
You are extracting data from a Saudi Zakat assessment notice (إشعار ربط زكوي).

Return JSON with this exact shape:
{
  "zakat_base_sar": number | null,
  "assessment_year_hijri": string | null,
  "assessment_year_gregorian": string | null,
  "commercial_registration_number": string | null,
  "legal_name_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  CHAMBER_OF_COMMERCE: `
You are extracting data from a Saudi Chamber of Commerce membership certificate (شهادة عضوية غرفة التجارة).

Return JSON with this exact shape:
{
  "membership_number": string | null,
  "chamber_region_ar": string | null,
  "legal_name_ar": string | null,
  "membership_class": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  GOSI_REGISTRATION: `
You are extracting data from a Saudi GOSI employer registration certificate (شهادة تسجيل التأمينات الاجتماعية).

Return JSON with this exact shape:
{
  "gosi_employer_number": string | null,
  "legal_name_ar": string | null,
  "registration_date": string | null,
  "employee_count": number | null,
  "saudi_employee_count": number | null,
  "business_activity_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  QIWA_ESTABLISHMENT: `
You are extracting data from a Saudi Qiwa platform establishment certificate (شهادة منشأة من منصة قوى).

Return JSON with this exact shape:
{
  "qiwa_establishment_id": string | null,
  "legal_name_ar": string | null,
  "saudization_category": string | null,
  "mol_file_number": string | null,
  "establishment_type": string | null,
  "confidence": number,
  "notes": string | null
}

saudization_category values: Platinum / Green / Yellow / Red (بلاتيني / أخضر / أصفر / أحمر)
${SHARED_RULES}
`.trim(),

  MUDAD_CERTIFICATE: `
You are extracting data from a Saudi Mudad WPS (Wage Protection System) compliance certificate (شهادة مدد لحماية الأجور).

Return JSON with this exact shape:
{
  "mudad_wps_compliant": boolean | null,
  "last_update_date": string | null,
  "bank_iban_registered": boolean | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MUQEEM_ACCOUNT: `
You are extracting data from a Saudi Muqeem (مقيم) account certificate or document.

Return JSON with this exact shape:
{
  "muqeem_account_number": string | null,
  "moi_700_number": string | null,
  "establishment_name_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  BALADY_LICENSE: `
You are extracting data from a Saudi Balady municipal license (رخصة بلدية من منصة بلدي).

Return JSON with this exact shape:
{
  "balady_license_number": string | null,
  "license_type_ar": string | null,
  "activity_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "municipality_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  CIVIL_DEFENSE_CERT: `
You are extracting data from a Saudi Civil Defense safety certificate (شهادة الدفاع المدني للسلامة).

Return JSON with this exact shape:
{
  "cert_number": string | null,
  "facility_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "inspection_result": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MINISTRY_OF_INDUSTRY: `
You are extracting data from a Saudi Ministry of Industry industrial license (ترخيص صناعي من وزارة الصناعة).

Return JSON with this exact shape:
{
  "industry_license_number": string | null,
  "industrial_activity_ar": string | null,
  "factory_location_ar": string | null,
  "production_capacity": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MINISTRY_OF_HEALTH: `
You are extracting data from a Saudi Ministry of Health facility license (ترخيص صحي من وزارة الصحة).

Return JSON with this exact shape:
{
  "moh_license_number": string | null,
  "facility_type": string | null,
  "facility_name_ar": string | null,
  "medical_specialties_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

facility_type values: CLINIC / HOSPITAL / PHARMACY / LAB / OTHER
${SHARED_RULES}
`.trim(),

  MINISTRY_OF_TOURISM: `
You are extracting data from a Saudi Ministry of Tourism license (ترخيص سياحي من وزارة السياحة).

Return JSON with this exact shape:
{
  "tourism_license_number": string | null,
  "classification": string | null,
  "facility_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

classification: star rating for hotels (e.g. "5 stars"), or category name for other facility types.
${SHARED_RULES}
`.trim(),

  MINISTRY_OF_JUSTICE: `
You are extracting data from a Saudi Ministry of Justice professional license (ترخيص وزارة العدل).

Return JSON with this exact shape:
{
  "license_type": string | null,
  "license_number": string | null,
  "licensee_name_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

license_type values: LAWYER / NOTARY / OTHER
${SHARED_RULES}
`.trim(),

  MINISTRY_OF_ENVIRONMENT: `
You are extracting data from a Saudi Ministry of Environment permit or license (تصريح وزارة البيئة).

Return JSON with this exact shape:
{
  "license_number": string | null,
  "license_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MINISTRY_OF_CULTURE: `
You are extracting data from a Saudi Ministry of Culture license or permit (تصريح وزارة الثقافة).

Return JSON with this exact shape:
{
  "license_number": string | null,
  "license_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MINISTRY_OF_SPORTS: `
You are extracting data from a Saudi Ministry of Sports license or permit (تصريح وزارة الرياضة).

Return JSON with this exact shape:
{
  "license_number": string | null,
  "license_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  SFDA_LICENSE: `
You are extracting data from a Saudi SFDA (هيئة الغذاء والدواء) license.

Return JSON with this exact shape:
{
  "sfda_license_number": string | null,
  "license_type": string | null,
  "product_categories_ar": string | null,
  "facility_type_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

license_type values: FOOD / DRUG / COSMETIC / MEDICAL_DEVICE
${SHARED_RULES}
`.trim(),

  SASO_CERTIFICATE: `
You are extracting data from a Saudi SASO (هيئة المواصفات والمقاييس) certificate or SABER record.

Return JSON with this exact shape:
{
  "saso_cert_number": string | null,
  "product_category_ar": string | null,
  "cert_type": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

cert_type values: SABER / OTHER
${SHARED_RULES}
`.trim(),

  CST_LICENSE: `
You are extracting data from a Saudi CST (هيئة الاتصالات والفضاء والتقنية) license.

Return JSON with this exact shape:
{
  "cst_license_number": string | null,
  "service_type_ar": string | null,
  "license_class": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  SAMA_LICENSE: `
You are extracting data from a Saudi SAMA (البنك المركزي السعودي) regulatory license.

Return JSON with this exact shape:
{
  "sama_license_number": string | null,
  "license_type": string | null,
  "issue_date": string | null,
  "confidence": number,
  "notes": string | null
}

license_type values: BANK / FINTECH / INSURANCE / EXCHANGE / OTHER
${SHARED_RULES}
`.trim(),

  CMA_LICENSE: `
You are extracting data from a Saudi CMA (هيئة السوق المالية) capital markets license.

Return JSON with this exact shape:
{
  "cma_license_number": string | null,
  "license_type_ar": string | null,
  "issue_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MISA_INVESTMENT_LICENSE: `
You are extracting data from a Saudi MISA (وزارة الاستثمار) foreign investment license.

Return JSON with this exact shape:
{
  "misa_license_number": string | null,
  "foreign_ownership_percentage": number | null,
  "investment_activity_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MONSHAAT_REGISTRATION: `
You are extracting data from a Saudi Monsha'at (منشآت) SME registration or certificate.

Return JSON with this exact shape:
{
  "monshaat_id": string | null,
  "registration_category": string | null,
  "issue_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  SOCPA_MEMBERSHIP: `
You are extracting data from a Saudi SOCPA (هيئة المحاسبين القانونيين) membership certificate.

Return JSON with this exact shape:
{
  "membership_number": string | null,
  "member_name_ar": string | null,
  "membership_class": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  SCE_MEMBERSHIP: `
You are extracting data from a Saudi Council of Engineers (هيئة المهندسين السعوليين) membership certificate.

Return JSON with this exact shape:
{
  "membership_number": string | null,
  "engineering_field_ar": string | null,
  "membership_class": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim(),

  MHRSD_NITAQAT: `
You are extracting data from a Saudi MHRSD Nitaqat (نطاقات) certificate from the Ministry of Human Resources.

Return JSON with this exact shape:
{
  "nitaqat_color": string | null,
  "saudization_percentage": number | null,
  "as_of_date": string | null,
  "confidence": number,
  "notes": string | null
}

nitaqat_color values: PLATINUM / GREEN / YELLOW / RED
${SHARED_RULES}
`.trim(),

  OTHER: `
You are extracting data from an unknown or miscellaneous Saudi government document.

Return JSON with this exact shape:
{
  "document_type_detected_ar": string | null,
  "any_reference_numbers": string[],
  "entity_name_ar": string | null,
  "issue_date": string | null,
  "expiry_date": string | null,
  "raw_summary_ar": string | null,
  "confidence": number,
  "notes": string | null
}

${SHARED_RULES}
`.trim()
};
