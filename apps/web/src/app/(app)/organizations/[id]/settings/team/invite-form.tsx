"use client";

import { useState, useTransition } from "react";

import { inviteMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";

type Role = "ADMIN" | "MEMBER" | "VIEWER";

type Status =
  | { kind: "idle" }
  | { kind: "success"; email: string }
  | { kind: "error"; message: string };

export function InviteForm({ orgId, lang }: { orgId: string; lang: Lang }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, start] = useTransition();

  const submit = () => {
    setStatus({ kind: "idle" });
    start(async () => {
      const res = await inviteMemberAction(orgId, email, role);
      if (res.ok) {
        setStatus({ kind: "success", email: res.email });
        setEmail("");
        setRole("MEMBER");
        return;
      }
      if (res.error === "domain_not_allowed") {
        setStatus({
          kind: "error",
          message: t("team.invite.error.domainNotAllowed", lang, {
            domains: res.allowed.join(", ")
          })
        });
        return;
      }
      if (res.error === "invalid_email") {
        setStatus({
          kind: "error",
          message: t("team.invite.error.invalidEmail", lang)
        });
        return;
      }
      if (res.error === "already_member") {
        setStatus({
          kind: "error",
          message: t("team.invite.error.alreadyMember", lang)
        });
        return;
      }
      setStatus({
        kind: "error",
        message: t("team.invite.error.generic", lang)
      });
    });
  };

  const errored = status.kind === "error";

  return (
    <Card className="mt-6">
      <CardHeader>
        <h2 className="font-semibold text-[var(--ink)]">
          {t("team.invite.title", lang)}
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div>
            <Label htmlFor="inviteEmail">{t("team.invite.email", lang)}</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              error={errored}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="inviteRole">{t("team.invite.role", lang)}</Label>
            <select
              id="inviteRole"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-10 w-full rounded-lg border border-[var(--stone-light)] bg-[var(--paper-low)] text-[var(--ink)] px-3 text-[13px]"
            >
              <option value="ADMIN">{t("team.role.ADMIN", lang)}</option>
              <option value="MEMBER">{t("team.role.MEMBER", lang)}</option>
              <option value="VIEWER">{t("team.role.VIEWER", lang)}</option>
            </select>
          </div>
          <Button onClick={submit} disabled={isPending || !email.trim()}>
            {t("team.invite.submit", lang)}
          </Button>
        </div>
        {status.kind === "success" && (
          <div className="mt-3 text-[12px] text-[var(--state-resolved)]">
            {t("team.invite.success", lang, { email: status.email })}
          </div>
        )}
        {status.kind === "error" && (
          <div className="mt-3 text-[12px] text-[var(--state-overdue)]">
            {status.message}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
