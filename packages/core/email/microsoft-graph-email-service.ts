import pino from "pino";

import { renderInvitationEmail } from "./templates/invitation-render";
import type { EmailService, SendInvitationParams } from "./email-service";

const logger = pino({ name: "email.graph" });

// Graph throttle per mailbox: 30/min, 10k/day. v1.4 Commit B ships
// for internal dogfooding so volume stays low — ADR-0003 commits us
// to revisit when external customers arrive. These constants are
// informational, not enforced client-side (Graph itself rejects with
// 429 once hit).

type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
};

/**
 * MicrosoftGraphEmailService
 *
 * Transport for outbound invitations during the internal-dogfooding
 * phase (ADR-0003). Uses client-credentials OAuth flow, caches the
 * access token in memory, refreshes 5 minutes before expiry.
 *
 * Never logs the client secret, the access token, or recipient PII
 * beyond org context.
 */
export class MicrosoftGraphEmailService implements EmailService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;
  private readonly senderUpn: string;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(env?: NodeJS.ProcessEnv) {
    const e = env ?? process.env;
    const required = ["GRAPH_CLIENT_ID", "GRAPH_CLIENT_SECRET", "GRAPH_TENANT_ID", "GRAPH_SENDER_UPN"] as const;
    for (const key of required) {
      if (!e[key]) {
        throw new Error(`[email.graph] missing required env: ${key}`);
      }
    }
    this.clientId = e.GRAPH_CLIENT_ID!;
    this.clientSecret = e.GRAPH_CLIENT_SECRET!;
    this.tenantId = e.GRAPH_TENANT_ID!;
    this.senderUpn = e.GRAPH_SENDER_UPN!;
  }

  async sendInvitation(params: SendInvitationParams): Promise<void> {
    const rendered = renderInvitationEmail(params);
    const token = await this.getAccessToken();

    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.senderUpn)}/sendMail`;
    const body = {
      message: {
        subject: rendered.subject,
        body: { contentType: "HTML", content: rendered.html },
        toRecipients: [{ emailAddress: { address: params.to } }],
        from: { emailAddress: { address: this.senderUpn, name: "MAKYN" } },
        replyTo: [{ emailAddress: { address: params.inviterEmail, name: params.inviterName } }]
      },
      saveToSentItems: true
    };

    // Retry once on 5xx with 2s backoff per spec. 4xx is a caller
    // problem (bad token scope, malformed request) and fails fast.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok || res.status === 202) {
        logger.info(
          { organizationName: params.organizationName, locale: params.locale, role: params.role },
          "invitation_sent"
        );
        return;
      }

      const errorText = await res.text().catch(() => "");
      const is5xx = res.status >= 500;

      if (is5xx && attempt === 0) {
        logger.warn({ status: res.status, attempt }, "graph_send_5xx_retrying");
        await sleep(2000);
        continue;
      }

      logger.error(
        { status: res.status, error: truncate(errorText, 400), organizationName: params.organizationName },
        "invitation_send_failed"
      );
      throw new Error(`Graph sendMail failed: ${res.status}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.token;
    }

    const url = `https://login.microsoftonline.com/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: "https://graph.microsoft.com/.default"
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      // Do NOT log client secret or tenant id in error payloads.
      logger.error({ status: res.status, error: truncate(errorText, 200) }, "graph_token_failed");
      throw new Error(`Graph token acquisition failed: ${res.status}`);
    }

    const json = (await res.json()) as AccessTokenResponse;
    // Refresh 5 minutes before the server-declared expiry.
    const expiresAt = now + json.expires_in * 1000 - 5 * 60 * 1000;
    this.cachedToken = { token: json.access_token, expiresAt };
    return json.access_token;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
