import Link from "next/link";

import { ChannelType, ExtractionStatus, IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { Badge, StatusDot } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

const OPEN_STATUSES = [
  IssueStatus.OPEN,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.WITH_PROFESSIONAL,
  IssueStatus.WAITING_GOVERNMENT,
  IssueStatus.ESCALATED
];

function greetingKey(hour: number): string {
  if (hour < 12) return "dashboard.greeting.morning";
  if (hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

function formatHijri(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(d);
  } catch {
    return "";
  }
}

function formatGregorian(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

function relativeDays(target: Date): number {
  const ms = target.getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function deadlineLabel(d: Date, lang: Lang): string {
  const days = relativeDays(d);
  if (days <= 0) return t("dashboard.deadline.today", lang);
  if (days === 1) return t("dashboard.deadline.tomorrow", lang);
  return t("dashboard.deadline.in", lang, { count: days });
}

function relTime(date: Date, lang: Lang): string {
  const diffMs = Date.now() - date.getTime();
  const h = Math.round(diffMs / (1000 * 60 * 60));
  if (h < 1) return lang === "ar" ? "قبل دقائق" : "minutes ago";
  if (h < 24) return lang === "ar" ? `قبل ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `قبل ${d} ي` : `${d}d ago`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const now = new Date();

  // Time windows
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const minus30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const minus7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const minus14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    companies,
    openIssuesCount,
    dueThisWeekCount,
    resolvedLast30,
    resolvedLast7,
    resolvedPrev7,
    urgentIssues,
    upcomingDeadlines,
    recentIssuesCreated,
    recentResolved,
    recentDocsExtracted,
    recentMessages
  ] = await Promise.all([
    prisma.company.findMany({
      where: { ownerId: user.id, isActive: true },
      include: {
        issues: {
          where: { status: { in: OPEN_STATUSES } },
          orderBy: [{ urgencyLevel: "desc" }, { detectedDeadline: "asc" }]
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.issue.count({
      where: {
        ownerId: user.id,
        status: {
          in: [
            IssueStatus.OPEN,
            IssueStatus.WITH_PROFESSIONAL,
            IssueStatus.ACKNOWLEDGED
          ]
        }
      }
    }),
    prisma.issue.count({
      where: {
        ownerId: user.id,
        status: { notIn: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] },
        detectedDeadline: { gte: now, lte: in7d }
      }
    }),
    prisma.issue.count({
      where: {
        ownerId: user.id,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus30d }
      }
    }),
    prisma.issue.count({
      where: {
        ownerId: user.id,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus7d }
      }
    }),
    prisma.issue.count({
      where: {
        ownerId: user.id,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus14d, lt: minus7d }
      }
    }),
    prisma.issue.findMany({
      where: {
        ownerId: user.id,
        urgencyLevel: 5,
        status: { in: OPEN_STATUSES }
      },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { detectedDeadline: "asc" },
      take: 10
    }),
    prisma.issue.findMany({
      where: {
        ownerId: user.id,
        status: { notIn: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] },
        detectedDeadline: { gte: now, lte: in30d }
      },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { detectedDeadline: "asc" },
      take: 20
    }),
    prisma.issue.findMany({
      where: { ownerId: user.id, createdAt: { gte: minus30d } },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.issue.findMany({
      where: {
        ownerId: user.id,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus30d, not: null }
      },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { resolvedAt: "desc" },
      take: 10
    }),
    prisma.companyDocument.findMany({
      where: {
        userId: user.id,
        extractionStatus: ExtractionStatus.COMPLETED,
        extractionCompletedAt: { not: null, gte: minus30d }
      },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { extractionCompletedAt: "desc" },
      take: 10
    }) as Promise<Array<{
      id: string;
      originalName: string;
      extractionCompletedAt: Date | null;
      company: { id: string; legalNameAr: string } | null;
    }>>,
    prisma.message.findMany({
      where: {
        userId: user.id,
        channelType: ChannelType.TELEGRAM,
        direction: "INBOUND",
        createdAt: { gte: minus30d }
      },
      include: { company: { select: { id: true, legalNameAr: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  const totalCompanies = companies.length;
  const resolvedDelta = resolvedLast7 - resolvedPrev7;

  // Build unified activity feed
  type Activity = { at: Date; kind: string; label: string; company: string; href: string };
  const activity: Activity[] = [];
  for (const i of recentIssuesCreated) {
    activity.push({
      at: i.createdAt,
      kind: "newIssue",
      label: i.titleAr,
      company: i.company.legalNameAr,
      href: `/companies/${i.companyId}/issues/${i.id}`
    });
  }
  for (const i of recentResolved) {
    if (!i.resolvedAt) continue;
    activity.push({
      at: i.resolvedAt,
      kind: "resolved",
      label: i.titleAr,
      company: i.company.legalNameAr,
      href: `/companies/${i.companyId}/issues/${i.id}`
    });
  }
  for (const d of recentDocsExtracted) {
    if (!d.extractionCompletedAt || !d.company) continue;
    activity.push({
      at: d.extractionCompletedAt,
      kind: "docExtracted",
      label: d.originalName,
      company: d.company.legalNameAr,
      href: `/companies/${d.company.id}`
    });
  }
  for (const i of upcomingDeadlines) {
    if (!i.detectedDeadline) continue;
    if (i.detectedDeadline > in72h) continue;
    activity.push({
      at: i.detectedDeadline,
      kind: "deadlineSoon",
      label: i.titleAr,
      company: i.company.legalNameAr,
      href: `/companies/${i.companyId}/issues/${i.id}`
    });
  }
  for (const m of recentMessages) {
    activity.push({
      at: m.createdAt,
      kind: "noticeReceived",
      label: (m.rawContent ?? "").slice(0, 80) || "—",
      company: m.company?.legalNameAr ?? (lang === "ar" ? "غير مطابقة" : "Unmatched"),
      href: m.companyId ? `/companies/${m.companyId}` : "/companies"
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = activity.slice(0, 10);

  const greet = t(greetingKey(now.getHours()), lang, { name: user.fullName });
  const urgentBanner =
    urgentIssues.length > 0
      ? t("dashboard.urgencyBanner.count", lang, { n: urgentIssues.length })
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting strip */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1
          className="font-display-en text-[32px] leading-tight text-[var(--text)]"
          style={{ fontWeight: 400 }}
        >
          {greet}
        </h1>
        <div className="text-end">
          <div className="num text-[13px] text-[var(--text-mid)]">
            {formatGregorian(now, lang)}
          </div>
          <div className="num text-[12px] text-[var(--text-dim)]">
            {formatHijri(now)}
          </div>
        </div>
      </div>

      {/* Urgent banner */}
      {urgentBanner && (
        <div className="bg-[var(--red-l)] border-s-4 border-[var(--red)] urgent-pulse rounded-lg p-4">
          <div className="text-[14px] font-semibold text-[var(--red)] mb-2">
            {urgentBanner}
          </div>
          <ul className="space-y-1 text-[13px] text-[var(--text)]">
            {urgentIssues.slice(0, 3).map((i) => (
              <li key={i.id}>
                <Link
                  href={`/companies/${i.companyId}/issues/${i.id}`}
                  className="hover:underline"
                >
                  <span className="font-medium">{i.company.legalNameAr}</span>
                  <span className="text-[var(--text-mid)]"> · </span>
                  <span>{i.titleAr}</span>
                  {i.detectedDeadline && (
                    <span className="text-[var(--text-dim)] num ms-2">
                      · {deadlineLabel(i.detectedDeadline, lang)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {urgentIssues.length > 3 && (
            <Link
              href="/companies?filter=urgent"
              className="inline-block mt-2 text-[12px] font-medium text-[var(--red)] hover:underline"
            >
              {t("dashboard.viewAllUrgent", lang)} →
            </Link>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.metrics.companies", lang)}
          value={totalCompanies}
        />
        <StatCard
          label={t("dashboard.metrics.openIssues", lang)}
          value={openIssuesCount}
        />
        <StatCard
          label={t("dashboard.metrics.dueThisWeek", lang)}
          value={dueThisWeekCount}
        />
        <StatCard
          label={t("dashboard.metrics.resolvedThisMonth", lang)}
          value={resolvedLast30}
          delta={resolvedDelta}
          deltaLabel={t("dashboard.metrics.comparedToPrev", lang)}
        />
      </div>

      {/* Companies snapshot */}
      <section>
        <h2 className="text-[20px] font-semibold text-[var(--text)] mb-4">
          {t("dashboard.companiesSection", lang)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((c) => {
            const openIssues: IssueForStatus[] = c.issues.map((i) => ({
              urgencyLevel: i.urgencyLevel,
              detectedDeadline: i.detectedDeadline,
              governmentBody: i.governmentBody
            }));
            const status = calculateCompanyStatus(openIssues);
            const dotColor =
              status === "RED" ? "red" : status === "YELLOW" ? "yellow" : "green";
            const top = c.issues[0];
            return (
              <Link key={c.id} href={`/companies/${c.id}`}>
                <Card interactive className="h-full cursor-pointer">
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-[var(--text)] leading-snug">
                        {c.legalNameAr}
                      </h3>
                      <StatusDot color={dotColor} />
                    </div>
                    <div className="text-[13px] text-[var(--text-mid)]">
                      <span className="num">{c.issues.length}</span>{" "}
                      {t("companies.openIssues", lang)}
                    </div>
                    {top ? (
                      <div className="text-[13px] text-[var(--text)] line-clamp-2">
                        {top.titleAr}
                      </div>
                    ) : (
                      <div className="text-[12px] text-[var(--text-dim)]">
                        {t("companies.noIssues", lang)}
                      </div>
                    )}
                    <div className="text-[12px] text-[var(--text-dim)] num">
                      {relTime(top?.updatedAt ?? c.updatedAt, lang)}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
          <Link
            href="/companies/new"
            className="flex items-center justify-center h-full min-h-[140px] rounded-lg border border-dashed border-[var(--border-s)] text-[13px] font-medium text-[var(--text-mid)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            + {t("dashboard.addCompany", lang)}
          </Link>
        </div>
      </section>

      {/* Activity + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text)] mb-4">
            {t("dashboard.activitySection", lang)}
          </h2>
          <Card>
            <CardBody className="p-0">
              {recent.length === 0 ? (
                <div className="px-5 py-6 text-[13px] text-[var(--text-dim)]">
                  {t("dashboard.noActivity", lang)}
                </div>
              ) : (
                <ul>
                  {recent.map((a, idx) => (
                    <li
                      key={idx}
                      className="px-5 py-3 border-b last:border-b-0 border-[var(--border)]"
                    >
                      <Link
                        href={a.href}
                        className="flex items-center justify-between gap-3 hover:text-[var(--accent)]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] text-[var(--text-dim)]">
                            {t(`dashboard.activity.${a.kind}`, lang)} ·{" "}
                            <span className="text-[var(--text-mid)]">
                              {a.company}
                            </span>
                          </div>
                          <div className="text-[13px] text-[var(--text)] truncate">
                            {a.label}
                          </div>
                        </div>
                        <span className="num text-[12px] text-[var(--text-dim)] shrink-0">
                          {relTime(a.at, lang)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text)] mb-4">
            {t("dashboard.deadlinesSection", lang)}
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <Card>
              <CardBody className="text-[13px] text-[var(--text-dim)]">
                {t("dashboard.noDeadlines", lang)}
              </CardBody>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingDeadlines.map((i) => {
                if (!i.detectedDeadline) return null;
                const days = relativeDays(i.detectedDeadline);
                const tint =
                  days <= 2
                    ? "bg-[var(--red-l)] border-[var(--red)]/30"
                    : days <= 7
                      ? "bg-[var(--amber-l)] border-[var(--amber)]/30"
                      : "bg-[var(--card)] border-[var(--border)]";
                return (
                  <Link
                    key={i.id}
                    href={`/companies/${i.companyId}/issues/${i.id}`}
                    className={`min-w-[280px] shrink-0 rounded-lg border p-4 shadow-card ${tint}`}
                  >
                    <div className="num text-[12px] font-medium text-[var(--text-mid)] mb-2">
                      {deadlineLabel(i.detectedDeadline, lang)}
                    </div>
                    <div className="text-[13px] text-[var(--text-dim)] mb-1">
                      {i.company.legalNameAr}
                    </div>
                    <div className="text-[14px] font-medium text-[var(--text)] line-clamp-2 mb-3">
                      {i.titleAr}
                    </div>
                    <Badge variant="neutral">{i.governmentBody}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel
}: {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] font-medium">
          {label}
        </div>
        <div
          className="font-display-en text-[40px] leading-none mt-2 text-[var(--text)]"
          style={{ fontWeight: 400 }}
        >
          <span className="num">{value}</span>
        </div>
        {typeof delta === "number" && (
          <div className="mt-2 text-[12px] text-[var(--text-dim)]">
            <span
              className={
                delta > 0
                  ? "text-[var(--green)]"
                  : delta < 0
                    ? "text-[var(--red)]"
                    : ""
              }
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>{" "}
            {deltaLabel}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
