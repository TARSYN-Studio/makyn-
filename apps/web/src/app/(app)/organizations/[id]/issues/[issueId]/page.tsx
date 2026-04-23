import Link from "next/link";
import { notFound } from "next/navigation";

import { IssueStatus, prisma } from "@makyn/db";
import { hoursUntil } from "@makyn/core";

import { StatusChangeForm, QuickStatusButton } from "./status-form";
import { AssignHandlerForm } from "./assign-handler";
import { AddNoteForm } from "./add-note";
import { CopyHandlerBrief } from "./copy-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LiftCard } from "@/components/motion/LiftCard";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { MagneticLink } from "@/components/motion/MagneticLink";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type PageProps = { params: { id: string; issueId: string } };

const urgencyBadge: Record<number, "neutral" | "waiting" | "urgent"> = {
  1: "neutral",
  2: "neutral",
  3: "waiting",
  4: "urgent",
  5: "urgent"
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function deadlineLabel(d: Date | null, lang: Lang): string {
  if (!d) return "—";
  const h = hoursUntil(d);
  if (h < 0) {
    const days = Math.round(-h / 24);
    return `${formatDate(d)} · ${lang === "ar" ? `متأخرة ${days}ي` : `${days}d overdue`}`;
  }
  const days = Math.round(h / 24);
  return `${formatDate(d)} · ${lang === "ar" ? `خلال ${days}ي` : `in ${days}d`}`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

export default async function IssueDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";

  try {
    await requireOrgAccess(user.id, params.id, "issue.read");
  } catch (e) {
    if (e instanceof OrgAccessError) notFound();
    throw e;
  }

  const issue = await prisma.issue.findFirst({
    where: { id: params.issueId, organizationId: params.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          direction: true,
          contentType: true,
          rawContent: true,
          extractedText: true,
          createdAt: true,
          mediaLocalPath: true,
          mediaFileId: true
        }
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } }
      },
      organization: { select: { id: true, legalNameAr: true } }
    }
  });

  if (!issue) notFound();

  const originalInbound = issue.messages.find((m) => m.direction === "INBOUND") ?? null;
  const conversation = issue.messages;

  const isResolved =
    issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.ARCHIVED;
  const tone: "healthy" | "attention" | "overdue" = isResolved
    ? "healthy"
    : issue.urgencyLevel >= 5
      ? "overdue"
      : issue.urgencyLevel >= 3
        ? "attention"
        : "healthy";
  const toneColor =
    tone === "overdue"
      ? "var(--state-overdue)"
      : tone === "attention"
        ? "var(--state-pending)"
        : "var(--state-resolved)";
  const toneTint =
    tone === "overdue"
      ? "var(--state-overdue-tint)"
      : tone === "attention"
        ? "var(--state-pending-tint)"
        : "var(--state-resolved-tint)";

  const markResolvedConfirm = isAr ? "وضع علامة محلولة؟" : "Mark this issue as resolved?";
  const escalateConfirm = isAr ? "تصعيد القضية؟" : "Escalate this issue?";
  const archiveConfirm = isAr ? "أرشفة القضية؟" : "Archive this issue?";

  return (
    <div className="max-w-[1100px] mx-auto pb-32">
      <Reveal>
        <div className="mb-4 text-[12px] text-[var(--ink-40)] flex items-center gap-2 flex-wrap">
          <Link href="/organizations" className="hover:text-[var(--signal)]">
            {isAr ? "شركاتي" : "Organizations"}
          </Link>
          <span>/</span>
          <Link
            href={`/organizations/${issue.organization?.id}`}
            className="hover:text-[var(--signal)]"
          >
            {issue.organization?.legalNameAr ?? ""}
          </Link>
          <span>/</span>
          <span className="text-[var(--ink-60)]">{truncate(issue.titleAr, 60)}</span>
        </div>
        <MagneticLink
          href={`/organizations/${issue.organization?.id}`}
          isRtl={isAr}
          className="text-[12px] text-[var(--ink-60)] hover:text-[var(--ink)] mb-6"
        >
          {isAr ? "← رجوع لملف الشركة" : "← Back to company file"}
        </MagneticLink>
      </Reveal>

      {/* Hero */}
      <Reveal delay={60}>
        <div className="pb-6 mb-8 border-b border-[var(--stone-hair)]">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="px-2 py-1 rounded text-[10px] font-mono tracking-[0.16em] uppercase"
              style={{ background: toneTint, color: toneColor }}
            >
              {issue.governmentBody}
            </span>
            {issue.urgencyLevel >= 4 && !isResolved && (
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono tracking-[0.16em] uppercase text-[var(--state-overdue)]">
                <StatusDot status="overdue" size={5} />
                {isAr ? "عاجل" : "Urgent"}
              </span>
            )}
            <Badge variant={urgencyBadge[issue.urgencyLevel]}>U{issue.urgencyLevel}</Badge>
            <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
          </div>
          <h1
            className={`text-[30px] md:text-[36px] font-semibold text-[var(--ink)] leading-[1.12] tracking-[-0.02em] max-w-[720px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {issue.titleAr}
          </h1>
          <p
            className={`font-display-it text-[16px] md:text-[18px] text-[var(--ink-60)] mt-3 leading-snug max-w-[620px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr ? "إليك ما فهمناه، وما نقترحه." : "Here's what we understood, and what we propose."}
          </p>

          {/* At-a-glance strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 mt-6 rounded-xl bg-[var(--card)] border border-[var(--stone-hair)] elev-2 overflow-hidden">
            <GlanceCell
              lang={lang}
              label={isAr ? "المبلغ" : "Amount due"}
              value={
                issue.detectedAmountSar ? (
                  <>
                    <NumberTicker value={Number(issue.detectedAmountSar)} />
                    <span className="text-[12px] font-mono text-[var(--ink-40)] tracking-wider uppercase ml-1">
                      SAR
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--ink-40)]">—</span>
                )
              }
            />
            <GlanceCell
              lang={lang}
              label={isAr ? "الموعد" : "Deadline"}
              value={deadlineLabel(issue.detectedDeadline, lang)}
              borderInlineStart
              monospace
            />
            <GlanceCell
              lang={lang}
              label={isAr ? "المرجع" : "Reference"}
              value={issue.referenceNumber ?? "—"}
              borderInlineStart
              monospace
            />
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <Reveal delay={120}>
            <section>
              <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
                {isAr ? "ما يعنيه هذا" : "What it means"}
              </div>
              <p
                className={`text-[15.5px] text-[var(--ink-80)] leading-[1.65] ${
                  isAr ? "text-ar" : ""
                }`}
              >
                {issue.summaryAr}
              </p>
            </section>
          </Reveal>

          {/* Original Notice */}
          <Reveal delay={180}>
            <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 overflow-hidden">
              <details>
                <summary className="cursor-pointer px-5 py-4 border-b border-[var(--stone-hair)] text-[13px] font-medium text-[var(--ink)]">
                  {t("issue.originalNotice", lang)}
                </summary>
                <div className="px-5 py-4 space-y-3 text-[13px] text-[var(--ink-60)]">
                  {originalInbound ? (
                    <>
                      <div className="num text-[11px] text-[var(--ink-40)]">
                        {originalInbound.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}
                      </div>
                      <div className="whitespace-pre-wrap text-[var(--ink)]">
                        {originalInbound.rawContent || "—"}
                      </div>
                      {originalInbound.extractedText && (
                        <div className="mt-2 p-3 rounded-lg bg-[var(--paper-low)] border border-[var(--stone-light)] whitespace-pre-wrap">
                          <div className="text-[11px] text-[var(--ink-40)] mb-1 uppercase tracking-wider">
                            OCR
                          </div>
                          {originalInbound.extractedText}
                        </div>
                      )}
                      {originalInbound.contentType === "PHOTO" && (
                        <div className="text-[12px] text-[var(--ink-40)]">
                          {isAr
                            ? "صورة مرفقة — اطلعي عليها في Telegram"
                            : "Image attached — view in Telegram"}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[var(--ink-40)]">—</p>
                  )}
                </div>
              </details>
            </div>
          </Reveal>

          {/* Conversation */}
          <Reveal delay={220}>
            <section>
              <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-3">
                {t("issue.conversation", lang)}
              </div>
              <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 p-5">
                {conversation.length === 0 && (
                  <p className="text-[13px] text-[var(--ink-40)]">—</p>
                )}
                <div className="space-y-3">
                  {conversation.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-3 text-[13px] border ${
                        m.direction === "INBOUND"
                          ? "bg-[var(--paper-low)] border-[var(--stone-hair)]"
                          : "bg-[var(--signal-tint)] border-[var(--signal-tint)]"
                      }`}
                    >
                      <div className="num text-[11px] text-[var(--ink-40)] mb-1">
                        {m.direction === "INBOUND"
                          ? isAr
                            ? "من المستخدم"
                            : "Inbound"
                          : isAr
                            ? "من مكين"
                            : "Outbound"}{" "}
                        · {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </div>
                      <div className="whitespace-pre-wrap text-[var(--ink)]">
                        {m.rawContent || m.extractedText || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>

          {/* Notes */}
          <Reveal delay={260}>
            <section>
              <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-3">
                {t("issue.notes", lang)}
              </div>
              <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 p-5 space-y-4">
                {issue.notes.length === 0 && (
                  <p className="text-[13px] text-[var(--ink-40)]">—</p>
                )}
                <ul className="space-y-3">
                  {issue.notes.map((n) => (
                    <li key={n.id} className="text-[13px]">
                      <div className="num text-[11px] text-[var(--ink-40)]">
                        {n.author.fullName} ·{" "}
                        {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </div>
                      <div
                        className={`text-[var(--ink)] whitespace-pre-wrap ${
                          isAr ? "text-ar" : ""
                        }`}
                      >
                        {n.content}
                      </div>
                    </li>
                  ))}
                </ul>
                <AddNoteForm issueId={issue.id} lang={lang} />
              </div>
            </section>
          </Reveal>
        </div>

        {/* RIGHT */}
        <aside className="lg:sticky lg:top-6 self-start space-y-4">
          <Reveal delay={120}>
            <div className="bg-[var(--signal-tint)] border border-[var(--signal-tint)] rounded-xl p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--signal)] font-semibold font-mono">
                {t("issue.recommendedAction", lang)}
              </div>
              <p
                className={`text-[14px] text-[var(--ink)] leading-relaxed ${
                  isAr ? "text-ar" : ""
                }`}
              >
                {issue.recommendedAction}
              </p>
              {issue.recommendedHandler && (
                <Badge variant="accent">
                  {t("issue.handler", lang)}: {issue.recommendedHandler}
                </Badge>
              )}
              {issue.whatToTellHandlerAr && (
                <CopyHandlerBrief text={issue.whatToTellHandlerAr} lang={lang} />
              )}
              <AssignHandlerForm
                issueId={issue.id}
                initial={issue.assignedHandlerName ?? ""}
                lang={lang}
              />
            </div>
          </Reveal>

          {issue.penaltyIfIgnored && (
            <Reveal delay={180}>
              <div className="bg-[var(--state-overdue-tint)] border border-[rgba(139, 38, 53, 0.2)] rounded-xl p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--state-overdue)] font-semibold font-mono mb-2">
                  {t("issue.penalty", lang)}
                </div>
                <p
                  className={`text-[13px] text-[var(--state-overdue)] ${
                    isAr ? "text-ar" : ""
                  }`}
                >
                  {issue.penaltyIfIgnored}
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={220}>
            <LiftCard
              tiltMax={0.4}
              liftY={-2}
              className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1"
            >
              <div className="px-5 py-4 border-b border-[var(--stone-hair)]">
                <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase">
                  {t("issue.extractedData", lang)}
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 text-[13px]">
                <DataRow
                  label={t("issue.reference", lang)}
                  value={issue.referenceNumber ?? "—"}
                />
                <DataRow
                  label={t("issue.amount", lang)}
                  value={
                    issue.detectedAmountSar
                      ? `SAR ${Number(issue.detectedAmountSar).toLocaleString()}`
                      : "—"
                  }
                />
                <DataRow
                  label={t("issue.deadline", lang)}
                  value={formatDate(issue.detectedDeadline)}
                />
              </div>
            </LiftCard>
          </Reveal>

          <Reveal delay={260}>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-[var(--ink)] text-[14px]">
                  {isAr ? "إجراءات سريعة" : "Quick actions"}
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                <QuickStatusButton
                  issueId={issue.id}
                  target={IssueStatus.RESOLVED}
                  variant="primary"
                  label={t("issue.markResolved", lang)}
                  confirm={markResolvedConfirm}
                />
                <QuickStatusButton
                  issueId={issue.id}
                  target={IssueStatus.ESCALATED}
                  variant="secondary"
                  label={t("issue.escalate", lang)}
                  confirm={escalateConfirm}
                />
                <QuickStatusButton
                  issueId={issue.id}
                  target={IssueStatus.ARCHIVED}
                  variant="ghost"
                  label={t("issue.archive", lang)}
                  confirm={archiveConfirm}
                />
              </CardBody>
            </Card>
          </Reveal>

          <Reveal delay={300}>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-[var(--ink)] text-[14px]">
                  {t("issue.status", lang)}
                </h2>
              </CardHeader>
              <CardBody>
                <StatusChangeForm issueId={issue.id} current={issue.status} lang={lang} />
              </CardBody>
            </Card>
          </Reveal>
        </aside>
      </div>

      {/* Sticky approval bar — offsets against the dock via CSS var. */}
      {!isResolved && (
        <div
          className="fixed bottom-0 z-30 pointer-events-none"
          style={{
            insetInlineStart: "var(--dock-inline-start)",
            insetInlineEnd: 0
          }}
        >
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 pb-6 flex justify-end">
            <div
              className="pointer-events-auto bg-[var(--ink)] text-[var(--paper)] rounded-2xl elev-float flex items-center gap-4 px-5 py-3.5"
              style={{
                whiteSpace: "nowrap",
                minWidth: 340
              }}
            >
              <div className="flex-1">
                <div
                  className={`text-[11.5px] text-[var(--paper)]/60 ${
                    isAr ? "text-ar" : ""
                  }`}
                >
                  {isAr ? "بانتظار إجراءك" : "Awaiting your action"}
                </div>
                <div
                  className={`text-[14px] font-medium mt-0.5 ${isAr ? "text-ar" : ""}`}
                >
                  {issue.detectedAmountSar
                    ? isAr
                      ? `اعتمد الدفعة `
                      : "Approve "
                    : isAr
                      ? "أغلق المسألة"
                      : "Close this issue"}
                  {issue.detectedAmountSar && (
                    <>
                      <span className="num">
                        {Number(issue.detectedAmountSar).toLocaleString()}
                      </span>{" "}
                      SAR
                    </>
                  )}
                </div>
              </div>
              <QuickStatusButton
                issueId={issue.id}
                target={IssueStatus.RESOLVED}
                variant="primary"
                label={t("issue.markResolved", lang)}
                confirm={markResolvedConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GlanceCell({
  lang,
  label,
  value,
  borderInlineStart,
  monospace
}: {
  lang: Lang;
  label: string;
  value: React.ReactNode;
  borderInlineStart?: boolean;
  monospace?: boolean;
}) {
  const isAr = lang === "ar";
  return (
    <div
      className="px-5 py-4"
      style={{
        borderInlineStart: borderInlineStart ? "1px solid var(--stone-hair)" : undefined
      }}
    >
      <div
        className={`text-[10px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2 ${
          isAr ? "text-ar" : ""
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[20px] font-semibold text-[var(--ink)] ${
          monospace ? "num" : ""
        }`}
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-[var(--ink-40)]">
        {label}
      </div>
      <div className="num text-[var(--ink)] mt-0.5">{value}</div>
    </div>
  );
}
