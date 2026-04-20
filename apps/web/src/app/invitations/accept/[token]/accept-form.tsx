"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  token: string;
  orgId: string;
  label: string;
  lang: "ar" | "en";
};

const ERROR_COPY: Record<"ar" | "en", Record<string, string>> = {
  ar: {
    expired: "انتهت صلاحية هذه الدعوة.",
    revoked: "تم إلغاء هذه الدعوة.",
    email_mismatch: "البريد الإلكتروني للحساب لا يطابق الدعوة.",
    invitation_not_found: "هذه الدعوة غير صالحة.",
    default: "تعذّر قبول الدعوة. حاول مجدداً بعد قليل."
  },
  en: {
    expired: "This invitation has expired.",
    revoked: "This invitation has been revoked.",
    email_mismatch: "Your account email does not match the invitation.",
    invitation_not_found: "This invitation is not valid.",
    default: "The invitation could not be accepted. Try again in a moment."
  }
};

export function AcceptInvitationForm({ token, orgId, label, lang }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/invitations/accept/${token}`, {
        method: "POST"
      });
      if (res.ok) {
        router.push(`/organizations/${orgId}`);
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      const key = typeof body?.error === "string" ? body.error : "default";
      setError(ERROR_COPY[lang][key] ?? ERROR_COPY[lang].default);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "…" : label}
      </Button>
      {error && (
        <p className="text-[13px] text-[var(--danger,#c0392b)] mt-3">{error}</p>
      )}
    </form>
  );
}
