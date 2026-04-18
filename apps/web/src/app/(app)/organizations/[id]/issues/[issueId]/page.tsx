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
import { PageFrame } from "@/components/PageFrame";
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
    return `${formatDate(d)} — ${lang === "ar" ? `متأخرة ${days} يوم` : `${days}d overdue`}`;
  }
  const days = Math.round(h / 24);
  return `${formatDate(d)} — ${lang === "ar" ? `خلال ${days} يوم` : `in ${days}d`}`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

export default async function IssueDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

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

  const sep = " / ";
  const markResolvedConfirm =
    lang === "ar" ? "وضع علامة محلولة؟" : "Mark this issue as resolved?";
  const escalateConfirm = lang === "ar" ? "تصعيد القضية؟" : "Escalate this issue?";
  const archiveConfirm = lang === "ar" ? "أرشفة القضية؟" : "Archive this issue?";

  return (
    <PageFrame className="max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-4 text-[12px] text-[var(--text-dim)]">
        <Link href="/organizations" className="hover:text-[var(--accent)]">
          {lang === "ar" ? "شركاتي" : "Companies"}
        </Link>
        <span>{sep}</span>
        <Link
          href={`/organizations/${issue.organization?.id}`}
          className="hover:text-[var(--accent)]"
        >
          {issue.organization?.legalNameAr ?? ""}
        </Link>
        <span>{sep}</span>
        <span className="text-[var(--text-mid)]">{truncate(issue.titleAr, 60)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <div>
            <h1
              className="font-display-en text-[28px] leading-tight text-[var(--text)]"
              style={{ fontWeight: 400 }}
            >
              {issue.titleAr}
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="accent">{issue.governmentBody}</Badge>
              <Badge variant={urgencyBadge[issue.urgencyLevel]}>
                U{issue.urgencyLevel}
              </Badge>
              <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
              {issue.detectedDeadline && (
                <span className="num text-[12px] text-[var(--text-mid)]">
                  {deadlineLabel(issue.detectedDeadline, lang)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-[var(--text)]">
            {issue.summaryAr}
          </p>

          {/* Original Notice */}
          <Card>
            <details>
              <summary className="cursor-pointer px-5 py-4 border-b border-[var(--border)] text-[13px] font-medium text-[var(--text)]">
                {t("issue.originalNotice", lang)}
              </summary>
              <div className="px-5 py-4 space-y-3 text-[13px] text-[var(--text-mid)]">
                {originalInbound ? (
                  <>
                    <div className="num text-[11px] text-[var(--text-dim)]">
                      {originalInbound.createdAt
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                    </div>
                    <div className="whitespace-pre-wrap text-[var(--text)]">
                      {originalInbound.rawContent || "—"}
                    </div>
                    {originalInbound.extractedText && (
                      <div className="mt-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] whitespace-pre-wrap">
                        <div className="text-[11px] text-[var(--text-dim)] mb-1 uppercase tracking-wider">
                          OCR
                        </div>
                        {originalInbound.extractedText}
                      </div>
                    )}
                    {originalInbound.contentType === "PHOTO" && (
                      <div className="text-[12px] text-[var(--text-dim)]">
                        {lang === "ar"
                          ? "صورة مرفقة — اطلعي عليها في Telegram"
                          : "Image attached — view in Telegram"}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[var(--text-dim)]">—</p>
                )}
              </div>
            </details>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {t("issue.conversation", lang)}
              </h2>
            </CardHeader>
            <CardBody>
              {conversation.length === 0 && (
                <p className="text-[13px] text-[var(--text-dim)]">—</p>
              )}
              <div className="space-y-3">
                {conversation.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 text-[13px] border ${
                      m.direction === "INBOUND"
                        ? "bg-[var(--surface)] border-[var(--border)]"
                        : "bg-[var(--accent-xl)] border-[var(--accent-l)]"
                    }`}
                  >
                    <div className="num text-[11px] text-[var(--text-dim)] mb-1">
                      {m.direction === "INBOUND"
                        ? lang === "ar"
                          ? "من المستخدم"
                          : "Inbound"
                        : lang === "ar"
                          ? "من مكين"
                          : "Outbound"}{" "}
                      · {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                    <div className="whitespace-pre-wrap text-[var(--text)]">
                      {m.rawContent || m.extractedText || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {t("issue.notes", lang)}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {issue.notes.length === 0 && (
                <p className="text-[13px] text-[var(--text-dim)]">—</p>
              )}
              <ul className="space-y-3">
                {issue.notes.map((n) => (
                  <li key={n.id} className="text-[13px]">
                    <div className="num text-[11px] text-[var(--text-dim)]">
                      {n.author.fullName} ·{" "}
                      {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                    <div className="text-[var(--text)] whitespace-pre-wrap">
                      {n.content}
                    </div>
                  </li>
                ))}
              </ul>
              <AddNoteForm issueId={issue.id} lang={lang} />
            </CardBody>
          </Card>
        </div>

        {/* RIGHT */}
        <aside className="lg:sticky lg:top-6 self-start space-y-4">
          {/* Recommended Action */}
          <div className="bg-[var(--accent-xl)] border border-[var(--accent-l)] rounded-lg p-4 space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
              {t("issue.recommendedAction", lang)}
            </div>
            <p className="text-[14px] text-[var(--text)] leading-relaxed">
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

          {/* Penalty */}
          {issue.penaltyIfIgnored && (
            <div className="bg-[var(--red-l)] border border-[rgba(185,28,28,0.2)] rounded-lg p-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--red)] font-semibold mb-2">
                {t("issue.penalty", lang)}
              </div>
              <p className="text-[13px] text-[var(--red)]">{issue.penaltyIfIgnored}</p>
            </div>
          )}

          {/* Extracted Data */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {t("issue.extractedData", lang)}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3 text-[13px]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                  {t("issue.reference", lang)}
                </div>
                <div className="num text-[var(--text)]">
                  {issue.referenceNumber ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                  {t("issue.amount", lang)}
                </div>
                <div className="num text-[var(--text)]">
                  {issue.detectedAmountSar
                    ? `SAR ${Number(issue.detectedAmountSar).toLocaleString()}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                  {t("issue.deadline", lang)}
                </div>
                <div className="num text-[var(--text)]">
                  {formatDate(issue.detectedDeadline)}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
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

          {/* Full status form */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-[var(--text)]">
                {t("issue.status", lang)}
              </h2>
            </CardHeader>
            <CardBody>
              <StatusChangeForm issueId={issue.id} current={issue.status} lang={lang} />
            </CardBody>
          </Card>
        </aside>
      </div>
    </PageFrame>
  );
}
