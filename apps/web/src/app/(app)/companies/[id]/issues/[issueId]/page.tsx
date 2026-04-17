import Link from "next/link";
import { notFound } from "next/navigation";

import { IssueStatus, prisma } from "@makyn/db";
import { hoursUntil } from "@makyn/core";

import { StatusChangeForm } from "./status-form";
import { AssignHandlerForm } from "./assign-handler";
import { AddNoteForm } from "./add-note";
import { CopyHandlerBrief } from "./copy-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type PageProps = { params: { id: string; issueId: string } };

const urgencyBadge: Record<number, "neutral" | "yellow" | "red"> = {
  1: "neutral",
  2: "neutral",
  3: "yellow",
  4: "red",
  5: "red"
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

export default async function IssueDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

  const issue = await prisma.issue.findFirst({
    where: { id: params.issueId, ownerId: user.id, companyId: params.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { id: true, direction: true, contentType: true, rawContent: true, extractedText: true, createdAt: true }
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } }
      },
      company: { select: { id: true, legalNameAr: true } }
    }
  });

  if (!issue) notFound();

  return (
    <div className="max-w-6xl">
      <div className="mb-2">
        <Link href={`/companies/${issue.company.id}`} className="text-sm text-slate-500 hover:text-navy-500">
          ← {issue.company.legalNameAr}
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-800 leading-tight">{issue.titleAr}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={urgencyBadge[issue.urgencyLevel]}>U{issue.urgencyLevel}</Badge>
            <Badge variant="navy">{issue.governmentBody}</Badge>
            <Badge>{t(`issue.status.${issue.status}`, lang)}</Badge>
            {issue.detectedDeadline && (
              <span className="text-sm text-slate-600">
                {t("issue.deadline", lang)}: {deadlineLabel(issue.detectedDeadline, lang)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.classification", lang)}</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-slate-700 leading-relaxed">{issue.summaryAr}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.extractedData", lang)}</h2>
            </CardHeader>
            <CardBody className="text-sm text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">{t("issue.reference", lang)}</div>
                <div>{issue.referenceNumber ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{t("issue.amount", lang)}</div>
                <div>{issue.detectedAmountSar ? `SAR ${Number(issue.detectedAmountSar).toLocaleString()}` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{t("issue.deadline", lang)}</div>
                <div>{formatDate(issue.detectedDeadline)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Notice type</div>
                <div>{issue.noticeType ?? "—"}</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.originalNotice", lang)}</h2>
            </CardHeader>
            <CardBody>
              {issue.messages.length === 0 && <p className="text-sm text-slate-500">—</p>}
              <div className="space-y-4">
                {issue.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 text-sm border ${
                      m.direction === "INBOUND" ? "bg-slate-50 border-slate-200" : "bg-navy-50 border-navy-100"
                    }`}
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {m.direction === "INBOUND" ? (lang === "ar" ? "من المستخدم" : "Inbound") : (lang === "ar" ? "من مكين" : "Outbound")} ·{" "}
                      {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                    <div className="whitespace-pre-wrap text-slate-800">
                      {m.rawContent || m.extractedText || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.notes", lang)}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {issue.notes.length === 0 && <p className="text-sm text-slate-500">—</p>}
              <ul className="space-y-3">
                {issue.notes.map((n) => (
                  <li key={n.id} className="text-sm">
                    <div className="text-xs text-slate-500">
                      {n.author.fullName} · {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap">{n.content}</div>
                  </li>
                ))}
              </ul>
              <AddNoteForm issueId={issue.id} lang={lang} />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.recommendedAction", lang)}</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-800 leading-relaxed">{issue.recommendedAction}</p>
              {issue.recommendedHandler && (
                <Badge variant="gold">{t("issue.handler", lang)}: {issue.recommendedHandler}</Badge>
              )}
              {issue.whatToTellHandlerAr && (
                <CopyHandlerBrief text={issue.whatToTellHandlerAr} lang={lang} />
              )}
              <AssignHandlerForm issueId={issue.id} initial={issue.assignedHandlerName ?? ""} lang={lang} />
            </CardBody>
          </Card>

          {issue.penaltyIfIgnored && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <h3 className="font-semibold text-red-700">{t("issue.penalty", lang)}</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-red-700/90">{issue.penaltyIfIgnored}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-800">{t("issue.status", lang)}</h2>
            </CardHeader>
            <CardBody>
              <StatusChangeForm issueId={issue.id} current={issue.status} lang={lang} />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
