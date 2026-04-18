import type { OrgRole } from "@makyn/db";

/**
 * EmailService — transport-agnostic interface for outbound mail.
 *
 * Implemented by MicrosoftGraphEmailService for v1.4 (internal
 * dogfooding per ADR-0003). Swapping to Resend / SES later is a
 * one-file change: the interface stays, a new class implements it,
 * the DI site in apps/web switches the import.
 *
 * Every method is contract-level idempotent in the sense that the
 * CALLER decides whether it's safe to retry. The service itself may
 * retry inside (e.g. on 5xx) and throws on 4xx — see the
 * MicrosoftGraphEmailService implementation.
 */
export interface EmailService {
  sendInvitation(params: SendInvitationParams): Promise<void>;
}

export type SendInvitationParams = {
  to: string;
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: Exclude<OrgRole, "OWNER">;
  /** Absolute URL including the token. */
  acceptUrl: string;
  locale: "ar" | "en";
  expiresAt: Date;
};
