import Link from "next/link";
import {
  Buildings,
  Warning,
  ClockCountdown,
  CheckCircle,
  CaretUp,
  CaretDown,
  Minus,
  CaretRight
} from "@phosphor-icons/react/dist/ssr";

import { ChannelType, ExtractionStatus, IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { Badge, StatusDot } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageFrame } from "@/components/PageFrame";
import { NoCompanies } from "@/components/illustrations/NoCompanies";
import { NoIssues } from "@/components/illustrations/NoIssues";
import { NoDeadlines } from "@/components/illustrations/NoDeadlines";
import { listUserOrgIds } from "@/lib/permissions";
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

  // Aggregate scope per v1.4 Q5 answer: show metrics across every org the
  // user is a member of. Active-org switcher lands in v1.4.1 — when it
  // does, this single call reads the activeOrgId from a cookie/header
  // and the rest of the page unchanged.
  const userOrgIds = await listUserOrgIds(user.id);
  const orgScope = { in: userOrgIds };

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
    prisma.organization.findMany({
      where: { id: orgScope, isActive: true, deletedAt: null },
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
        organizationId: orgScope,
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
        organizationId: orgScope,
        status: { notIn: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] },
        detectedDeadline: { gte: now, lte: in7d }
      }
    }),
    prisma.issue.count({
      where: {
        organizationId: orgScope,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus30d }
      }
    }),
    prisma.issue.count({
      where: {
        organizationId: orgScope,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus7d }
      }
    }),
    prisma.issue.count({
      where: {
        organizationId: orgScope,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus14d, lt: minus7d }
      }
    }),
    prisma.issue.findMany({
      where: {
        organizationId: orgScope,
        urgencyLevel: 5,
        status: { in: OPEN_STATUSES }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { detectedDeadline: "asc" },
      take: 10
    }),
    prisma.issue.findMany({
      where: {
        organizationId: orgScope,
        status: { notIn: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] },
        detectedDeadline: { gte: now, lte: in30d }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { detectedDeadline: "asc" },
      take: 20
    }),
    prisma.issue.findMany({
      where: { organizationId: orgScope, createdAt: { gte: minus30d } },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.issue.findMany({
      where: {
        organizationId: orgScope,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus30d, not: null }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { resolvedAt: "desc" },
      take: 10
    }),
    prisma.companyDocument.findMany({
      where: {
        organizationId: orgScope,
        extractionStatus: ExtractionStatus.COMPLETED,
        extractionCompletedAt: { not: null, gte: minus30d }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { extractionCompletedAt: "desc" },
      take: 10
    }),
    prisma.message.findMany({
      where: {
        organizationId: orgScope,
        channelType: ChannelType.TELEGRAM,
        direction: "INBOUND",
        createdAt: { gte: minus30d }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
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
      company: i.organization?.legalNameAr ?? "",
      href: `/organizations/${i.organizationId}/issues/${i.id}`
    });
  }
  for (const i of recentResolved) {
    if (!i.resolvedAt) continue;
    activity.push({
      at: i.resolvedAt,
      kind: "resolved",
      label: i.titleAr,
      company: i.organization?.legalNameAr ?? "",
      href: `/organizations/${i.organizationId}/issues/${i.id}`
    });
  }
  for (const d of recentDocsExtracted) {
    if (!d.extractionCompletedAt || !d.organization) continue;
    activity.push({
      at: d.extractionCompletedAt,
      kind: "docExtracted",
      label: d.originalName,
      company: d.organization?.legalNameAr ?? "",
      href: `/organizations/${d.organization?.id ?? ""}`
    });
  }
  for (const i of upcomingDeadlines) {
    if (!i.detectedDeadline) continue;
    if (i.detectedDeadline > in72h) continue;
    activity.push({
      at: i.detectedDeadline,
      kind: "deadlineSoon",
      label: i.titleAr,
      company: i.organization?.legalNameAr ?? "",
      href: `/organizations/${i.organizationId}/issues/${i.id}`
    });
  }
  for (const m of recentMessages) {
    activity.push({
      at: m.createdAt,
      kind: "noticeReceived",
      label: (m.rawContent ?? "").slice(0, 80) || "—",
      company: m.organization?.legalNameAr ?? (lang === "ar" ? "غير مطابقة" : "Unmatched"),
      href: m.organizationId ? `/organizations/${m.organizationId}` : "/organizations"
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = activity.slice(0, 10);

  const greet = t(greetingKey(now.getHours()), lang, { name: user.fullName });
  const urgentBanner =
    urgentIssues.length > 0
      ? t("dashboard.urgencyBanner.count", lang, { n: urgentIssues.length })
      : null;

  // Next-action line (priority: urgency-5 → 7-day deadline → latest activity).
  type NextAction = { prefix: string; label: string; href: string } | null;
  const nextAction: NextAction = (() => {
    const top = urgentIssues[0];
    if (top) {
      const due =
        top.detectedDeadline != null
          ? ` — ${deadlineLabel(top.detectedDeadline, lang)}`
          : "";
      return {
        prefix: lang === "ar" ? "التالي" : "Next",
        label: `${top.titleAr} — ${top.organization?.legalNameAr ?? ""}${due}`,
        href: `/organizations/${top.organizationId}/issues/${top.id}`
      };
    }
    const soonest = upcomingDeadlines.find((i) => i.detectedDeadline && i.detectedDeadline <= in7d);
    if (soonest && soonest.detectedDeadline) {
      return {
        prefix: lang === "ar" ? "أقرب موعد" : "Next deadline",
        label: `${soonest.titleAr} — ${deadlineLabel(soonest.detectedDeadline, lang)}`,
        href: `/organizations/${soonest.organizationId}/issues/${soonest.id}`
      };
    }
    if (recent.length > 0) {
      const last = recent[0];
      return {
        prefix: lang === "ar" ? "لا توجد بنود عاجلة. آخر نشاط" : "No urgent items. Last activity",
        label: `${last.label} — ${last.company}`,
        href: last.href
      };
    }
    return null;
  })();

  return (
    <PageFrame>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Greeting — with subtle line pattern behind and next-action line */}
        <div className="relative">
          {/* Line pattern: 1px horizontals @ 12px, radial fade */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[140px] -z-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 12px)",
              opacity: 0.4,
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)"
            }}
          />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1
                className="font-display-en text-[32px] leading-tight text-[var(--text)]"
                style={{ fontWeight: 400 }}
              >
                {greet}
              </h1>
              {nextAction && (
                <Link
                  href={nextAction.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-medium text-[var(--text-mid)] hover:text-[var(--accent)]"
                >
                  <span className="text-[var(--text-dim)]">{nextAction.prefix}:</span>
                  <span className="text-[var(--text)]">{nextAction.label}</span>
                  <CaretRight className="h-4 w-4 flip-rtl" weight="regular" />
                </Link>
              )}
            </div>
            <div className="text-end">
              <div className="num text-[13px] text-[var(--text-mid)]">
                {formatGregorian(now, lang)}
              </div>
              <div className="num text-[12px] text-[var(--text-dim)]">
                {formatHijri(now)}
              </div>
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
                    href={`/organizations/${i.organizationId}/issues/${i.id}`}
                    className="hover:underline"
                  >
                    <span className="font-medium">{i.organization?.legalNameAr ?? ""}</span>
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
                href="/organizations?filter=urgent"
                className="inline-block mt-2 text-[12px] font-medium text-[var(--red)] hover:underline"
              >
                {t("dashboard.viewAllUrgent", lang)} →
              </Link>
            )}
          </div>
        )}

        {/* Metrics — semantic colors + duotone icons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("dashboard.metrics.companies", lang)}
            value={totalCompanies}
            colorVar="--accent"
            Icon={Buildings}
            delta={0}
            deltaLabel={lang === "ar" ? "بدون مقارنة" : "no prior data"}
          />
          <StatCard
            label={t("dashboard.metrics.openIssues", lang)}
            value={openIssuesCount}
            colorVar="--amber"
            Icon={Warning}
            delta={0}
            deltaLabel={lang === "ar" ? "بدون مقارنة" : "no prior data"}
          />
          <StatCard
            label={t("dashboard.metrics.dueThisWeek", lang)}
            value={dueThisWeekCount}
            colorVar="--red"
            Icon={ClockCountdown}
            delta={0}
            deltaLabel={lang === "ar" ? "بدون مقارنة" : "no prior data"}
          />
          <StatCard
            label={t("dashboard.metrics.resolvedThisMonth", lang)}
            value={resolvedLast30}
            colorVar="--green"
            Icon={CheckCircle}
            delta={resolvedDelta}
            deltaLabel={t("dashboard.metrics.comparedToPrev", lang)}
          />
        </div>

        {/* Companies snapshot */}
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text)] mb-4">
            {t("dashboard.companiesSection", lang)}
          </h2>
          {companies.length === 0 ? (
            <Card>
              <CardBody className="py-10 flex flex-col items-center text-center gap-3">
                <NoCompanies />
                <p className="text-[13px] text-[var(--text-mid)]">
                  {t("companies.empty.desc", lang)}
                </p>
                <Link
                  href="/organizations/new"
                  className="text-[13px] font-medium text-[var(--accent)] hover:underline"
                >
                  + {t("dashboard.addCompany", lang)}
                </Link>
              </CardBody>
            </Card>
          ) : (
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
                  <Link key={c.id} href={`/organizations/${c.id}`}>
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
                href="/organizations/new"
                className="flex items-center justify-center h-full min-h-[140px] rounded-lg border border-dashed border-[var(--border-s)] text-[13px] font-medium text-[var(--text-mid)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                + {t("dashboard.addCompany", lang)}
              </Link>
            </div>
          )}
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
                  <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
                    <NoIssues />
                    <p className="text-[13px] text-[var(--text-dim)]">
                      {t("dashboard.noActivity", lang)}
                    </p>
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
                <CardBody className="py-10 flex flex-col items-center text-center gap-3">
                  <NoDeadlines />
                  <p className="text-[13px] text-[var(--text-dim)]">
                    {t("dashboard.noDeadlines", lang)}
                  </p>
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
                      href={`/organizations/${i.organizationId}/issues/${i.id}`}
                      className={`min-w-[280px] shrink-0 rounded-lg border p-4 shadow-card ${tint}`}
                    >
                      <div className="num text-[12px] font-medium text-[var(--text-mid)] mb-2">
                        {deadlineLabel(i.detectedDeadline, lang)}
                      </div>
                      <div className="text-[13px] text-[var(--text-dim)] mb-1">
                        {i.organization?.legalNameAr ?? ""}
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
    </PageFrame>
  );
}

