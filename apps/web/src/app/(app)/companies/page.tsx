import Link from "next/link";

import { IssueStatus, prisma } from "@makyn/db";
import { calculateCompanyStatus, type IssueForStatus } from "@makyn/core";

import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

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
  const diffMs = Date.now() - date.getTime();
  const h = Math.round(diffMs / (1000 * 60 * 60));
  if (h < 1) return lang === "ar" ? "قبل دقائق" : "minutes ago";
  if (h < 24) return lang === "ar" ? `قبل ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `قبل ${d} ي` : `${d}d ago`;
}

function buildHref(params: SearchParams, overrides: Partial<SearchParams>): string {
  const merged: SearchParams = { ...params, ...overrides };
  const qs = new URLSearchParams();
  if (merged.filter && merged.filter !== "all") qs.set("filter", merged.filter);
  if (merged.sort && merged.sort !== "activity") qs.set("sort", merged.sort);
  if (merged.view && merged.view !== "grid") qs.set("view", merged.view);
  if (merged.q) qs.set("q", merged.q);
  const s = qs.toString();
  return `/companies${s ? `?${s}` : ""}`;
}

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const filter: FilterKey = searchParams.filter ?? "all";
  const sort: SortKey = searchParams.sort ?? "activity";
  const view: ViewKey = searchParams.view ?? "grid";
  const q = (searchParams.q ?? "").trim();

  const companies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
      isActive: true,
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
    // activity (default)
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: t("companies.filter.all", lang) },
    { key: "urgent", label: t("companies.filter.urgent", lang) },
    { key: "pending", label: t("companies.filter.pending", lang) },
    { key: "clean", label: t("companies.filter.clean", lang) }
  ];

  const sorts: Array<{ key: SortKey; label: string }> = [
    { key: "activity", label: lang === "ar" ? "آخر نشاط" : "Last activity" },
    { key: "name", label: lang === "ar" ? "الاسم" : "Name" },
    { key: "issues", label: lang === "ar" ? "الأكثر قضايا" : "Most issues" },
    { key: "newest", label: lang === "ar" ? "الأحدث" : "Newest" }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1
          className="font-display-en text-[32px] leading-none text-[var(--text)]"
          style={{ fontWeight: 400 }}
        >
          {t("companies.title", lang)}
        </h1>
        <Link href="/companies/new">
          <Button>+ {t("companies.add", lang)}</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <Link
                key={f.key}
                href={buildHref(searchParams, { filter: f.key })}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--text-mid)] hover:bg-[var(--surface)]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form method="get" className="flex-1 min-w-[200px] max-w-[360px]">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          {sort !== "activity" && <input type="hidden" name="sort" value={sort} />}
          {view !== "grid" && <input type="hidden" name="view" value={view} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={lang === "ar" ? "بحث بالاسم أو السجل" : "Search name or CR"}
            className="w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-[13px] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] focus:border-[var(--accent)]"
          />
        </form>

        {/* Sort */}
        <form method="get" className="flex items-center gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          {view !== "grid" && <input type="hidden" name="view" value={view} />}
          {q && <input type="hidden" name="q" value={q} />}
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg bg-[var(--card)] border border-[var(--border)] px-2 py-1.5 text-[13px] text-[var(--text-mid)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] focus:border-[var(--accent)]"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="text-[12px] text-[var(--text-mid)] hover:text-[var(--text)]"
          >
            {lang === "ar" ? "تطبيق" : "Apply"}
          </button>
        </form>

        {/* View toggle */}
        <div className="ms-auto flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5">
          {(["grid", "list"] as ViewKey[]).map((v) => (
            <Link
              key={v}
              href={buildHref(searchParams, { view: v })}
              className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                view === v
                  ? "bg-[var(--surface)] text-[var(--text)]"
                  : "text-[var(--text-mid)]"
              }`}
            >
              {v === "grid"
                ? lang === "ar"
                  ? "شبكة"
                  : "Grid"
                : lang === "ar"
                  ? "قائمة"
                  : "List"}
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">
              {t("companies.empty.title", lang)}
            </h2>
            <p className="text-[13px] text-[var(--text-mid)] mb-6">
              {t("companies.empty.desc", lang)}
            </p>
            <Link href="/companies/new">
              <Button>+ {t("companies.add", lang)}</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const dotColor =
              c.status === "RED" ? "red" : c.status === "YELLOW" ? "yellow" : "green";
            return (
              <Link key={c.id} href={`/companies/${c.id}`}>
                <Card interactive className="h-full cursor-pointer">
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[15px] font-semibold text-[var(--text)] leading-snug">
                          {c.legalNameAr}
                        </h3>
                        {c.tradeName && (
                          <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
                            {c.tradeName}
                          </p>
                        )}
                      </div>
                      <StatusDot color={dotColor} />
                    </div>
                    <div className="text-[13px] text-[var(--text-mid)]">
                      <span className="num">{c.issues.length}</span>{" "}
                      {t("companies.openIssues", lang)}
                    </div>
                    {c.topIssue ? (
                      <div className="text-[13px] text-[var(--text)] line-clamp-2">
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
                      <p className="text-[12px] text-[var(--text-dim)]">
                        {t("companies.noIssues", lang)}
                      </p>
                    )}
                    <div className="text-[12px] text-[var(--text-dim)] num">
                      {t("companies.lastActivity", lang)}: {relative(c.lastActivity, lang)}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {view === "list" && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <Thead>
              <Tr className="hover:bg-transparent">
                <Th>{lang === "ar" ? "الشركة" : "Company"}</Th>
                <Th>{lang === "ar" ? "الحالة" : "Status"}</Th>
                <Th className="text-end">{t("companies.openIssues", lang)}</Th>
                <Th>{lang === "ar" ? "أهم قضية" : "Top issue"}</Th>
                <Th className="text-end">{t("companies.lastActivity", lang)}</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((c) => {
                const dotColor =
                  c.status === "RED" ? "red" : c.status === "YELLOW" ? "yellow" : "green";
                return (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-[var(--text)]">
                      <Link
                        href={`/companies/${c.id}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {c.legalNameAr}
                      </Link>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot color={dotColor} />
                        <span className="text-[12px] text-[var(--text-mid)]">
                          {t(`status.${c.status}`, lang)}
                        </span>
                      </span>
                    </Td>
                    <Td className="text-end num">{c.issues.length}</Td>
                    <Td className="text-[var(--text-mid)] max-w-[280px] truncate">
                      {c.topIssue?.titleAr ?? "—"}
                    </Td>
                    <Td className="text-end num text-[var(--text-dim)]">
                      {relative(c.lastActivity, lang)}
                    </Td>
                    <Td className="text-end">
                      <Link
                        href={`/companies/${c.id}`}
                        className="text-[var(--text-dim)] hover:text-[var(--accent)]"
                      >
                        <span className="inline-block flip-rtl">→</span>
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
