import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

import { ChannelType, ExtractionStatus, IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { LiftCard } from "@/components/motion/LiftCard";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { ProgressRing } from "@/components/motion/ProgressRing";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHead } from "@/components/motion/SectionHead";
import { StatusDot } from "@/components/motion/StatusDot";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
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

// Deterministic composition via formatToParts — runtime Intl output varies
// by Node ICU build, so we extract day/month/year individually and
// reassemble in a locale-explicit order.
function partsOf(
  d: Date,
  locale: string,
  calendar?: string
): { day: string; month: string; year: string } {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(calendar ? { calendar } : {})
  });
  const pick = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const parts = fmt.formatToParts(d);
  return {
    day: pick(parts, "day"),
    month: pick(parts, "month"),
    year: pick(parts, "year")
  };
}

function formatHijri(d: Date): string {
  try {
    const { day, month, year } = partsOf(d, "ar-SA-u-ca-islamic-umalqura-nu-arab");
    return `${day} ${month} ${year} هـ`;
  } catch {
    return "";
  }
}

function formatGregorian(d: Date, lang: Lang): string {
  if (lang === "ar") {
    const { day, month, year } = partsOf(d, "ar-SA-u-ca-gregory-nu-arab", "gregory");
    return `${day} ${month} ${year}`;
  }
  const { day, month, year } = partsOf(d, "en-US", "gregory");
  return `${month} ${day}, ${year}`;
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
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    numeric: "auto"
  });
  const diffMs = date.getTime() - Date.now();
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  const hours = Math.round(diffMs / 3600000);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(diffMs / 86400000);
  return rtf.format(days, "day");
}

