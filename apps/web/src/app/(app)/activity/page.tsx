import Link from "next/link";
import {
  Download,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Mail,
  Search
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ChannelType, ExtractionStatus, IssueStatus, prisma } from "@makyn/db";

import { Reveal } from "@/components/motion/Reveal";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { listUserOrgIds } from "@/lib/permissions";
import { type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type Kind =
  | "received"
  | "resolved"
  | "drafted"
  | "analyzed"
  | "filed"
  | "digest";

function kindMeta(
  kind: Kind,
  lang: Lang
): { label: string; Icon: LucideIcon; tone: string; tint: string } {
  const isAr = lang === "ar";
  switch (kind) {
    case "received":
      return {
        label: isAr ? "وصل إشعار" : "Notice received",
        Icon: Download,
        tone: "var(--signal)",
        tint: "var(--signal-tint)"
      };
    case "resolved":
      return {
        label: isAr ? "أُنجزت مسألة" : "Issue resolved",
        Icon: CheckCircle2,
        tone: "var(--state-resolved)",
        tint: "var(--state-resolved-tint)"
      };
    case "drafted":
      return {
        label: isAr ? "جُهّز رد" : "Draft prepared",
        Icon: Mail,
        tone: "var(--state-pending)",
        tint: "var(--state-pending-tint)"
      };
    case "analyzed":
      return {
        label: isAr ? "مسألة جديدة" : "Issue analyzed",
        Icon: AlertTriangle,
        tone: "var(--state-overdue)",
        tint: "var(--state-overdue-tint)"
      };
    case "filed":
      return {
        label: isAr ? "استُخرج مستند" : "Document filed",
        Icon: FileText,
        tone: "var(--ink-60)",
        tint: "var(--paper-deep)"
      };
    case "digest":
      return {
        label: isAr ? "ملخص" : "Digest",
        Icon: Search,
        tone: "var(--ink-60)",
        tint: "var(--paper-deep)"
      };
  }
}

type Event = {
  at: Date;
  kind: Kind;
  label: string;
  company: string;
  href?: string;
};

function groupByDay(events: Event[], lang: Lang): Array<{ key: string; label: string; events: Event[] }> {
  const isAr = lang === "ar";
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yd = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const ydKey = yd.toISOString().slice(0, 10);

  const groups: Record<string, Event[]> = {};
  for (const e of events) {
    const key = e.at.toISOString().slice(0, 10);
    groups[key] ??= [];
    groups[key].push(e);
  }

  const sortedKeys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
  return sortedKeys.map((key) => {
    let label = key;
    if (key === todayKey) label = isAr ? "اليوم" : "Today";
    else if (key === ydKey) label = isAr ? "أمس" : "Yesterday";
    else {
      const d = new Date(key);
      label = d.toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    return { key, label, events: groups[key] };
  });
}

export default async function ActivityPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";

  const userOrgIds = await listUserOrgIds(user.id);
  const orgScope = { in: userOrgIds };
  const minus30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [newIssues, resolvedIssues, docs, inboundMessages] = await Promise.all([
    prisma.issue.findMany({
      where: { organizationId: orgScope, createdAt: { gte: minus30d } },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.issue.findMany({
      where: {
        organizationId: orgScope,
        status: IssueStatus.RESOLVED,
        resolvedAt: { gte: minus30d, not: null }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { resolvedAt: "desc" },
      take: 60
    }),
    prisma.companyDocument.findMany({
      where: {
        organizationId: orgScope,
        extractionStatus: ExtractionStatus.COMPLETED,
        extractionCompletedAt: { gte: minus30d, not: null }
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy: { extractionCompletedAt: "desc" },
      take: 60
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
      take: 60
    })
  ]);

  const events: Event[] = [];
  for (const i of newIssues) {
    events.push({
      at: i.createdAt,
      kind: "analyzed",
      label: i.titleAr,
      company: i.organization?.legalNameAr ?? "",
      href: `/organizations/${i.organizationId}/issues/${i.id}`
    });
  }
  for (const i of resolvedIssues) {
    if (!i.resolvedAt) continue;
    events.push({
      at: i.resolvedAt,
      kind: "resolved",
      label: i.titleAr,
      company: i.organization?.legalNameAr ?? "",
      href: `/organizations/${i.organizationId}/issues/${i.id}`
    });
  }
  for (const d of docs) {
    if (!d.extractionCompletedAt) continue;
    events.push({
      at: d.extractionCompletedAt,
      kind: "filed",
      label: d.originalName,
      company: d.organization?.legalNameAr ?? "",
      href: `/organizations/${d.organizationId}?tab=documents`
    });
  }
  for (const m of inboundMessages) {
    events.push({
      at: m.createdAt,
      kind: "received",
      label: (m.rawContent ?? "").slice(0, 120) || "—",
      company: m.organization?.legalNameAr ?? (isAr ? "غير مطابقة" : "Unmatched"),
      href: m.organizationId ? `/organizations/${m.organizationId}` : undefined
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  const grouped = groupByDay(events.slice(0, 120), lang);

  return (
    <div className="max-w-[900px] mx-auto">
      <Reveal>
        <div className="pt-6 pb-6 border-b border-[var(--stone-hair)] mb-6">
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "السجل" : "Activity"}
          </div>
          <h1
            className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr ? "ما فعلناه من أجلك" : "What we've done for you"}
          </h1>
          <p
            className={`font-display-it text-[16px] md:text-[18px] text-[var(--ink-60)] mt-2 max-w-[520px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr
              ? "كل حركة على ملفاتك — مرتّبة يوماً بيوم."
              : "Every movement on your files — day by day."}
          </p>
        </div>
      </Reveal>

      {grouped.length === 0 ? (
        <Reveal delay={80}>
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--stone-hair)] elev-1 py-16 flex flex-col items-center text-center gap-5 px-6">
            <EmptyStateMark />
            <p
              className={`text-[20px] leading-snug text-[var(--ink)] max-w-[28ch] ${
                lang === "en" ? "font-display-en" : ""
              }`}
            >
              {isAr ? "لا يوجد نشاط بعد." : "Nothing to show yet."}
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-8">
          {grouped.map((g, gIdx) => (
            <Reveal key={g.key} delay={gIdx * 40}>
              <section>
                <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-3">
                  {g.label}
                </div>
                <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 divide-y divide-[var(--stone-hair)]">
                  {g.events.map((e, i) => {
                    const meta = kindMeta(e.kind, lang);
                    const Inner = (
                      <div className="flex items-start gap-4 px-5 py-3.5">
                        <span
                          className="w-8 h-8 rounded-full shrink-0 grid place-items-center"
                          style={{ background: meta.tint }}
                        >
                          <meta.Icon
                            className="h-4 w-4"
                            strokeWidth={1.5}
                            style={{ color: meta.tone }}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-mono text-[var(--ink-40)] tracking-wider uppercase">
                            {meta.label} ·{" "}
                            <span className="text-[var(--ink-60)] normal-case tracking-normal">
                              {e.company}
                            </span>
                          </div>
                          <div
                            className={`text-[13px] text-[var(--ink-80)] truncate ${
                              isAr ? "text-ar" : ""
                            }`}
                          >
                            {e.label}
                          </div>
                        </div>
                        <span className="num text-[11px] text-[var(--ink-40)] shrink-0">
                          {e.at.toISOString().slice(11, 16)}
                        </span>
                      </div>
                    );
                    return e.href ? (
                      <Link
                        key={i}
                        href={e.href}
                        className="block hover:bg-[var(--card-warm)] transition-colors"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <div key={i}>{Inner}</div>
                    );
                  })}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
