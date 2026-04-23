import Link from "next/link";
import { FileText } from "lucide-react";

import { ExtractionStatus, prisma } from "@makyn/db";

import { Reveal } from "@/components/motion/Reveal";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { listUserOrgIds } from "@/lib/permissions";
import { type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type SortKey = "recent" | "authority" | "status";
type SearchParams = { sort?: SortKey; q?: string };

function stateBadge(
  state: ExtractionStatus,
  lang: Lang
): { label: string; tone: string; dot: string } {
  const isAr = lang === "ar";
  switch (state) {
    case ExtractionStatus.COMPLETED:
      return {
        label: isAr ? "مكتمل" : "Extracted",
        tone: "var(--state-resolved)",
        dot: "var(--state-resolved)"
      };
    case ExtractionStatus.PROCESSING:
      return {
        label: isAr ? "جارٍ" : "Processing",
        tone: "var(--signal)",
        dot: "var(--signal)"
      };
    case ExtractionStatus.PENDING:
      return {
        label: isAr ? "قيد الانتظار" : "Pending",
        tone: "var(--state-pending)",
        dot: "var(--state-pending)"
      };
    case ExtractionStatus.FAILED:
      return {
        label: isAr ? "فشل" : "Failed",
        tone: "var(--state-overdue)",
        dot: "var(--state-overdue)"
      };
    default:
      return {
        label: String(state),
        tone: "var(--ink-40)",
        dot: "var(--ink-40)"
      };
  }
}

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";
  const sort: SortKey = searchParams.sort ?? "recent";
  const q = (searchParams.q ?? "").trim();

  const userOrgIds = await listUserOrgIds(user.id);
  const orgScope = { in: userOrgIds };

  const [total, completed, pending, failed, docs] = await Promise.all([
    prisma.companyDocument.count({ where: { organizationId: orgScope } }),
    prisma.companyDocument.count({
      where: { organizationId: orgScope, extractionStatus: ExtractionStatus.COMPLETED }
    }),
    prisma.companyDocument.count({
      where: {
        organizationId: orgScope,
        extractionStatus: { in: [ExtractionStatus.PENDING, ExtractionStatus.PROCESSING] }
      }
    }),
    prisma.companyDocument.count({
      where: { organizationId: orgScope, extractionStatus: ExtractionStatus.FAILED }
    }),
    prisma.companyDocument.findMany({
      where: {
        organizationId: orgScope,
        ...(q ? { originalName: { contains: q, mode: "insensitive" as const } } : {})
      },
      include: { organization: { select: { id: true, legalNameAr: true } } },
      orderBy:
        sort === "authority"
          ? [{ docType: "asc" }, { createdAt: "desc" }]
          : sort === "status"
            ? [{ extractionStatus: "asc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }],
      take: 120
    })
  ]);

  const metrics = [
    { label: isAr ? "إجمالي" : "Total", value: total },
    { label: isAr ? "مستخرجة" : "Extracted", value: completed },
    { label: isAr ? "قيد الاستخراج" : "In progress", value: pending },
    { label: isAr ? "فشلت" : "Failed", value: failed }
  ];

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: "recent", label: isAr ? "الأحدث" : "Recent" },
    { key: "authority", label: isAr ? "النوع" : "Type" },
    { key: "status", label: isAr ? "الحالة" : "Status" }
  ];

  return (
    <div className="max-w-[1100px] mx-auto">
      <Reveal>
        <div className="pt-6 pb-6 border-b border-[var(--stone-hair)] mb-6">
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "المستندات" : "Documents"}
          </div>
          <h1
            className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr ? "خزانة المستندات" : "Document vault"}
          </h1>
          <p
            className={`font-display-it text-[16px] md:text-[18px] text-[var(--ink-60)] mt-2 max-w-[560px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr
              ? "كل ما رفعناه وقرأناه وحفظناه في ملفاتك."
              : "Everything uploaded, read, and filed under your organizations."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 px-4 py-4"
            >
              <div
                className={`text-[10px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-1.5 ${
                  isAr ? "text-ar" : ""
                }`}
              >
                {m.label}
              </div>
              <div className="num text-[24px] font-semibold text-[var(--ink)] leading-none">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <form method="get" className="flex-1 min-w-[220px] max-w-[360px]">
            {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={isAr ? "بحث بالاسم أو النوع" : "Search name or type"}
              className="w-full rounded-lg bg-[var(--card)] border border-[var(--stone-hair)] px-3 py-2 text-[13px] placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] focus:border-[var(--signal)]"
            />
          </form>
          <div className="ms-auto flex items-center rounded-lg border border-[var(--stone-hair)] bg-[var(--card)] p-0.5">
            {sortOptions.map((opt) => (
              <Link
                key={opt.key}
                href={`/documents${opt.key === "recent" ? "" : `?sort=${opt.key}`}${
                  q ? `${opt.key === "recent" ? "?" : "&"}q=${encodeURIComponent(q)}` : ""
                }`}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                  sort === opt.key
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {docs.length === 0 ? (
        <Reveal delay={160}>
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--stone-hair)] elev-1 py-16 flex flex-col items-center text-center gap-5 px-6">
            <EmptyStateMark />
            <p
              className={`text-[20px] leading-snug text-[var(--ink)] max-w-[28ch] ${
                lang === "en" ? "font-display-en" : ""
              }`}
            >
              {isAr ? "لم تُرفع مستندات بعد." : "No documents on file yet."}
            </p>
            <p className="text-[13px] text-[var(--ink-60)] max-w-[36ch]">
              {isAr
                ? "ارفع وثائقك من شاشة إعداد الشركة لنبدأ بقراءتها وتنظيمها."
                : "Upload from your onboarding flow and we'll read and file them."}
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="rounded-2xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_120px_120px] gap-4 px-5 py-3 bg-[var(--card-warm)] border-b border-[var(--stone-hair)] text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.16em] uppercase">
            <div>{isAr ? "المستند" : "Document"}</div>
            <div>{isAr ? "النوع" : "Type"}</div>
            <div>{isAr ? "الحالة" : "State"}</div>
            <div className="text-end">{isAr ? "التاريخ" : "Date"}</div>
          </div>
          <ul>
            {docs.map((d) => {
              const s = stateBadge(d.extractionStatus, lang);
              return (
                <li
                  key={d.id}
                  className="grid grid-cols-[1fr_140px_120px_120px] gap-4 px-5 py-3.5 border-b last:border-b-0 border-[var(--stone-hair)] hover:bg-[var(--card-warm)] transition-colors"
                >
                  <Link
                    href={`/organizations/${d.organizationId}?tab=documents`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <span className="w-8 h-8 rounded-md bg-[var(--paper-deep)] grid place-items-center shrink-0">
                      <FileText className="h-4 w-4 text-[var(--ink-60)]" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--ink)] truncate">
                        {d.originalName}
                      </div>
                      <div className="text-[11px] text-[var(--ink-40)] truncate">
                        {d.organization?.legalNameAr ?? ""}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center text-[12px] text-[var(--ink-60)] truncate">
                    {d.docType}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: s.dot }}
                    />
                    <span style={{ color: s.tone }}>{s.label}</span>
                  </div>
                  <div className="flex items-center justify-end num text-[12px] text-[var(--ink-40)]">
                    {d.createdAt.toISOString().slice(0, 10)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