export default async function DashboardPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";
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

  const [
    companies,
    openIssuesCount,
    dueThisWeekCount,
    resolvedLast30,
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

  // Health score — aggregate across companies. Red pulls it down fastest.
  const companyStatuses = companies.map((c) => {
    const issuesForStatus: IssueForStatus[] = c.issues.map((i) => ({
      urgencyLevel: i.urgencyLevel,
      detectedDeadline: i.detectedDeadline,
      governmentBody: i.governmentBody
    }));
    return calculateCompanyStatus(issuesForStatus);
  });
  const redCount = companyStatuses.filter((s) => s === "RED").length;
  const yellowCount = companyStatuses.filter((s) => s === "YELLOW").length;
  const greenCount = companyStatuses.filter((s) => s === "GREEN").length;
  const totalForHealth = Math.max(1, totalCompanies);
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 * (greenCount + yellowCount * 0.5) / totalForHealth - redCount * 15
      )
    )
  );
  const healthTone =
    healthScore >= 85 ? "healthy" : healthScore >= 60 ? "attention" : "overdue";
  const healthColor =
    healthTone === "healthy"
      ? "var(--state-resolved)"
      : healthTone === "attention"
        ? "var(--state-pending)"
        : "var(--state-overdue)";
  const healthTint =
    healthTone === "healthy"
      ? "var(--state-resolved-tint)"
      : healthTone === "attention"
        ? "var(--state-pending-tint)"
        : "var(--state-overdue-tint)";
  const statusWord =
    healthTone === "healthy"
      ? isAr
        ? "سليم"
        : "In order"
      : healthTone === "attention"
        ? isAr
          ? "بحاجة لاهتمام"
          : "Attention needed"
        : isAr
          ? "عاجل"
          : "Urgent";

  // Activity feed (unchanged logic)
  type Activity = {
    at: Date;
    kind: string;
    label: string;
    company: string;
    href: string;
  };
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
      company: m.organization?.legalNameAr ?? (isAr ? "غير مطابقة" : "Unmatched"),
      href: m.organizationId ? `/organizations/${m.organizationId}` : "/organizations"
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recent = activity.slice(0, 10);

  const urgentBanner =
    urgentIssues.length > 0
      ? t("dashboard.urgencyBanner.count", lang, { n: urgentIssues.length })
      : null;

  const greeting = user.fullName?.split(" ")[0] ?? "";
  const heroTitle =
    totalCompanies === 0
      ? isAr
        ? "مرحباً بك في مكين"
        : "Welcome to MAKYN"
      : isAr
        ? `مرحباً، ${greeting}`
        : `Good to see you, ${greeting}`;
  const heroSubline = (() => {
    if (totalCompanies === 0) {
      return isAr
        ? "ابدأ بإضافة شركتك الأولى لنحافظ على ملفها مرتّباً."
        : "Add your first organization and we'll keep its file in order.";
    }
    if (urgentIssues.length > 0) {
      return isAr
        ? `${urgentIssues.length} ${urgentIssues.length === 1 ? "مسألة" : "مسائل"} تحتاج انتباهك الآن.`
        : `${urgentIssues.length} ${urgentIssues.length === 1 ? "matter is" : "matters are"} asking for your attention.`;
    }
    if (openIssuesCount > 0) {
      return isAr
        ? `نتابع ${openIssuesCount} ${openIssuesCount === 1 ? "مسألة" : "مسائل"} مفتوحة عبر ملفاتك.`
        : `We're handling ${openIssuesCount} open ${openIssuesCount === 1 ? "matter" : "matters"} across your files.`;
    }
    return isAr
      ? "كل شيء في مكانه. سنوافيك بأي جديد."
      : "Everything's in order. We'll surface anything new.";
  })();

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Hero */}
      <Reveal>
        <div className="pt-6 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.2em] uppercase mb-3">
                {isAr ? "لوحة القيادة · اليوم" : "Dashboard · Today"}
              </div>
              <h1
                className={`text-[44px] md:text-[52px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.025em] ${
                  isAr ? "text-ar" : ""
                }`}
                style={{ letterSpacing: isAr ? 0 : "-0.025em" }}
              >
                {heroTitle}
              </h1>
              <p
                className={`font-display-it text-[18px] md:text-[22px] text-[var(--ink-60)] mt-3 leading-snug max-w-[560px] ${
                  isAr ? "text-ar" : ""
                }`}
              >
                {heroSubline}
              </p>
            </div>
            <div className="text-end shrink-0">
              <div className="num text-[13px] text-[var(--ink-60)]">
                {formatGregorian(now, lang)}
              </div>
              <div className="num text-[12px] text-[var(--ink-40)]">
                {formatHijri(now)}
              </div>
            </div>
          </div>

          {/* Hero card — health orb + metrics. Omitted when no companies. */}
          {totalCompanies > 0 && (
            <div className="mt-8 rounded-2xl bg-[var(--card)] elev-hero border border-[var(--stone-hair)] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <div
                  className="p-8 flex flex-col items-center justify-center gap-3 border-b md:border-b-0"
                  style={{
                    background: healthTint,
                    borderInlineEnd: "1px solid var(--stone-hair)"
                  }}
                >
                  <div
                    className="text-[10px] font-mono tracking-[0.2em] uppercase"
                    style={{ color: healthColor }}
                  >
                    {isAr ? "الحالة العامة" : "Overall Health"}
                  </div>
                  <div className="relative">
                    <ProgressRing value={healthScore} size={120} stroke={4} color={healthColor} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <NumberTicker
                        value={healthScore}
                        className="text-[36px] font-semibold text-[var(--ink)] leading-none"
                      />
                      <span className="text-[9.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mt-1">
                        / 100
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-[14px] font-semibold ${isAr ? "text-ar" : ""}`}
                    style={{ color: healthColor }}
                  >
                    {statusWord}
                  </div>
                </div>

                <div className="grid grid-cols-2 grid-rows-2">
                  <HeroMetric
                    lang={lang}
                    label={t("dashboard.metrics.companies", lang)}
                    value={totalCompanies}
                    Icon={Building2}
                  />
                  <HeroMetric
                    lang={lang}
                    label={t("dashboard.metrics.openIssues", lang)}
                    value={openIssuesCount}
                    Icon={AlertTriangle}
                    borderInlineStart
                  />
                  <HeroMetric
                    lang={lang}
                    label={t("dashboard.metrics.dueThisWeek", lang)}
                    value={dueThisWeekCount}
                    Icon={Clock}
                    borderTop
                  />
                  <HeroMetric
                    lang={lang}
                    label={t("dashboard.metrics.resolvedThisMonth", lang)}
                    value={resolvedLast30}
                    Icon={CheckCircle2}
                    borderInlineStart
                    borderTop
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* Urgent banner */}
      {urgentBanner && (
        <Reveal delay={80}>
          <div
            className="bg-[var(--state-overdue-tint)] border-s-[3px] border-[var(--state-overdue)] rounded-[8px] p-4 mb-8"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--state-overdue)] mb-2">
              {urgentBanner}
            </div>
            <ul className="space-y-1 text-[13px] text-[var(--ink)]">
              {urgentIssues.slice(0, 3).map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/organizations/${i.organizationId}/issues/${i.id}`}
                    className="hover:underline"
                  >
                    <span className="font-medium">{i.organization?.legalNameAr ?? ""}</span>
                    <span className="text-[var(--ink-60)]"> · </span>
                    <span>{i.titleAr}</span>
                    {i.detectedDeadline && (
                      <span className="text-[var(--ink-40)] num ms-2">
                        · {deadlineLabel(i.detectedDeadline, lang)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {urgentIssues.length > 3 && (
              <Link
                href="/issues?filter=urgent"
                className="inline-block mt-2 text-[12px] font-medium text-[var(--state-overdue)] hover:underline"
              >
                {t("dashboard.viewAllUrgent", lang)} →
              </Link>
            )}
          </div>
        </Reveal>
      )}

      {/* Upcoming deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Reveal delay={120}>
          <section className="mb-10">
            <SectionHead
              lang={lang}
              eyebrow={isAr ? "المواعيد القادمة" : "What's ahead"}
              title={t("dashboard.deadlinesSection", lang)}
              action={isAr ? "كل المواعيد" : "See all"}
              actionHref="/issues"
            />
            <div className="mt-5 space-y-1.5">
              {upcomingDeadlines.slice(0, 6).map((i) => {
                if (!i.detectedDeadline) return null;
                const days = relativeDays(i.detectedDeadline);
                const tone =
                  days <= 2
                    ? "var(--state-overdue)"
                    : days <= 7
                      ? "var(--state-pending)"
                      : "var(--ink-40)";
                return (
                  <LiftCard
                    key={i.id}
                    tiltMax={0.6}
                    liftY={-2}
                    className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 px-5 py-4 flex items-center gap-5 hover:border-[var(--ink-20)]"
                  >
                    <Link
                      href={`/organizations/${i.organizationId}/issues/${i.id}`}
                      className="flex items-center gap-5 w-full"
                    >
                      <div className="flex items-center gap-3 flex-none w-[150px]">
                        <span
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ background: tone }}
                        />
                        <div>
                          <div className="text-[16px] font-semibold text-[var(--ink)] num leading-none">
                            {deadlineLabel(i.detectedDeadline, lang)}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--ink-40)] tracking-wider uppercase mt-1 truncate">
                            {i.organization?.legalNameAr ?? ""}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex-1 min-w-0 text-[13.5px] text-[var(--ink-80)] line-clamp-2 ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {i.titleAr}
                      </div>
                      <span className="text-[11px] font-mono text-[var(--ink-40)] uppercase tracking-wider flex-none">
                        {i.governmentBody}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 text-[var(--ink-40)] flex-none flip-rtl"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </LiftCard>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      {/* Companies grid */}
      <Reveal delay={180}>
        <section className="mb-10">
          <SectionHead
            lang={lang}
            eyebrow={isAr ? "الملفات" : "On file"}
            title={t("dashboard.companiesSection", lang)}
            action={isAr ? "كل الشركات" : "See all"}
            actionHref="/organizations"
          />
          {companies.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[var(--card)] elev-1 border border-[var(--stone-hair)] py-14 flex flex-col items-center text-center gap-5 px-6">
              <EmptyStateMark />
              <p
                className={`text-[20px] leading-snug text-[var(--ink)] max-w-[28ch] ${
                  lang === "en" ? "font-display-en" : ""
                }`}
              >
                {t("companies.empty.hero", lang)}
              </p>
              <p className="text-[13px] text-[var(--ink-60)] max-w-[36ch]">
                {t("companies.empty.desc", lang)}
              </p>
              <Link
                href="/organizations/new"
                className="text-[13px] font-medium text-[var(--signal)] hover:underline underline-offset-[6px]"
              >
                {t("dashboard.addCompany", lang)}
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((c, idx) => {
                const status = companyStatuses[idx];
                const tone: "healthy" | "attention" | "overdue" =
                  status === "RED"
                    ? "overdue"
                    : status === "YELLOW"
                      ? "attention"
                      : "healthy";
                const top = c.issues[0];
                return (
                  <LiftCard
                    key={c.id}
                    tiltMax={1}
                    liftY={-3}
                    className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 hover:elev-2 hover:border-[var(--ink-20)] h-full"
                  >
                    <Link
                      href={`/organizations/${c.id}`}
                      className="block p-5 h-full"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3
                          className={`text-[15.5px] font-semibold text-[var(--ink)] leading-snug ${
                            isAr ? "text-ar" : ""
                          }`}
                        >
                          {c.legalNameAr}
                        </h3>
                        <StatusDot status={tone} size={8} />
                      </div>
                      <div className="text-[12.5px] text-[var(--ink-60)] mb-2">
                        <span className="num">{c.issues.length}</span>{" "}
                        {t("companies.openIssues", lang)}
                      </div>
                      {top ? (
                        <div
                          className={`text-[13px] text-[var(--ink-80)] line-clamp-2 ${
                            isAr ? "text-ar" : ""
                          }`}
                        >
                          {top.titleAr}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[var(--ink-40)]">
                          {t("companies.noIssues", lang)}
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-[var(--stone-hair)] text-[11px] font-mono text-[var(--ink-40)]">
                        {relTime(top?.updatedAt ?? c.updatedAt, lang)}
                      </div>
                    </Link>
                  </LiftCard>
                );
              })}
              <Link
                href="/organizations/new"
                className="flex items-center justify-center h-full min-h-[140px] rounded-xl border border-dashed border-[var(--stone-light)] bg-[var(--paper-low)] text-[13px] font-medium text-[var(--ink-60)] hover:border-[var(--signal)] hover:text-[var(--signal)] transition-colors"
              >
                {t("dashboard.addCompany", lang)}
              </Link>
            </div>
          )}
        </section>
      </Reveal>

      {/* Recent activity — editorial timeline */}
      <Reveal delay={240}>
        <section className="mb-16">
          <SectionHead
            lang={lang}
            eyebrow={isAr ? "السجل" : "Recently"}
            title={t("dashboard.activitySection", lang)}
            action={isAr ? "عرض السجل" : "See all"}
            actionHref="/activity"
          />
          {recent.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[var(--card)] elev-1 border border-[var(--stone-hair)] py-12 flex flex-col items-center text-center gap-4 px-6">
              <EmptyStateMark size={80} />
              <p className="text-[13px] text-[var(--ink-60)]">
                {t("dashboard.noActivity", lang)}
              </p>
            </div>
          ) : (
            <div className="mt-5 relative">
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--stone-light)]"
                style={{ [isAr ? "right" : "left"]: "7px" }}
              />
              <ul className="space-y-3.5">
                {recent.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-4 relative">
                    <span
                      className={`w-[15px] h-[15px] rounded-full flex-none mt-0.5 relative z-10 ${
                        idx === 0
                          ? "bg-[var(--ink)] border-2 border-[var(--ink)]"
                          : "bg-[var(--paper)] border-2 border-[var(--signal)]"
                      }`}
                    />
                    <Link
                      href={a.href}
                      className="flex-1 min-w-0 hover:text-[var(--signal)] group"
                    >
                      <div className="text-[12px] text-[var(--ink-40)]">
                        {t(`dashboard.activity.${a.kind}`, lang)} ·{" "}
                        <span className="text-[var(--ink-60)]">{a.company}</span>
                      </div>
                      <div
                        className={`text-[13px] text-[var(--ink-80)] truncate ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {a.label}
                      </div>
                      <div className="text-[10.5px] font-mono text-[var(--ink-40)] mt-0.5 num">
                        {relTime(a.at, lang)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

function HeroMetric({
  lang,
  label,
  value,
  Icon,
  borderInlineStart,
  borderTop
}: {
  lang: Lang;
  label: string;
  value: number;
  Icon: LucideIcon;
  borderInlineStart?: boolean;
  borderTop?: boolean;
}) {
  const isAr = lang === "ar";
  return (
    <div
      className="px-6 md:px-7 py-6 flex flex-col justify-center"
      style={{
        borderInlineStart: borderInlineStart ? "1px solid var(--stone-hair)" : undefined,
        borderTop: borderTop ? "1px solid var(--stone-hair)" : undefined
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div
          className={`text-[10px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase ${
            isAr ? "text-ar" : ""
          }`}
        >
          {label}
        </div>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-40)]" strokeWidth={1.5} />
      </div>
      <div
        className="text-[28px] md:text-[30px] font-semibold text-[var(--ink)] leading-none"
        style={{ letterSpacing: "-0.02em" }}
      >
        <NumberTicker value={value} />
      </div>
    </div>
  );
}
