import Link from "next/link";
import { notFound } from "next/navigation";

import { IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, hoursUntil, type IssueForStatus } from "@makyn/core";

import { CompanyDetailsForm } from "./details-form";
import { ArchiveCompanyButton } from "./archive-button";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type PageProps = { params: { id: string }; searchParams: { tab?: string } };

const urgencyColors: Record<number, "neutral" | "yellow" | "red"> = {
  1: "neutral",
  2: "neutral",
  3: "yellow",
  4: "red",
  5: "red"
};

function deadlineText(d: Date | null, lang: Lang): string {
  if (!d) return "—";
  const hours = hoursUntil(d);
  if (hours < 0) {
    const days = Math.round(-hours / 24);
    return lang === "ar" ? `متأخرة بـ ${days} يوم` : `${days}d overdue`;
  }
  if (hours < 48) {
    return lang === "ar" ? `خلال ${hours} ساعة` : `in ${hours}h`;
  }
  const days = Math.round(hours / 24);
  return lang === "ar" ? `خلال ${days} يوم` : `in ${days}d`;
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const tab = searchParams.tab ?? "issues";

  const company = await prisma.company.findFirst({
    where: { id: params.id, ownerId: user.id },
    include: {
      issues: {
        orderBy: [{ status: "asc" }, { urgencyLevel: "desc" }, { createdAt: "desc" }]
      }
    }
  });
  if (!company) notFound();

  const openStatuses: IssueStatus[] = [
    IssueStatus.OPEN,
    IssueStatus.ACKNOWLEDGED,
    IssueStatus.WITH_PROFESSIONAL,
    IssueStatus.WAITING_GOVERNMENT,
    IssueStatus.ESCALATED
  ];
  const openIssues: IssueForStatus[] = company.issues
    .filter((i) => openStatuses.includes(i.status))
    .map((i) => ({ urgencyLevel: i.urgencyLevel, detectedDeadline: i.detectedDeadline, governmentBody: i.governmentBody }));
  const status = calculateCompanyStatus(openIssues);
  const dotColor = status === "RED" ? "red" : status === "YELLOW" ? "yellow" : "green";

  const tabs = [
    { key: "issues", label: t("company.tabs.issues", lang) },
    { key: "details", label: t("company.tabs.details", lang) },
    { key: "settings", label: t("company.tabs.settings", lang) }
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-2">
        <Link href="/companies" className="text-sm text-slate-500 hover:text-navy-500">
          ← {t("company.back", lang)}
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-800">{company.legalNameAr}</h1>
          {company.tradeName && <p className="text-sm text-slate-500">{company.tradeName}</p>}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200">
          <StatusDot color={dotColor} />
          <span className="text-sm font-medium">{t(`status.${status}`, lang)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        {tabs.map((t2) => (
          <Link
            key={t2.key}
            href={`/companies/${company.id}?tab=${t2.key}`}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
              tab === t2.key
                ? "border-navy-500 text-navy-700"
                : "border-transparent text-slate-500 hover:text-navy-500"
            }`}
          >
            {t2.label}
          </Link>
        ))}
      </div>

      {tab === "issues" && (
        <div className="space-y-3">
          {company.issues.length === 0 && (
            <Card>
              <CardBody className="py-8 text-center text-slate-500 text-sm">
                {t("company.noOpenIssues", lang)}
              </CardBody>
            </Card>
          )}
          {company.issues.map((issue) => (
            <Link key={issue.id} href={`/companies/${company.id}/issues/${issue.id}`}>
              <Card className="hover:border-navy-300 transition-colors">
                <CardBody className="flex items-start gap-4">
                  <Badge variant={urgencyColors[issue.urgencyLevel]}>U{issue.urgencyLevel}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-navy-800 truncate">{issue.titleAr}</h3>
                      <Badge variant="navy">{issue.governmentBody}</Badge>
                      <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{issue.summaryAr}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{t("issue.deadline", lang)}: {deadlineText(issue.detectedDeadline, lang)}</span>
                      {issue.detectedAmountSar && (
                        <span>{t("issue.amount", lang)}: SAR {Number(issue.detectedAmountSar).toLocaleString()}</span>
                      )}
                      {issue.referenceNumber && <span>#{issue.referenceNumber}</span>}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === "details" && (
        <Card>
          <CardBody>
            <CompanyDetailsForm company={company} lang={lang} />
          </CardBody>
        </Card>
      )}

      {tab === "settings" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-800">{t("company.tabs.settings", lang)}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ArchiveCompanyButton companyId={company.id} lang={lang} />
            <Button variant="danger" disabled>
              {t("company.delete", lang)}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
