import type { CompanyForMatching } from "../ai/classifier";
import type { ExtractedNotice } from "../ai/extractor";

export type DeterministicMatch = {
  companyId: string;
  method: "cr" | "tin" | "gosi" | "qiwa";
  confidence: 1.0;
} | null;

export function matchCompanyByIdentifiers(
  companies: CompanyForMatching[],
  extraction: ExtractedNotice
): DeterministicMatch {
  const { recipient } = extraction;

  if (recipient.cr_number) {
    const hit = companies.find((c) => c.crNumber && c.crNumber === recipient.cr_number);
    if (hit) return { companyId: hit.id, method: "cr", confidence: 1.0 };
  }
  if (recipient.zatca_tin) {
    const hit = companies.find((c) => c.zatcaTin && c.zatcaTin === recipient.zatca_tin);
    if (hit) return { companyId: hit.id, method: "tin", confidence: 1.0 };
  }
  if (recipient.gosi_number) {
    const hit = companies.find((c) => c.gosiEmployerNumber && c.gosiEmployerNumber === recipient.gosi_number);
    if (hit) return { companyId: hit.id, method: "gosi", confidence: 1.0 };
  }
  if (recipient.qiwa_id) {
    const hit = companies.find((c) => c.qiwaEstablishmentId && c.qiwaEstablishmentId === recipient.qiwa_id);
    if (hit) return { companyId: hit.id, method: "qiwa", confidence: 1.0 };
  }

  return null;
}

export function companyIdBelongsToUser(
  companies: CompanyForMatching[],
  candidateId: string | null | undefined
): boolean {
  if (!candidateId) return false;
  return companies.some((c) => c.id === candidateId);
}
