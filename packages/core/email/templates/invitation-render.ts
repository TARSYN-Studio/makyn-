import type { SendInvitationParams } from "../email-service";

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/**
 * Invitation email renderer.
 *
 * Per ADR-0010: Arabic uses "الشركة" (not المنظمة / مؤسسة) for
 * Organization. English uses "organization". Roles use the Arabic
 * vocabulary from the spec i18n table.
 *
 * HTML is inlined (no external CSS) so Gmail/Outlook/Apple Mail
 * render it consistently. Arabic variant is RTL with the
 * corresponding dir attribute. Plain-text fallback is required by
 * most clients and required by us for accessibility.
 */
export function renderInvitationEmail(params: SendInvitationParams): RenderedEmail {
  return params.locale === "ar" ? renderArabic(params) : renderEnglish(params);
}

const ROLE_LABELS_AR: Record<Exclude<SendInvitationParams["role"], "OWNER">, string> = {
  ADMIN: "مشرف",
  MEMBER: "عضو",
  VIEWER: "مشاهد"
};

const ROLE_LABELS_EN: Record<Exclude<SendInvitationParams["role"], "OWNER">, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer"
};

function formatDateAr(d: Date): string {
  // Intl is available in Node 20+, uses ICU. Arabic full date,
  // Gregorian calendar (not Hijri — Hijri dates in email confuse
  // external inviters who calendar in Gregorian).
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

function formatDateEn(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

function renderArabic(p: SendInvitationParams): RenderedEmail {
  const roleLabel = ROLE_LABELS_AR[p.role];
  const expiresLabel = formatDateAr(p.expiresAt);
  const inviterName = escapeHtml(p.inviterName);
  const orgName = escapeHtml(p.organizationName);
  const acceptUrl = p.acceptUrl;

  const subject = `تمت دعوتك للانضمام إلى ${p.organizationName} على مكين`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,'Segoe UI',Tahoma,'Arabic UI Text',sans-serif;color:#1A1A14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E4DC;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#1E3A8A;">مكين</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px 32px;font-size:17px;line-height:1.9;">
              <p style="margin:0 0 16px 0;">أهلاً،</p>
              <p style="margin:0 0 16px 0;">
                دعاك <strong>${inviterName}</strong> للانضمام إلى شركة
                <strong>${orgName}</strong> على منصة مكين بصلاحية
                <strong>${roleLabel}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 24px 32px;">
              <a href="${acceptUrl}" style="display:inline-block;background:#1E3A8A;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
                قبول الدعوة
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;font-size:13px;line-height:1.7;color:#4A4A3C;">
              <p style="margin:0 0 8px 0;">
                إذا لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:
              </p>
              <p style="margin:0 0 16px 0;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#1E3A8A;">${escapeHtml(acceptUrl)}</a>
              </p>
              <p style="margin:0;color:#9A9A88;">
                تنتهي صلاحية هذه الدعوة في ${expiresLabel}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #E5E4DC;font-size:12px;color:#9A9A88;text-align:center;">
              مكين — مركز عمليات الامتثال السعودي
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `أهلاً،`,
    ``,
    `دعاك ${p.inviterName} للانضمام إلى شركة ${p.organizationName} على منصة مكين بصلاحية ${roleLabel}.`,
    ``,
    `لقبول الدعوة افتح الرابط التالي:`,
    acceptUrl,
    ``,
    `تنتهي صلاحية الدعوة في ${expiresLabel}.`,
    ``,
    `مكين — مركز عمليات الامتثال السعودي`
  ].join("\n");

  return { subject, html, text };
}

function renderEnglish(p: SendInvitationParams): RenderedEmail {
  const roleLabel = ROLE_LABELS_EN[p.role];
  const expiresLabel = formatDateEn(p.expiresAt);
  const inviterName = escapeHtml(p.inviterName);
  const orgName = escapeHtml(p.organizationName);
  const acceptUrl = p.acceptUrl;

  const subject = `You're invited to join ${p.organizationName} on MAKYN`;

  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1A14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E4DC;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#1E3A8A;">MAKYN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px 32px;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 16px 0;">Hi,</p>
              <p style="margin:0 0 16px 0;">
                <strong>${inviterName}</strong> has invited you to join
                <strong>${orgName}</strong> on MAKYN as a <strong>${roleLabel}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 24px 32px;">
              <a href="${acceptUrl}" style="display:inline-block;background:#1E3A8A;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                Accept invitation
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;font-size:13px;line-height:1.55;color:#4A4A3C;">
              <p style="margin:0 0 8px 0;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin:0 0 16px 0;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#1E3A8A;">${escapeHtml(acceptUrl)}</a>
              </p>
              <p style="margin:0;color:#9A9A88;">This invitation expires on ${expiresLabel}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #E5E4DC;font-size:12px;color:#9A9A88;text-align:center;">
              MAKYN — Saudi compliance command center
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi,`,
    ``,
    `${p.inviterName} has invited you to join ${p.organizationName} on MAKYN as a ${roleLabel}.`,
    ``,
    `Accept the invitation at:`,
    acceptUrl,
    ``,
    `This invitation expires on ${expiresLabel}.`,
    ``,
    `MAKYN — Saudi compliance command center`
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
