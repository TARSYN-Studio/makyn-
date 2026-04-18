"use client";

import { useState, useTransition } from "react";

import { updateInvitationSettingsAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { t, type Lang } from "@/lib/i18n";

type Status =
  | { kind: "idle" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const MAX_DOMAINS = 20;

function isValidDomain(raw: string): boolean {
  return DOMAIN_RE.test(raw.trim().toLowerCase());
}

export function InvitationSettingsForm({
  orgId,
  initialDomains,
  lang
}: {
  orgId: string;
  initialDomains: string[];
  lang: Lang;
}) {
  const [restrict, setRestrict] = useState(initialDomains.length > 0);
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<"invalid" | "tooMany" | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, start] = useTransition();

  const atCap = domains.length >= MAX_DOMAINS;

  const addDomain = () => {
    if (domains.length >= MAX_DOMAINS) {
      setDraftError("tooMany");
      return;
    }
    const d = draft.trim().toLowerCase();
    if (!isValidDomain(d)) {
      setDraftError("invalid");
      return;
    }
    if (!domains.includes(d)) {
      setDomains([...domains, d]);
    }
    setDraft("");
    setDraftError(null);
  };

  const removeDomain = (d: string) => {
    setDomains(domains.filter((x) => x !== d));
  };

  const save = () => {
    setStatus({ kind: "idle" });
    const payload = restrict ? domains : [];
    start(async () => {
      const res = await updateInvitationSettingsAction(orgId, payload);
      if (res.ok) {
        setStatus({ kind: "saved" });
      } else {
        setStatus({
          kind: "error",
          message: t("team.settings.error", lang)
        });
      }
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <h2 className="font-semibold text-[var(--text)]">
          {t("team.settings.title", lang)}
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={restrict}
            onChange={(e) => setRestrict(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
          />
          <div>
            <div className="text-[14px] text-[var(--text)]">
              {t("team.settings.restrictToggle", lang)}
            </div>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5">
              {t("team.settings.restrictHelp", lang)}
            </div>
          </div>
        </label>

        {restrict && (
          <div className="space-y-3 border-s-2 border-[var(--border)] ps-4">
            {domains.length === 0 ? (
              <div className="text-[12px] text-[var(--text-dim)]">
                {t("team.settings.noDomains", lang)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-2 py-1 text-[12px] text-[var(--text)] num"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeDomain(d)}
                      className="ms-1 text-[var(--text-dim)] hover:text-[var(--red)]"
                      aria-label={t("team.settings.domain.remove", lang)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (draftError) setDraftError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDomain();
                    }
                  }}
                  placeholder={t("team.settings.domain.placeholder", lang)}
                  error={draftError !== null}
                  disabled={atCap}
                />
              </div>
              <Button
                variant="secondary"
                onClick={addDomain}
                disabled={!draft.trim() || atCap}
              >
                {t("team.settings.domain.add", lang)}
              </Button>
            </div>
            {draftError === "invalid" && (
              <div className="text-[12px] text-[var(--red)]">
                {t("team.settings.domain.invalid", lang)}
              </div>
            )}
            {(draftError === "tooMany" || atCap) && (
              <div className="text-[12px] text-[var(--red)]">
                {t("team.settings.domain.tooMany", lang)}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={isPending}>
            {t("team.settings.save", lang)}
          </Button>
          {status.kind === "saved" && (
            <span className="text-[12px] text-[var(--green)]">
              {t("team.settings.saved", lang)}
            </span>
          )}
          {status.kind === "error" && (
            <span className="text-[12px] text-[var(--red)]">
              {status.message}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
