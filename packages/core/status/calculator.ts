import { addDays, addHours } from "../utils/dates";

export type CompanyHealth = "GREEN" | "YELLOW" | "RED";

export type IssueForStatus = {
  urgencyLevel: number;
  detectedDeadline: Date | null;
  governmentBody: string;
};

const RED_BODY_CODES = new Set(["EFAA", "MOJ", "BOG"]);

export function calculateCompanyStatus(openIssues: IssueForStatus[]): CompanyHealth {
  if (openIssues.length === 0) return "GREEN";

  const now = new Date();
  const in14Days = addDays(now, 14);
  const in72Hours = addHours(now, 72);

  const hasRed = openIssues.some((issue) => {
    if (issue.urgencyLevel >= 4) return true;
    if (issue.detectedDeadline && issue.detectedDeadline < now) return true;
    if (RED_BODY_CODES.has(issue.governmentBody)) return true;
    if (issue.detectedDeadline && issue.detectedDeadline < in72Hours && issue.urgencyLevel >= 3) {
      return true;
    }
    return false;
  });
  if (hasRed) return "RED";

  const hasYellow = openIssues.some((issue) => {
    if (issue.urgencyLevel >= 2) return true;
    if (issue.detectedDeadline && issue.detectedDeadline < in14Days) return true;
    return false;
  });
  if (hasYellow) return "YELLOW";

  return "GREEN";
}
