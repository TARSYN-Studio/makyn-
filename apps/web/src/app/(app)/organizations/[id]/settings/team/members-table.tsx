"use client";

import { Fragment, useState, useTransition } from "react";

import { changeRoleAction, removeMemberAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { t, type Lang } from "@/lib/i18n";

type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type Member = {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  role: OrgRole;
  joinedAt: string;
};

type Props = {
  orgId: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: OrgRole;
  lang: Lang;
};

type RowAction =
  | { kind: "none" }
  | { kind: "changeRole"; userId: string; role: OrgRole }
  | { kind: "remove"; userId: string };

function RoleChip({ role, lang }: { role: OrgRole; lang: Lang }) {
  const label = t(`team.role.${role}`, lang);
  if (role === "OWNER") {
    return <span className="text-[13px] text-[var(--ink)]">{label}</span>;
  }
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

export function MembersTable({
  orgId,
  members,
  currentUserId,
  currentUserRole,
  lang
}: Props) {
  const [action, setAction] = useState<RowAction>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const canManage = currentUserRole === "OWNER";

  const clearAction = () => {
    setAction({ kind: "none" });
    setError(null);
  };

  const submitChangeRole = (userId: string, newRole: OrgRole) => {
    setError(null);
    start(async () => {
      const res = await changeRoleAction(orgId, userId, newRole);
      if (res.ok) clearAction();
      else setError(t("team.members.error", lang));
    });
  };

  const submitRemove = (userId: string) => {
    setError(null);
    start(async () => {
      const res = await removeMemberAction(orgId, userId);
      if (res.ok) clearAction();
      else setError(t("team.members.error", lang));
    });
  };

  const colSpan = canManage ? 5 : 4;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-[var(--ink)]">{t("team.members.title", lang)}</h2>
      </CardHeader>
      <CardBody className="p-0">
        {members.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <EmptyStateMark size={60} />
            <p className="text-[13px] text-[var(--ink-60)]">
              {t("team.members.empty", lang)}
            </p>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t("team.members.col.name", lang)}</Th>
                <Th>{t("team.members.col.email", lang)}</Th>
                <Th>{t("team.members.col.role", lang)}</Th>
                <Th>{t("team.members.col.joined", lang)}</Th>
                {canManage && (
                  <Th className="text-end">{t("team.members.col.actions", lang)}</Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const isOwner = m.role === "OWNER";
                const showActions = canManage && !isOwner;
                const rowActive =
                  (action.kind === "changeRole" || action.kind === "remove") &&
                  action.userId === m.userId;

                return (
                  <Fragment key={m.userId}>
                    <Tr>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--ink)]">{m.fullName}</span>
                          {isSelf && (
                            <Badge variant="neutral" className="text-[10px]">
                              {t("team.members.you", lang)}
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[var(--ink-40)]">{m.email}</span>
                      </Td>
                      <Td>
                        <RoleChip role={m.role} lang={lang} />
                      </Td>
                      <Td>
                        <span className="text-[var(--ink-40)] num">
                          {fmtDate(m.joinedAt)}
                        </span>
                      </Td>
                      {canManage && (
                        <Td className="text-end">
                          {showActions && !rowActive && (
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setAction({
                                    kind: "changeRole",
                                    userId: m.userId,
                                    role: m.role
                                  })
                                }
                              >
                                {t("team.members.action.changeRole", lang)}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[var(--state-overdue)]"
                                onClick={() =>
                                  setAction({ kind: "remove", userId: m.userId })
                                }
                              >
                                {t("team.members.action.remove", lang)}
                              </Button>
                            </div>
                          )}
                        </Td>
                      )}
                    </Tr>
                    {rowActive && action.kind === "changeRole" && (
                      <Tr>
                        <Td colSpan={colSpan} className="bg-[var(--paper-low)]">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="text-[13px] text-[var(--ink)]">
                              {t("team.members.changeRole.help", lang, {
                                name: m.fullName
                              })}
                            </div>
                            <select
                              value={action.role}
                              onChange={(e) =>
                                setAction({
                                  kind: "changeRole",
                                  userId: m.userId,
                                  role: e.target.value as OrgRole
                                })
                              }
                              className="h-9 rounded-lg border border-[var(--stone-light)] bg-[var(--paper-low)] text-[var(--ink)] px-3 text-[13px]"
                            >
                              <option value="ADMIN">
                                {t("team.role.ADMIN", lang)}
                              </option>
                              <option value="MEMBER">
                                {t("team.role.MEMBER", lang)}
                              </option>
                              <option value="VIEWER">
                                {t("team.role.VIEWER", lang)}
                              </option>
                            </select>
                            <div className="flex items-center gap-2 md:ms-auto">
                              <Button
                                size="sm"
                                disabled={isPending || action.role === m.role}
                                onClick={() =>
                                  submitChangeRole(m.userId, action.role)
                                }
                              >
                                {t("team.members.changeRole.submit", lang)}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={clearAction}
                              >
                                {t("common.cancel", lang)}
                              </Button>
                            </div>
                          </div>
                        </Td>
                      </Tr>
                    )}
                    {rowActive && action.kind === "remove" && (
                      <Tr>
                        <Td colSpan={colSpan} className="bg-[var(--paper-low)]">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="text-[13px]">
                              <div className="text-[var(--ink)]">
                                {t("team.members.remove.confirm", lang, {
                                  name: m.fullName
                                })}
                              </div>
                              <div className="text-[var(--ink-40)]">
                                {t("team.members.remove.help", lang)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:ms-auto">
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isPending}
                                onClick={() => submitRemove(m.userId)}
                              >
                                {t("team.members.remove.submit", lang)}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={clearAction}
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
