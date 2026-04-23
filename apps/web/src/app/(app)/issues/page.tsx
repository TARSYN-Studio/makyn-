import Link from "next/link";

import { IssueStatus, prisma } from "@makyn/db";
import { hoursUntil } from "@makyn/core";

import { Badge } from "@/components/ui/badge";
import { LiftCard } from "@/components/motion/LiftCard";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { listUserOrgIds } from "@/lib/permissions";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type FilterKey = "active" | "resolved" | "all" | "urgent";
type SearchParams = { filter?: FilterKey };

const OPEN_STATUSES: IssueStatus[] = [
  IssueStatus.OPEN,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.WITH_PROFESSIONAL,
  IssueStatus.WAITING_GOVERNMENT,
  IssueStatus.ESCALATED
];

function deadlinePill(d: Date | null, lang: Lang): { label: string; tone: string } | null {
  if (!d) return null;
  const h = hoursUntil(d);
  if (h < 0) {
    const days = Math.round(-h / 24);
    return {
      label: lang === "ar" ? `متأخرة ${days}ي` : `${days}d overdue`,
      tone: "var(--state-overdue)"
    };
  }
  const days = Math.round(h / 24);
  if (days === 0) {
    return { label: lang === "ar" ? "اليوم" : "today", tone: "var(--state-overdue)" };
  }
  if (days <= 7) {
    return {
      label: lang === "ar" ? `خلال ${days}ي` : `in ${days}d`,
      tone: "var(--state-pending)"
    };
  }
  return {
    label: lang === "ar" ? `خلال ${days}ي` : `in ${days}d`,
    tone: "var(--ink-40)"
  };
}

