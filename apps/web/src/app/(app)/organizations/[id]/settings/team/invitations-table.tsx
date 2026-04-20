"use client";

import { Fragment, useState, useTransition } from "react";

import { revokeInvitationAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { t, type Lang } from "@/lib/i18n";

type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type PendingInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
};

type Props = {
  orgId: string;
  invitations: PendingInvitation[];
  lang: Lang;
};

function RoleChip({ role, lang }: { role: OrgRole; lang: Lang }) {
  const label = t(`team.role.${role}`, lang);
  if (role === "ADMIN") return <Badge variant="navy">{label}</Badge>;
  if (role === "MEMBER") return <Badge variant="neutral">{label}</Badge>;
  return (
    <Badge className="bg-transparent border border-[var(--stone-light)] text-[var(--ink-40)]">
      {label}
    </Badge>
  );
}

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export function InvitationsTable({ orgId, invitations, lang }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const clear = () => {
    setConfirmId(null);
    setError(null);
  };

  const submitRevoke = (invitationId: string) => {
    setError(null);
    start(async () => {
      const res = await revokeInvitationAction(orgId, invitationId);
      if (res.ok) clear();
      else setError(t("team.invites.error", lang));
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <h2 className="font-semibold text-[var(--ink)]">
          {t("team.invites.title", lang)}
        </h2>
      </CardHeader>
      <CardBody className="p-0">
        {invitations.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <EmptyStateMark size={60} />
            <p className="text-[13px] text-[var(--ink-60)]">
              {t("team.invites.empty", lang)}
            </p>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t("team.invites.col.email", lang)}</Th>
                <Th>{t("team.invites.col.role", lang)}</Th>
                <Th>{t("team.invites.col.invitedBy", lang)}</Th>
                <Th>{t("team.invites.col.sent", lang)}</Th>
                <Th>{t("team.invites.col.expires", lang)}</Th>
                <Th className="text-end">
                  {t("team.invites.col.actions", lang)}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {invitations.map((inv) => {
                const rowActive = confirmId === inv.id;
                return (
                  <Fragment key={inv.id}>
                    <Tr>
                      <Td>
                        <span className="text-[var(--ink)]">{inv.email}</span>
                      </Td>
                      <Td>
                        <RoleChip role={inv.role} lang={lang} />
                      </Td>
                      <Td>
                        <span className="text-[var(--ink-40)]">
                          {inv.invitedBy}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[var(--ink-40)] num">
                          {fmtDate(inv.createdAt)}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[var(--ink-40)] num">
                          {fmtDate(inv.expiresAt)}
                        </span>
                      </Td>
                      <Td className="text-end">
                        {!rowActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[var(--state-overdue)]"
                            onClick={() => setConfirmId(inv.id)}
                          >
                            {t("team.invites.action.revoke", lang)}
                          </Button>
                        )}
                      </Td>
                    </Tr>
                    {rowActive && (
                      <Tr>
                        <Td colSpan={6} className="bg-[var(--paper-low)]">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="text-[13px] text-[var(--ink)]">
                              {t("team.invites.revoke.confirm", lang, {
                                email: inv.email
                              })}
                            </div>
                            <div className="flex items-center gap-2 md:ms-auto">
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isPending}
                                onClick={() => submitRevoke(inv.id)}
                              >
                                {t("team.invites.revoke.submit", lang)}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={clear}
                              >
                                {t("common.cancel", lang)}
                              </Button>
                            </div>
                          </div>
                        </Td>
                      </Tr>
                    )}
                  </Fragment>
                );
              })}
            </Tbody>
          </Table>
        )}
      </CardBody>
      {error && (
        <div className="px-5 py-3 text-[12px] text-[var(--state-overdue)] border-t border-[var(--stone-light)]">
          {error}
        </div>
      )}
    </Card>
  );
}