type StatIcon = import("@phosphor-icons/react").Icon;

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  colorVar,
  Icon
}: {
  label: string;
  value: number;
  delta: number;
  deltaLabel?: string;
  colorVar: "--accent" | "--amber" | "--red" | "--green";
  Icon: StatIcon;
}) {
  // Inline style lets us drive icon tint + tinted container off a CSS var,
  // avoiding a per-color Tailwind class explosion.
  const containerStyle = {
    background: `color-mix(in srgb, var(${colorVar}) 10%, transparent)`
  } as React.CSSProperties;
  const iconColor = `var(${colorVar})`;

  const TrendIcon = delta > 0 ? CaretUp : delta < 0 ? CaretDown : Minus;
  const trendColor =
    delta > 0
      ? "var(--green)"
      : delta < 0
        ? "var(--red)"
        : "var(--text-dim)";

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] font-medium">
            {label}
          </div>
          <div
            className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
            style={containerStyle}
          >
            <Icon className="h-5 w-5" weight="duotone" style={{ color: iconColor }} />
          </div>
        </div>
        <div
          className="font-display-en text-[40px] leading-none mt-2 text-[var(--text)] num"
          style={{ fontWeight: 400, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[12px]">
          <TrendIcon className="h-3.5 w-3.5" weight="regular" style={{ color: trendColor }} />
          <span className="num" style={{ color: trendColor }}>
            {delta === 0 ? "—" : delta > 0 ? `+${delta}` : `${delta}`}
          </span>
          {deltaLabel && (
            <span className="text-[var(--text-dim)] truncate">{deltaLabel}</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
