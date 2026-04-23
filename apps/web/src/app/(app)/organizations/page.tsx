import Link from "next/link";

import { IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { LiftCard } from "@/components/motion/LiftCard";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { listUserOrgIds } from "@/lib/permissions";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";
import { SortSelect } from "./SortSelect";

type FilterKey = "all" | "urgent" | "pending" | "clean";
type SortKey = "activity" | "name" | "issues" | "newest";
type ViewKey = "grid" | "list";

type SearchParams = {
  filter?: FilterKey;
  sort?: SortKey;
  view?: ViewKey;
  q?: string;
};

function relative(date: Date | null | undefined, lang: Lang): string {
  if (!date) return "—";
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

function buildHref(params: SearchParams, overrides: Partial<SearchParams>): string {
  const merged: SearchParams = { ...params, ...overrides };
  const qs = new URLSearchParams();
  if (merged.filter && merged.filter !== "all") qs.set("filter", merged.filter);
  if (merged.sort && merged.sort !== "activity") qs.set("sort", merged.sort);
  if (merged.view && merged.view !== "grid") qs.set("view", merged.view);
  if (merged.q) qs.set("q", merged.q);
  const s = qs.toString();
  return `/organizations${s ? `?${s}` : ""}`;
}

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";
  const filter: FilterKey = searchParams.filter ?? "all";
  const sort: SortKey = searchParams.sort ?? "activity";
  const view: ViewKey = searchParams.view ?? "grid";
  const q = (searchParams.q ?? "").trim();

  const userOrgIds = await listUserOrgIds(user.id);

  const companies = await prisma.organization.findMany({
    where: {
      id: { in: userOrgIds },
      isActive: true,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { legalNameAr: { contains: q, mode: "insensitive" } },
              { legalNameEn: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { crNumber: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      issues: {
        where: {
          status: {
            in: [
              IssueStatus.OPEN,
              IssueStatus.ACKNOWLEDGED,
              IssueStatus.WITH_PROFESSIONAL,
              IssueStatus.WAITING_GOVERNMENT,
              IssueStatus.ESCALATED
            ]
          }
        },
        orderBy: { urgencyLevel: "desc" }
      }
    }
  });

  const enriched = companies.map((c) => {
    const openIssues: IssueForStatus[] = c.issues.map((i) => ({
      urgencyLevel: i.urgencyLevel,
      detectedDeadline: i.detectedDeadline,
      governmentBody: i.governmentBody
    }));
    const status = calculateCompanyStatus(openIssues);
    const topIssue = c.issues[0] ?? null;
    const lastActivity = c.issues[0]?.updatedAt ?? c.updatedAt;
    return { ...c, status, topIssue, lastActivity };
  });

  const filtered = enriched.filter((c) => {
    if (filter === "all") return true;
    if (filter === "urgent") return c.status === "RED";
    if (filter === "pending") return c.status === "YELLOW";
    if (filter === "clean") return c.status === "GREEN";
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === "name") return a.legalNameAr.localeCompare(b.legalNameAr);
    if (sort === "issues") return b.issues.length - a.issues.length;
    if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });

  const filters: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "all", label: t("companies.filter.all", lang), count: enriched.length },
    {
      key: "urgent",
      label: t("companies.filter.urgent", lang),
      count: enriched.filter((c) => c.status === "RED").length
    },
    {
      key: "pending",
      label: t("companies.filter.pending", lang),
      count: enriched.filter((c) => c.status === "YELLOW").length
    },
    {
      key: "clean",
      label: t("companies.filter.clean", lang),
      count: enriched.filter((c) => c.status === "GREEN").length
    }
  ];

  const sorts: Array<{ key: SortKey; label: string }> = [
    { key: "activity", label: isAr ? "آخر نشاط" : "Last activity" },
    { key: "name", label: isAr ? "الاسم" : "Name" },
    { key: "issues", label: isAr ? "الأكثر قضايا" : "Most issues" },
    { key: "newest", label: isAr ? "الأحدث" : "Newest" }
  ];

  return (
    <div className="max-w-[1100px] mx-auto">
      <Reveal>
        <div className="pt-6 pb-6 border-b border-[var(--stone-hair)] mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
              {isAr ? "الشركات" : "Organizations"}
            </div>
            <h1
              className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
                isAr ? "text-ar" : ""
              }`}
            >
              {t("companies.title", lang)}
            </h1>
            <p
              className={`font-display-it text-[16px] text-[var(--ink-60)] mt-2 max-w-[520px] ${
                isAr ? "text-ar" : ""
              }`}
            >
              {isAr
                ? "كل شركة ملف — مرتّب، محفوظ، مقروء."
                : "Each organization a file — kept, ordered, legible."}
            </p>
          </div>
          <Link href="/organizations/new" className="shrink-0">
            <Button>+ {t("companies.add", lang)}</Button>
          </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1">
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <Link
                  key={f.key}
                  href={buildHref(searchParams, { filter: f.key })}
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

          <form method="get" className="flex-1 min-w-[200px] max-w-[360px]">
            {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
            {sort !== "activity" && <input type="hidden" name="sort" value={sort} />}
            {view !== "grid" && <input type="hidden" name="view" value={view} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={isAr ? "بحث بالاسم أو السجل" : "Search name or CR"}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--stone-hair)] px-3 py-2 text-[13px] placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] focus:border-[var(--signal)]"
            />
          </form>

          <SortSelect value={sort} options={sorts} carry={{ filter, view, q }} />

          <div className="ms-auto flex items-center rounded-lg border border-[var(--stone-hair)] bg-[var(--card)] p-0.5">
            {(["grid", "list"] as ViewKey[]).map((v) => (
              <Link
                key={v}
                href={buildHref(searchParams, { view: v })}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                  view === v
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                }`}
              >
                {v === "grid" ? (isAr ? "شبكة" : "Grid") : isAr ? "قائمة" : "List"}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {filtered.length === 0 && (
        <Reveal delay={120}>
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--stone-hair)] elev-1 py-16 text-center flex flex-col items-center gap-5 px-6">
            <EmptyStateMark />
            <p
              className={`text-[22px] leading-snug text-[var(--ink)] max-w-[28ch] ${
                lang === "en" ? "font-display-en" : ""
              }`}
            >
              {t("companies.empty.hero", lang)}
            </p>
            <p className="text-[13px] text-[var(--ink-60)] max-w-[36ch]">
              {t("companies.empty.desc", lang)}
            </p>
            <Link href="/organizations/new">
              <Button>{t("companies.add", lang)}</Button>
            </Link>
          </div>
        </Reveal>
      )}

      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const tone: "healthy" | "attention" | "overdue" =
              c.status === "RED"
                ? "overdue"
                : c.status === "YELLOW"
                  ? "attention"
                  : "healthy";
            return (
              <LiftCard
                key={c.id}
                tiltMax={1}
                liftY={-3}
                className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 hover:elev-2 hover:border-[var(--ink-20)] h-full"
              >
                <Link
                  href={`/organizations/${c.id}`}
                  className="block p-5 h-full cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3
                        className={`text-[15.5px] font-semibold text-[var(--ink)] leading-snug ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {c.legalNameAr}
                      </h3>
                      {c.tradeName && (
                        <p className="text-[12px] text-[var(--ink-40)] mt-0.5 truncate">
                          {c.tradeName}
                        </p>
                      )}
                    </div>
                    <StatusDot status={tone} size={8} />
                  </div>
                  <div className="text-[12.5px] text-[var(--ink-60)] mb-2">
                    <span className="num">{c.issues.length}</span>{" "}
                    {t("companies.openIssues", lang)}
                  </div>
                  {c.topIssue ? (
                    <div
                      className={`text-[13px] text-[var(--ink-80)] line-clamp-2 ${
                        isAr ? "text-ar" : ""
                      }`}
                    >
                      {c.topIssue.titleAr}
                      {c.topIssue.detectedAmountSar && (
                        <>
                          {" "}
                          <Badge variant="accent">
                            <span className="num">
                              SAR {Number(c.topIssue.detectedAmountSar).toLocaleString()}
                            </span>
                          </Badge>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[var(--ink-40)]">
                      {t("companies.noIssues", lang)}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-[var(--stone-hair)] text-[11px] font-mono text-[var(--ink-40)] num">
                    {t("companies.lastActivity", lang)}: {relative(c.lastActivity, lang)}
                  </div>
                </Link>
              </LiftCard>
            );
          })}
        </div>
      )}

      {view === "list" && filtered.length > 0 && (
        <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 overflow-hidden">
          <Table>
            <Thead>
              <Tr className="hover:bg-transparent">
                <Th>{isAr ? "الشركة" : "Company"}</Th>
                <Th>{isAr ? "الحالة" : "Status"}</Th>
                <Th className="text-end">{t("companies.openIssues", lang)}</Th>
                <Th>{isAr ? "أهم قضية" : "Top issue"}</Th>
                <Th className="text-end">{t("companies.lastActivity", lang)}</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((c) => {
                const tone: "healthy" | "attention" | "overdue" =
                  c.status === "RED"
                    ? "overdue"
                    : c.status === "YELLOW"
                      ? "attention"
                      : "healthy";
                return (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-[var(--ink)]">
                      <Link
                        href={`/organizations/${c.id}`}
                        className="hover:text-[var(--signal)]"
                      >
                        {c.legalNameAr}
                      </Link>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot status={tone} size={6} />
                        <span className="text-[12px] text-[var(--ink-60)]">
                          {t(`status.${c.status}`, lang)}
                        </span>
                      </span>
                    </Td>
                    <Td className="text-end num">{c.issues.length}</Td>
                    <Td className="text-[var(--ink-60)] max-w-[280px] truncate">
                      {c.topIssue?.titleAr ?? "—"}
                    </Td>
                    <Td className="text-end num text-[var(--ink-40)]">
                      {relative(c.lastActivity, lang)}
                    </Td>
                    <Td className="text-end">
                      <Link
                        href={`/organizations/${c.id}`}
                        className="text-[var(--ink-40)] hover:text-[var(--signal)]"
                      >
                        <span className="inline-block flip-rtl">→</span>
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
