import { randomBytes } from "node:crypto";

/**
 * Opaque single-use invitation token. 32 bytes of randomness → 43
 * characters in URL-safe base64 (no padding), well within URL path
 * segment limits. Collisions at 2^256 entropy are not a real concern.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * 7 days from now — per v1.4 Commit B spec. Centralized so the expiry
 * window isn't duplicated across routes/tests.
 */
export function defaultInvitationExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
}
