import { MicrosoftGraphEmailService, type EmailService } from "@makyn/core/email";

let cached: EmailService | null = null;

/**
 * Lazy singleton for outbound mail. Constructor reads env at first
 * call — any route that touches it must run at request time, not at
 * build time. Swap this one line to replace the transport later.
 */
export function getEmailService(): EmailService {
  if (!cached) cached = new MicrosoftGraphEmailService();
  return cached;
}