export default async function IssuesPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";
  const filter: FilterKey = searchParams.filter ?? "active";

  const userOrgIds = await listUserOrgIds(user.id);
  const orgScope = { in: userOrgIds };

  const [activeCount, resolvedCount, allCount, urgentCount, issues] = await Promise.all([
    prisma.issue.count({
      where: { organizationId: orgScope, status: { in: OPEN_STATUSES } }
    }),
    prisma.issue.count({
      where: {
        organizationId: orgScope,
        status: { in: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] }
      }
    }),
    prisma.issue.count({ where: { organizationId: orgScope } }),
    prisma.issue.count({
      where: {
        organizationId: orgScope,
        urgencyLevel: 5,
        status: { in: OPEN_STATUSES }
      }
    }),
    prisma.issue.findMany({
      where: {
        organizationId: orgScope,
        ...(filter === "active"
          ? { status: { in: OPEN_STATUSES } }
          : filter === "resolved"
            ? { status: { in: [IssueStatus.RESOLVED, IssueStatus.ARCHIVED] } }
            : filter === "urgent"
              ? { status: { in: OPEN_STATUSES }, urgencyLevel: 5 }
              : {})
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: [{ urgencyLevel: "desc" }, { detectedDeadline: "asc" }, { createdAt: "desc" }],
      take: 60
    })
  ]);

  const filters: Array<{ key: FilterKey; label: string; count: number }> = [
    {
      key: "active",
      label: isAr ? "النشطة" : "Active",
      count: activeCount
    },
    {
      key: "urgent",
      label: isAr ? "عاجلة" : "Urgent",
      count: urgentCount
    },
    {
      key: "resolved",
      label: isAr ? "محلولة" : "Resolved",
      count: resolvedCount
    },
    {
      key: "all",
      label: isAr ? "الكل" : "All",
      count: allCount
    }
  ];

  return (
    <div className="max-w-[1100px] mx-auto">
      <Reveal>
        <div className="pt-6 pb-6 border-b border-[var(--stone-hair)] mb-6">
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "المسائل" : "Issues"}
          </div>
          <h1
            className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr ? "كل ما نتعامل معه" : "Everything in motion"}
          </h1>
          <p
            className={`font-display-it text-[16px] md:text-[18px] text-[var(--ink-60)] mt-2 max-w-[560px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr
              ? "المسائل عبر كل ملفاتك — مرتّبة حسب الإلحاح."
              : "Every matter across your files — ordered by urgency."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <Link
                key={f.key}
                href={`/issues${f.key === "active" ? "" : `?filter=${f.key}`}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)] font-medium"
                    : "bg-[var(--card)] border border-[var(--stone-hair)] text-[var(--ink-60)] hover:text-[var(--ink)] hover:border-[var(--ink-20)]"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10.5px] font-mono num ${
                    active ? "opacity-70" : "text-[var(--ink-40)]"
                  }`}
                >
                  {f.count}
                </span>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {issues.length === 0 ? (
        <Reveal delay={120}>
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--stone-hair)] elev-1 py-16 flex flex-col items-center text-center gap-5 px-6">
            <EmptyStateMark />
            <p
              className={`text-[20px] leading-snug text-[var(--ink)] max-w-[28ch] ${
                lang === "en" ? "font-display-en" : ""
              }`}
            >
              {isAr ? "لا يوجد شيء في انتظارك." : "Nothing is waiting on you."}
            </p>
            <p className="text-[13px] text-[var(--ink-60)] max-w-[36ch]">
              {isAr
                ? "سنعرض هنا أي مسألة جديدة فور وصولها."
                : "We'll surface any new matter the moment it arrives."}
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-2.5">
          {issues.map((iss) => {
            const pill = deadlinePill(iss.detectedDeadline, lang);
            const tone =
              iss.urgencyLevel >= 5
                ? "var(--state-overdue)"
                : iss.urgencyLevel >= 3
                  ? "var(--state-pending)"
                  : "var(--ink-40)";
            const toneTint =
              iss.urgencyLevel >= 5
                ? "var(--state-overdue-tint)"
                : iss.urgencyLevel >= 3
                  ? "var(--state-pending-tint)"
                  : "var(--paper-deep)";
            const isResolved =
              iss.status === IssueStatus.RESOLVED || iss.status === IssueStatus.ARCHIVED;
            return (
              <LiftCard
                key={iss.id}
                tiltMax={0.6}
                liftY={-2}
                className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 hover:elev-2 hover:border-[var(--ink-20)] overflow-hidden"
              >
                <Link
                  href={`/organizations/${iss.organizationId}/issues/${iss.id}`}
                  className="flex items-stretch"
                >
                  <span className="w-1 shrink-0" style={{ background: tone }} />
                  <div className="flex-1 p-4 min-w-0 flex items-start gap-4 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-mono tracking-[0.14em] uppercase"
                          style={{ background: toneTint, color: tone }}
                        >
                          {iss.governmentBody}
                        </span>
                        {iss.urgencyLevel >= 5 && !isResolved && (
                          <span className="text-[9.5px] font-mono tracking-[0.16em] uppercase text-[var(--state-overdue)]">
                            {isAr ? "عاجل" : "Urgent"}
                          </span>
                        )}
                        <span className="text-[10.5px] font-mono text-[var(--ink-40)] truncate">
                          {iss.organization?.legalNameAr ?? ""}
                        </span>
                      </div>
                      <h3
                        className={`text-[15px] font-semibold text-[var(--ink)] leading-snug ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {iss.titleAr}
                      </h3>
                      {iss.summaryAr && (
                        <p
                          className={`text-[12.5px] text-[var(--ink-60)] line-clamp-2 mt-1 ${
                            isAr ? "text-ar" : ""
                          }`}
                        >
                          {iss.summaryAr}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[11px] flex-wrap">
                        <StatusDot
                          status={
                            isResolved
                              ? "healthy"
                              : iss.urgencyLevel >= 5
                                ? "overdue"
                                : "attention"
                          }
                          size={5}
                        />
                        <span className="text-[var(--ink-60)]">
                          {t(`issue.status.${iss.status}`, lang)}
                        </span>
                        <Badge>U{iss.urgencyLevel}</Badge>
                      </div>
                    </div>
                    <div className="flex-none text-end">
                      {iss.detectedAmountSar && (
                        <div className="text-[15px] font-semibold text-[var(--ink)] num leading-none">
                          {Number(iss.detectedAmountSar).toLocaleString()}{" "}
                          <span className="text-[10px] font-mono text-[var(--ink-40)] tracking-wider uppercase">
                            SAR
                          </span>
                        </div>
                      )}
                      {pill && (
                        <div
                          className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-mono tracking-[0.1em] uppercase num"
                          style={{
                            background:
                              pill.tone === "var(--ink-40)"
                                ? "var(--paper-deep)"
                                : pill.tone === "var(--state-overdue)"
                                  ? "var(--state-overdue-tint)"
                                  : "var(--state-pending-tint)",
                            color: pill.tone
                          }}
                        >
                          {pill.label}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </LiftCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
