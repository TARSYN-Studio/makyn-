import Link from "next/link";

import { IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type SearchParams = { filter?: "all" | "urgent" | "pending" | "clean" };

function relative(date: Date | null | undefined, lang: Lang): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const h = Math.round(diffMs / (1000 * 60 * 60));
  if (h < 1) return lang === "ar" ? "قبل دقائق" : "minutes ago";
  if (h < 24) return lang === "ar" ? `قبل ${h} ساعة` : `${h}h ago`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `قبل ${d} يوم` : `${d}d ago`;
}

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const filter = searchParams.filter ?? "all";

  const companies = await prisma.company.findMany({
    where: { ownerId: user.id, isActive: true },
    include: {
      issues: {
        where: {
          status: { in: [IssueStatus.OPEN, IssueStatus.ACKNOWLEDGED, IssueStatus.WITH_PROFESSIONAL, IssueStatus.WAITING_GOVERNMENT, IssueStatus.ESCALATED] }
        },
        orderBy: { urgencyLevel: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const enriched = companies.map((c) => {
    const openIssues: IssueForStatus[] = c.issues.map((i) => ({
      urgencyLevel: i.urgencyLevel,
      detectedDeadline: i.detectedDeadline,
      governmentBody: i.governmentBody
    }));
    const status = calculateCompanyStatus(openIssues);
    const topIssue = c.issues[0] ?? null;
    return { ...c, status, topIssue };
  });

  const filtered = enriched.filter((c) => {
    if (filter === "all") return true;
    if (filter === "urgent") return c.status === "RED";
    if (filter === "pending") return c.status === "YELLOW";
    if (filter === "clean") return c.status === "GREEN";
    return true;
  });

  const filters: Array<{ key: SearchParams["filter"]; label: string }> = [
    { key: "all", label: t("companies.filter.all", lang) },
    { key: "urgent", label: t("companies.filter.urgent", lang) },
    { key: "pending", label: t("companies.filter.pending", lang) },
    { key: "clean", label: t("companies.filter.clean", lang) }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-navy-800">{t("companies.title", lang)}</h1>
        <Link href="/companies/new">
          <Button>+ {t("companies.add", lang)}</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/companies${f.key === "all" ? "" : `?filter=${f.key}`}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? "bg-navy-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <h2 className="text-lg font-semibold text-navy-800 mb-2">
              {t("companies.empty.title", lang)}
            </h2>
            <p className="text-sm text-slate-600 mb-6">{t("companies.empty.desc", lang)}</p>
            <Link href="/companies/new">
              <Button>+ {t("companies.add", lang)}</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const dotColor = c.status === "RED" ? "red" : c.status === "YELLOW" ? "yellow" : "green";
          return (
            <Link key={c.id} href={`/companies/${c.id}`}>
              <Card className="hover:border-navy-300 transition-colors cursor-pointer h-full">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-navy-800 leading-tight">{c.legalNameAr}</h3>
                      {c.tradeName && (
                        <p className="text-xs text-slate-500 mt-0.5">{c.tradeName}</p>
                      )}
                    </div>
                    <StatusDot color={dotColor} />
                  </div>

                  <div className="text-sm text-slate-600">
                    <span>{c.issues.length}</span> {t("companies.openIssues", lang)}
                  </div>

                  {c.topIssue ? (
                    <div className="text-sm text-slate-700 bg-slate-50 rounded-md p-2 line-clamp-2">
                      ⚠ {c.topIssue.titleAr}
                      {c.topIssue.detectedAmountSar && (
                        <>
                          {" "}
                          <Badge variant="navy">SAR {Number(c.topIssue.detectedAmountSar).toLocaleString()}</Badge>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">{t("companies.noIssues", lang)}</p>
                  )}

                  <div className="text-xs text-slate-400">
                    {t("companies.lastActivity", lang)}: {relative(c.issues[0]?.updatedAt ?? c.updatedAt, lang)}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
