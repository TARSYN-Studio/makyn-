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
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { LiftCard } from "@/components/motion/LiftCard";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { ProgressRing } from "@/components/motion/ProgressRing";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
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
  const isAr = lang === "ar";
  const tab = searchParams.tab ?? "active";
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let access;
  try {
    access = await requireOrgAccess(user.id, params.id, "org.read");
  } catch (e) {
    if (e instanceof OrgAccessError) notFound();
    throw e;
  }
  const company = await prisma.organization.findFirst({
    where: { id: params.id, deletedAt: null },
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
  const tone: "healthy" | "attention" | "overdue" =
    status === "RED" ? "overdue" : status === "YELLOW" ? "attention" : "healthy";
  const healthColor =
    tone === "healthy"
      ? "var(--state-resolved)"
      : tone === "attention"
        ? "var(--state-pending)"
        : "var(--state-overdue)";
  const healthTint =
    tone === "healthy"
      ? "var(--state-resolved-tint)"
      : tone === "attention"
        ? "var(--state-pending-tint)"
        : "var(--state-overdue-tint)";

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

  // Health score derived from resolution rate and urgent count
  const urgentIssueCount = openIssues.filter((i) => i.urgencyLevel >= 5).length;
  const healthScore = Math.max(
    10,
    Math.min(100, 100 - urgentIssueCount * 20 - openCount * 3 + resolutionRate * 0.3)
  );

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
      where: { organizationId: company.id },
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
        href: `/organizations/${company.id}/issues/${i.id}`
      });
      if (i.resolvedAt) {
        events.push({
          at: i.resolvedAt,
          kind: "issueResolved",
          label: i.titleAr,
          href: `/organizations/${company.id}/issues/${i.id}`
        });
      }
    }
    const [docs, msgs] = await Promise.all([
      prisma.companyDocument.findMany({
        where: {
          organizationId: company.id,
          extractionStatus: ExtractionStatus.COMPLETED
        },
        orderBy: { updatedAt: "desc" },
        take: 50
      }),
      prisma.message.findMany({
        where: {
          organizationId: company.id,
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
        href: m.issueId ? `/organizations/${company.id}/issues/${m.issueId}` : undefined
      });
    }
    events.sort((a, b) => b.at.getTime() - a.at.getTime());
  }
  const timeline = events.slice(0, 30);

  const statusWord =
    tone === "healthy"
      ? isAr
        ? "سليم"
        : "In order"
      : tone === "attention"
        ? isAr
          ? "بحاجة لاهتمام"
          : "Attention needed"
        : isAr
          ? "عاجل"
          : "Urgent";

  return (
    <div className="max-w-[1100px] mx-auto pb-8">
      <Reveal>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--ink-40)] hover:text-[var(--signal)] mb-4"
        >
          <span className="inline-block flip-rtl">←</span> {t("company.back", lang)}
        </Link>
      </Reveal>

      {/* Editorial header */}
      <Reveal delay={60}>
        <div className="pb-6 mb-6 border-b border-[var(--stone-hair)]">
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "ملف الشركة" : "Company File"}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
                    isAr ? "text-ar" : ""
                  }`}
                >
                  {company.legalNameAr}
                </h1>
                <RoleBadge role={access.role} lang={lang} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[12px] text-[var(--ink-40)] flex-wrap">
                {company.tradeName && (
                  <span className={isAr ? "text-ar" : ""}>{company.tradeName}</span>
                )}
                {company.crNumber && (
                  <span className="num">CR {company.crNumber}</span>
                )}
                {company.zatcaTin && (
                  <span className="num">TIN {company.zatcaTin}</span>
                )}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--stone-hair)] shrink-0">
              <StatusDot status={tone} size={8} />
              <span className="font-medium text-[13px]">
                {t(`status.${status}`, lang)}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Hero card — health + metrics */}
      <Reveal delay={120}>
        <div className="rounded-2xl bg-[var(--card)] elev-hero border border-[var(--stone-hair)] overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
            <div
              className="p-6 flex flex-col items-center justify-center gap-3 border-b md:border-b-0"
              style={{
                background: healthTint,
                borderInlineEnd: "1px solid var(--stone-hair)"
              }}
            >
              <div
                className="text-[10px] font-mono tracking-[0.2em] uppercase"
                style={{ color: healthColor }}
              >
                {isAr ? "الحالة" : "Health"}
              </div>
              <div className="relative">
                <ProgressRing value={healthScore} size={104} stroke={4} color={healthColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <NumberTicker
                    value={Math.round(healthScore)}
                    className="text-[30px] font-semibold text-[var(--ink)] leading-none"
                  />
                  <span className="text-[9px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mt-1">
                    / 100
                  </span>
                </div>
              </div>
              <div
                className={`text-[13px] font-semibold ${isAr ? "text-ar" : ""}`}
                style={{ color: healthColor }}
              >
                {statusWord}
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-2">
              <HeroMetric
                lang={lang}
                label={t("company.stats.total", lang)}
                value={total}
              />
              <HeroMetric
                lang={lang}
                label={t("company.stats.open", lang)}
                value={openCount}
                borderInlineStart
              />
              <HeroMetric
                lang={lang}
                label={t("company.stats.thisWeek", lang)}
                value={thisWeekCount}
                borderTop
              />
              <HeroMetric
                lang={lang}
                label={t("company.stats.resolutionRate", lang)}
                value={resolutionRate}
                suffix="%"
                borderInlineStart
                borderTop
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Action row */}
      <Reveal delay={160}>
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <Button variant="secondary" disabled title={t("company.comingSoon", lang)}>
            {t("company.addIssue", lang)}
          </Button>
          <Link href={`/organizations/${company.id}?tab=details`}>
            <Button variant="secondary">{t("company.editDetails", lang)}</Button>
          </Link>
          <Link href={`/organizations/${company.id}/settings/team`}>
            <Button variant="secondary">{t("team.nav.link", lang)}</Button>
          </Link>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={200}>
        <div className="flex items-center gap-1 border-b border-[var(--stone-hair)] mb-6 overflow-x-auto">
          {tabs.map((t2) => (
            <Link
              key={t2.key}
              href={`/organizations/${company.id}?tab=${t2.key}`}
              className={`px-4 py-2 -mb-px text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t2.key
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-40)] hover:text-[var(--ink)]"
              }`}
            >
              {t2.label}
            </Link>
          ))}
        </div>
      </Reveal>

      {tab === "active" && (
        <div className="space-y-6">
          {activeIssues.length === 0 && (
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 py-12 flex flex-col items-center text-center gap-4 px-6">
              <EmptyStateMark size={80} />
              <p className="text-[13px] text-[var(--ink-60)]">
                {t("company.noOpenIssues", lang)}
              </p>
            </div>
          )}
          {(["urgent", "high", "medium", "low"] as const).map((key) => {
            const list = buckets[key];
            if (list.length === 0) return null;
            return (
              <section key={key}>
                <h3 className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-3">
                  {t(`company.urgency.${key}`, lang)}{" "}
                  <span className="num">({list.length})</span>
                </h3>
                <div className="space-y-2.5">
                  {list.map((issue) => {
                    const issueTone =
                      issue.urgencyLevel >= 5
                        ? "var(--state-overdue)"
                        : issue.urgencyLevel >= 3
                          ? "var(--state-pending)"
                          : "var(--ink-40)";
                    return (
                      <LiftCard
                        key={issue.id}
                        tiltMax={0.8}
                        liftY={-3}
                        className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 hover:elev-2 hover:border-[var(--ink-20)] overflow-hidden"
                      >
                        <Link
                          href={`/organizations/${company.id}/issues/${issue.id}`}
                          className="flex items-stretch gap-4"
                        >
                          <span
                            className="w-1 shrink-0"
                            style={{ background: issueTone }}
                          />
                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant={urgencyBadge[issue.urgencyLevel]}>
                                U{issue.urgencyLevel}
                              </Badge>
                              <h4
                                className={`font-semibold text-[var(--ink)] text-[15px] truncate ${
                                  isAr ? "text-ar" : ""
                                }`}
                              >
                                {issue.titleAr}
                              </h4>
                              <Badge variant="accent">{issue.governmentBody}</Badge>
                              <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
                            </div>
                            <p
                              className={`text-[13px] text-[var(--ink-60)] line-clamp-2 ${
                                isAr ? "text-ar" : ""
                              }`}
                            >
                              {issue.summaryAr}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[12px] text-[var(--ink-40)]">
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
                        </Link>
                      </LiftCard>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === "resolved" && (
        <div className="space-y-2.5">
          {resolvedIssues.length === 0 ? (
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 py-10 text-center text-[var(--ink-40)] text-[13px]">
              {t("company.noResolved", lang)}
            </div>
          ) : (
            resolvedIssues.map((issue) => (
              <LiftCard
                key={issue.id}
                tiltMax={0.4}
                liftY={-2}
                className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 hover:elev-2 hover:border-[var(--ink-20)]"
              >
                <Link
                  href={`/organizations/${company.id}/issues/${issue.id}`}
                  className="flex items-start gap-4 p-4"
                >
                  <Badge variant="done">
                    {t(`issue.status.${issue.status}`, lang)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4
                        className={`font-semibold text-[var(--ink)] text-[15px] truncate ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {issue.titleAr}
                      </h4>
                      <Badge variant="accent">{issue.governmentBody}</Badge>
                    </div>
                    <p
                      className={`text-[13px] text-[var(--ink-60)] line-clamp-2 ${
                        isAr ? "text-ar" : ""
                      }`}
                    >
                      {issue.summaryAr}
                    </p>
                    <div className="text-[12px] text-[var(--ink-40)] num mt-1">
                      {fmtDate(issue.resolvedAt)}
                    </div>
                  </div>
                </Link>
              </LiftCard>
            ))
          )}
        </div>
      )}

      {tab === "documents" && (
        <>
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 py-10 text-center text-[var(--ink-40)] text-[13px]">
              {t("company.noDocuments", lang)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 overflow-hidden">
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
                      <Td className="num text-[var(--ink-40)]">
                        {fmtDate(d.createdAt)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
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
              <h2 className="font-semibold text-[var(--ink)]">
                {t("company.archive", lang)}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-[13px] text-[var(--ink-60)]">
                {isAr
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
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 py-10 text-center text-[var(--ink-40)] text-[13px]">
              {t("company.noActivity", lang)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 p-5">
              <ul className="relative">
                <div
                  className="absolute top-0 bottom-0 w-px bg-[var(--stone-light)]"
                  style={{ [isAr ? "right" : "left"]: "7px" }}
                />
                {timeline.map((e, idx) => (
                  <li key={idx} className="ps-6 pe-1 py-2 relative">
                    <span
                      className={`w-[15px] h-[15px] rounded-full absolute top-2 border-2 ${
                        idx === 0
                          ? "bg-[var(--ink)] border-[var(--ink)]"
                          : "bg-[var(--paper)] border-[var(--signal)]"
                      }`}
                      style={{ [isAr ? "right" : "left"]: 0 }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono text-[var(--ink-40)] tracking-wider uppercase">
                          {t(`company.timeline.${e.kind}`, lang)}
                        </div>
                        <div
                          className={`text-[13px] text-[var(--ink)] truncate ${
                            isAr ? "text-ar" : ""
                          }`}
                        >
                          {e.href ? (
                            <Link href={e.href} className="hover:text-[var(--signal)]">
                              {e.label}
                            </Link>
                          ) : (
                            e.label
                          )}
                        </div>
                      </div>
                      <span className="num text-[12px] text-[var(--ink-40)] shrink-0">
                        {fmtDate(e.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HeroMetric({
  lang,
  label,
  value,
  suffix = "",
  borderInlineStart,
  borderTop
}: {
  lang: Lang;
  label: string;
  value: number;
  suffix?: string;
  borderInlineStart?: boolean;
  borderTop?: boolean;
}) {
  const isAr = lang === "ar";
  return (
    <div
      className="px-5 py-5 flex flex-col justify-center"
      style={{
        borderInlineStart: borderInlineStart ? "1px solid var(--stone-hair)" : undefined,
        borderTop: borderTop ? "1px solid var(--stone-hair)" : undefined
      }}
    >
      <div
        className={`text-[10px] font-mono text-[var(--ink-40)] tracking-[0.16em] uppercase mb-2 ${
          isAr ? "text-ar" : ""
        }`}
      >
        {label}
      </div>
      <div
        className="text-[24px] md:text-[26px] font-semibold text-[var(--ink)] leading-none"
        style={{ letterSpacing: "-0.02em" }}
      >
        <NumberTicker value={value} suffix={suffix} />
      </div>
    </div>
  );
}
