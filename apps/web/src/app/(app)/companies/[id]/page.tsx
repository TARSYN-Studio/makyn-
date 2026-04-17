import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ExtractionStatus,
  IssueStatus,
  prisma,
  ChannelType
} from "@makyn/db";
import { calculateCompanyStatus, hoursUntil, type IssueForStatus } from "@makyn/core";

import { CompanyDetailsForm } from "./details-form";
import { ArchiveCompanyButton } from "./archive-button";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type PageProps = { params: { id: string }; searchParams: { tab?: string } };

const OPEN_STATUSES: IssueStatus[] = [
  IssueStatus.OPEN,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.WITH_PROFESSIONAL,
  IssueStatus.WAITING_GOVERNMENT,
  IssueStatus.ESCALATED
];

const ACTIVE_STATUSES: IssueStatus[] = [
  IssueStatus.OPEN,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.WITH_PROFESSIONAL,
  IssueStatus.ESCALATED
];

const urgencyBadge: Record<number, "neutral" | "waiting" | "urgent"> = {
  1: "neutral",
  2: "neutral",
  3: "waiting",
  4: "urgent",
  5: "urgent"
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

function extractionBadgeVariant(
  s: ExtractionStatus
): "waiting" | "progress" | "done" | "urgent" | "neutral" {
  switch (s) {
    case ExtractionStatus.PENDING:
      return "waiting";
    case ExtractionStatus.PROCESSING:
      return "progress";
    case ExtractionStatus.COMPLETED:
      return "done";
    case ExtractionStatus.FAILED:
      return "urgent";
    default:
      return "neutral";
  }
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const tab = searchParams.tab ?? "active";
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const company = await prisma.company.findFirst({
    where: { id: params.id, ownerId: user.id },
    include: {
      issues: {
        orderBy: [{ urgencyLevel: "desc" }, { createdAt: "desc" }]
      }
    }
  });
  if (!company) notFound();

  const openIssues: IssueForStatus[] = company.issues
    .filter((i) => OPEN_STATUSES.includes(i.status))
    .map((i) => ({
      urgencyLevel: i.urgencyLevel,
      detectedDeadline: i.detectedDeadline,
      governmentBody: i.governmentBody
    }));
  const status = calculateCompanyStatus(openIssues);
  const dotColor = status === "RED" ? "red" : status === "YELLOW" ? "yellow" : "green";

  // Stat summaries
  const total = company.issues.length;
  const openCount = company.issues.filter((i) => OPEN_STATUSES.includes(i.status)).length;
  const resolvedCount = company.issues.filter((i) => i.status === IssueStatus.RESOLVED).length;
  const thisWeekCount = company.issues.filter(
    (i) =>
      i.detectedDeadline &&
      i.detectedDeadline >= now &&
      i.detectedDeadline <= in7d &&
      i.status !== IssueStatus.RESOLVED &&
      i.status !== IssueStatus.ARCHIVED
  ).length;
  const resolutionDenom = resolvedCount + openCount;
  const resolutionRate =
    resolutionDenom === 0 ? 0 : Math.round((resolvedCount / resolutionDenom) * 100);

  const tabs = [
    { key: "active", label: t("company.tabs.active", lang) },
    { key: "resolved", label: t("company.tabs.resolved", lang) },
    { key: "documents", label: t("company.tabs.documents", lang) },
    { key: "details", label: t("company.tabs.details", lang) },
    { key: "timeline", label: t("company.tabs.timeline", lang) }
  ];

  // Active issues grouped by urgency
  const activeIssues = company.issues
    .filter((i) => ACTIVE_STATUSES.includes(i.status))
    .sort((a, b) => {
      // deadline asc, nulls last
      if (!a.detectedDeadline && !b.detectedDeadline) return 0;
      if (!a.detectedDeadline) return 1;
      if (!b.detectedDeadline) return -1;
      return a.detectedDeadline.getTime() - b.detectedDeadline.getTime();
    });

  const bucket = (u: number): "urgent" | "high" | "medium" | "low" =>
    u >= 5 ? "urgent" : u === 4 ? "high" : u === 3 ? "medium" : "low";
  const buckets: Record<string, typeof activeIssues> = {
    urgent: [],
    high: [],
    medium: [],
    low: []
  };
  for (const i of activeIssues) buckets[bucket(i.urgencyLevel)].push(i);

  const resolvedIssues = company.issues
    .filter((i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.ARCHIVED)
    .sort((a, b) => {
      const at = a.resolvedAt?.getTime() ?? 0;
      const bt = b.resolvedAt?.getTime() ?? 0;
      return bt - at;
    });

  let documents: Awaited<ReturnType<typeof prisma.companyDocument.findMany>> = [];
  if (tab === "documents") {
    documents = await prisma.companyDocument.findMany({
      where: { companyId: company.id, userId: user.id },
      orderBy: { createdAt: "desc" }
    });
  }

  // Timeline data
  type TimelineEvent = {
    at: Date;
    kind: "issueCreated" | "issueResolved" | "docExtracted" | "messageReceived";
    label: string;
    href?: string;
  };
  const events: TimelineEvent[] = [];
  if (tab === "timeline") {
    for (const i of company.issues) {
      events.push({
        at: i.createdAt,
        kind: "issueCreated",
        label: i.titleAr,
        href: `/companies/${company.id}/issues/${i.id}`
      });
      if (i.resolvedAt) {
        events.push({
          at: i.resolvedAt,
          kind: "issueResolved",
          label: i.titleAr,
          href: `/companies/${company.id}/issues/${i.id}`
        });
      }
    }
    const [docs, msgs] = await Promise.all([
      prisma.companyDocument.findMany({
        where: {
          companyId: company.id,
          userId: user.id,
          extractionStatus: ExtractionStatus.COMPLETED
        },
        orderBy: { updatedAt: "desc" },
        take: 50
      }),
      prisma.message.findMany({
        where: {
          companyId: company.id,
          userId: user.id,
          channelType: ChannelType.TELEGRAM,
          direction: "INBOUND"
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, rawContent: true, createdAt: true, issueId: true }
      })
    ]);
    for (const d of docs) {
      events.push({
        at: d.extractionCompletedAt ?? d.updatedAt,
        kind: "docExtracted",
        label: d.originalName
      });
    }
    for (const m of msgs) {
      events.push({
        at: m.createdAt,
        kind: "messageReceived",
        label: (m.rawContent ?? "").slice(0, 80) || "—",
        href: m.issueId ? `/companies/${company.id}/issues/${m.issueId}` : undefined
      });
    }
    events.sort((a, b) => b.at.getTime() - a.at.getTime());
  }
  const timeline = events.slice(0, 30);

  return (
    <div className="max-w-6xl">
      <div className="mb-2">
        <Link
          href="/companies"
          className="text-[12px] text-[var(--text-dim)] hover:text-[var(--accent)]"
        >
          <span className="inline-block rtl:scale-x-[-1]">←</span> {t("company.back", lang)}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="min-w-0">
          <h1
            className="font-display-en text-[32px] leading-tight text-[var(--text)]"
            style={{ fontWeight: 400 }}
          >
            {company.legalNameAr}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-[var(--text-dim)] flex-wrap">
            {company.tradeName && <span>{company.tradeName}</span>}
            {company.crNumber && (
              <span className="num">CR: {company.crNumber}</span>
            )}
            {company.zatcaTin && (
              <span className="num">TIN: {company.zatcaTin}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[15px]">
            <StatusDot color={dotColor} />
            <span className="font-medium">{t(`status.${status}`, lang)}</span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <Button variant="secondary" disabled title={t("company.comingSoon", lang)}>
          {t("company.addIssue", lang)}
        </Button>
        <Link href={`/companies/${company.id}?tab=details`}>
          <Button variant="secondary">{t("company.editDetails", lang)}</Button>
        </Link>
      </div>

      {/* Stat summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatMini label={t("company.stats.total", lang)} value={total} />
        <StatMini label={t("company.stats.open", lang)} value={openCount} />
        <StatMini label={t("company.stats.thisWeek", lang)} value={thisWeekCount} />
        <StatMini
          label={t("company.stats.resolutionRate", lang)}
          value={`${resolutionRate}%`}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
        {tabs.map((t2) => (
          <Link
            key={t2.key}
            href={`/companies/${company.id}?tab=${t2.key}`}
            className={`px-4 py-2 -mb-px text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t2.key
                ? "border-[var(--accent)] text-[var(--text)]"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {t2.label}
          </Link>
        ))}
      </div>

      {tab === "active" && (
        <div className="space-y-6">
          {activeIssues.length === 0 && (
            <Card>
              <CardBody className="py-8 text-center text-[var(--text-dim)] text-[13px]">
                {t("company.noOpenIssues", lang)}
              </CardBody>
            </Card>
          )}
          {(["urgent", "high", "medium", "low"] as const).map((key) => {
            const list = buckets[key];
            if (list.length === 0) return null;
            return (
              <section key={key}>
                <h3 className="text-[13px] font-semibold text-[var(--text-mid)] mb-2 uppercase tracking-wider">
                  {t(`company.urgency.${key}`, lang)}{" "}
                  <span className="num text-[var(--text-dim)]">({list.length})</span>
                </h3>
                <div className="space-y-3">
                  {list.map((issue) => (
                    <Link key={issue.id} href={`/companies/${company.id}/issues/${issue.id}`}>
                      <Card interactive>
                        <CardBody className="flex items-start gap-4">
                          <Badge variant={urgencyBadge[issue.urgencyLevel]}>
                            U{issue.urgencyLevel}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-semibold text-[var(--text)] truncate">
                                {issue.titleAr}
                              </h4>
                              <Badge variant="accent">{issue.governmentBody}</Badge>
                              <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
                            </div>
                            <p className="text-[13px] text-[var(--text-mid)] line-clamp-2">
                              {issue.summaryAr}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[12px] text-[var(--text-dim)]">
                              <span>
                                {t("issue.deadline", lang)}:{" "}
                                <span className="num">
                                  {deadlineText(issue.detectedDeadline, lang)}
                                </span>
                              </span>
                              {issue.detectedAmountSar && (
                                <span className="num">
                                  SAR {Number(issue.detectedAmountSar).toLocaleString()}
                                </span>
                              )}
                              {issue.referenceNumber && (
                                <span className="num">#{issue.referenceNumber}</span>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === "resolved" && (
        <div className="space-y-3">
          {resolvedIssues.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-[var(--text-dim)] text-[13px]">
                {t("company.noResolved", lang)}
              </CardBody>
            </Card>
          ) : (
            resolvedIssues.map((issue) => (
              <Link key={issue.id} href={`/companies/${company.id}/issues/${issue.id}`}>
                <Card interactive>
                  <CardBody className="flex items-start gap-4">
                    <Badge variant="done">
                      {t(`issue.status.${issue.status}`, lang)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-[var(--text)] truncate">
                          {issue.titleAr}
                        </h4>
                        <Badge variant="accent">{issue.governmentBody}</Badge>
                      </div>
                      <p className="text-[13px] text-[var(--text-mid)] line-clamp-2">
                        {issue.summaryAr}
                      </p>
                      <div className="text-[12px] text-[var(--text-dim)] num mt-1">
                        {fmtDate(issue.resolvedAt)}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "documents" && (
        <>
          {documents.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-[var(--text-dim)] text-[13px]">
                {t("company.noDocuments", lang)}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("company.doc.filename", lang)}</Th>
                    <Th>{t("company.doc.type", lang)}</Th>
                    <Th>{t("company.doc.status", lang)}</Th>
                    <Th>{t("company.doc.uploadedAt", lang)}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {documents.map((d) => (
                    <Tr key={d.id}>
                      <Td className="truncate max-w-[280px]">{d.originalName}</Td>
                      <Td>
                        <Badge variant="neutral">{d.docType}</Badge>
                      </Td>
                      <Td>
                        <Badge variant={extractionBadgeVariant(d.extractionStatus)}>
                          {d.extractionStatus}
                        </Badge>
                      </Td>
                      <Td className="num text-[var(--text-dim)]">
                        {fmtDate(d.createdAt)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </>
      )}

      {tab === "details" && (
        <div className="space-y-6">
          <Card>
            <CardBody>
              <CompanyDetailsForm company={company} lang={lang} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {t("company.archive", lang)}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-[13px] text-[var(--text-mid)]">
                {lang === "ar"
                  ? "يمكنك إخفاء هذه الشركة من القوائم عبر الأرشفة."
                  : "Archive this company to hide it from your lists."}
              </p>
              <ArchiveCompanyButton companyId={company.id} lang={lang} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <>
          {timeline.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-[var(--text-dim)] text-[13px]">
                {t("company.noActivity", lang)}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-0">
                <ul className="relative ms-4 my-4 border-s border-[var(--border)]">
                  {timeline.map((e, idx) => (
                    <li key={idx} className="ps-4 pe-5 py-3 relative">
                      <span className="absolute -start-[5px] top-4 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] text-[var(--text-dim)]">
                            {t(`company.timeline.${e.kind}`, lang)}
                          </div>
                          <div className="text-[13px] text-[var(--text)] truncate">
                            {e.href ? (
                              <Link
                                href={e.href}
                                className="hover:text-[var(--accent)]"
                              >
                                {e.label}
                              </Link>
                            ) : (
                              e.label
                            )}
                          </div>
                        </div>
                        <span className="num text-[12px] text-[var(--text-dim)] shrink-0">
                          {fmtDate(e.at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] font-medium">
          {label}
        </div>
        <div
          className="font-display-en text-[20px] leading-none mt-1.5 text-[var(--text)]"
          style={{ fontWeight: 400 }}
        >
          <span className="num">{value}</span>
        </div>
      </CardBody>
    </Card>
  );
}
