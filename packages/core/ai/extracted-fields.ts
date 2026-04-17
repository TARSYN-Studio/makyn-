import type { DocumentType } from "@makyn/db";

export type ExtractedCompanyFields = Partial<{
  legalNameAr: string;
  legalNameEn: string;
  tradeName: string;
  businessType: string;
  ownerLegalName: string;
  crNumber: string;
  crIssueDate: string;
  crExpiryDate: string;
  zatcaTin: string;
  vatRegistrationNumber: string;
  gosiEmployerNumber: string;
  qiwaEstablishmentId: string;
  molFileNumber: string;
  saudizationCategory: string;
  muqeemAccountNumber: string;
  moi700Number: string;
  baladyLicenseNumber: string;
  baladyLicenseType: string;
  baladyExpiryDate: string;
  chamberMembershipNumber: string;
  chamberMembershipExpiry: string;
  mudadWpsCompliant: boolean;
  civilDefenseCertNumber: string;
  civilDefenseExpiry: string;
  industryLicenseNumber: string;
  industryLicenseExpiry: string;
  sfdaLicenseNumber: string;
  sfdaLicenseType: string;
  sfdaLicenseExpiry: string;
  mohLicenseNumber: string;
  mohFacilityType: string;
  mohLicenseExpiry: string;
  tourismLicenseNumber: string;
  tourismClassification: string;
  tourismLicenseExpiry: string;
  cstLicenseNumber: string;
  cstServiceType: string;
  samaLicenseNumber: string;
  samaLicenseType: string;
  cmaLicenseNumber: string;
  cmaLicenseType: string;
  misaLicenseNumber: string;
  misaLicenseExpiry: string;
  sasoCertNumber: string;
  monshaatRegistrationId: string;
}>;

export function mergeExtractedFields(
  docType: DocumentType,
  data: Record<string, unknown>
): ExtractedCompanyFields {
  const s = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;

  switch (docType) {
    case "COMMERCIAL_REGISTRATION":
      return {
        legalNameAr: s(data["legal_name_ar"]),
        legalNameEn: s(data["legal_name_en"]),
        tradeName: s(data["trade_name_ar"]),
        businessType: s(data["business_type_ar"]),
        ownerLegalName: s(data["owner_name_ar"]),
        crNumber: s(data["cr_number"]),
        crIssueDate: s(data["issue_date"]),
        crExpiryDate: s(data["expiry_date"])
      };
    case "ZATCA_VAT_CERTIFICATE":
      return {
        zatcaTin: s(data["zatca_tin"]),
        vatRegistrationNumber: s(data["vat_registration_number"])
      };
    case "GOSI_REGISTRATION":
      return { gosiEmployerNumber: s(data["gosi_employer_number"]) };
    case "QIWA_ESTABLISHMENT":
      return {
        qiwaEstablishmentId: s(data["qiwa_establishment_id"]),
        molFileNumber: s(data["mol_file_number"]),
        saudizationCategory: s(data["saudization_category"])
      };
    case "MUQEEM_ACCOUNT":
      return {
        muqeemAccountNumber: s(data["muqeem_account_number"]),
        moi700Number: s(data["moi_700_number"])
      };
    case "BALADY_LICENSE":
      return {
        baladyLicenseNumber: s(data["balady_license_number"]),
        baladyLicenseType: s(data["license_type_ar"]),
        baladyExpiryDate: s(data["expiry_date"])
      };
    case "CHAMBER_OF_COMMERCE":
      return {
        chamberMembershipNumber: s(data["membership_number"]),
        chamberMembershipExpiry: s(data["expiry_date"])
      };
    case "MUDAD_CERTIFICATE":
      return {
        mudadWpsCompliant: typeof data["mudad_wps_compliant"] === "boolean"
          ? (data["mudad_wps_compliant"] as boolean)
          : undefined
      };
    case "CIVIL_DEFENSE_CERT":
      return {
        civilDefenseCertNumber: s(data["cert_number"]),
        civilDefenseExpiry: s(data["expiry_date"])
      };
    case "MINISTRY_OF_INDUSTRY":
      return {
        industryLicenseNumber: s(data["industry_license_number"]),
        industryLicenseExpiry: s(data["expiry_date"])
      };
    case "SFDA_LICENSE":
      return {
        sfdaLicenseNumber: s(data["sfda_license_number"]),
        sfdaLicenseType: s(data["license_type"]),
        sfdaLicenseExpiry: s(data["expiry_date"])
      };
    case "MINISTRY_OF_HEALTH":
      return {
        mohLicenseNumber: s(data["moh_license_number"]),
        mohFacilityType: s(data["facility_type"]),
        mohLicenseExpiry: s(data["expiry_date"])
      };
    case "MINISTRY_OF_TOURISM":
      return {
        tourismLicenseNumber: s(data["tourism_license_number"]),
        tourismClassification: s(data["classification"]),
        tourismLicenseExpiry: s(data["expiry_date"])
      };
    case "CST_LICENSE":
      return {
        cstLicenseNumber: s(data["cst_license_number"]),
        cstServiceType: s(data["service_type_ar"])
      };
    case "SAMA_LICENSE":
      return {
        samaLicenseNumber: s(data["sama_license_number"]),
        samaLicenseType: s(data["license_type"])
      };
    case "CMA_LICENSE":
      return {
        cmaLicenseNumber: s(data["cma_license_number"]),
        cmaLicenseType: s(data["license_type_ar"])
      };
    case "MISA_INVESTMENT_LICENSE":
      return {
        misaLicenseNumber: s(data["misa_license_number"]),
        misaLicenseExpiry: s(data["expiry_date"])
      };
    case "SASO_CERTIFICATE":
      return { sasoCertNumber: s(data["saso_cert_number"]) };
    case "MONSHAAT_REGISTRATION":
      return { monshaatRegistrationId: s(data["monshaat_id"]) };
    default:
      return {};
  }
}
