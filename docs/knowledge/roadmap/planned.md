# Planned Releases

Work committed to in scope but not yet started or in flight.

## v1.4 Commit 2 — manual routing queue + bot UX fixes

Deferred from v1.4 Commit A. Covers the cases where the matcher can't cleanly resolve an inbound message to an organization.

**Matcher outcomes today:**
1. Message has identifier + matches a registered org → routes correctly, creates Issue.
2. Message has identifier but doesn't match any registered org → returns generic "error occurred" (bad UX).
3. Message has no identifier at all → returns bland acknowledgment, no Issue created.

**Target behavior:**

For case 2 (identifier present, no matching org): create Issue with `needsManualRouting=true`, `organizationId=null`, `matchedByIdentifier=<the-identifier>`. Reply to the sender with something honest and actionable:

"لم نعثر على شركة مسجلة في مكين تحمل هذا الرقم ({identifier}). هل هذه شركة جديدة تريد إضافتها؟ افتح لوحة التحكم: https://app.makyn.site/organizations/new — أو تجاهل الرسالة إذا أُرسلت بالخطأ."

For case 3 (no identifier): create Issue with `needsManualRouting=true`, `organizationId=null`. Reply:

"استلمنا رسالتك لكن لم نجد رقم مرجعي (رقم سجل تجاري أو رقم ضريبي أو رقم موحد) لنحدد الشركة المقصودة. إذا أعدت إرسال الإشعار مع صورة كاملة نستطيع توجيهها للشركة الصحيحة تلقائياً."

Both cases surface in dashboard under a "Needs routing" queue, where user can: assign to existing org, create new org from this message, or discard.

**Additional backlog items from v1.4 deploy verification:**

- `handleStartCommand` UX: currently returns "please register" prompt regardless of caller's connection status. Should detect already-connected users and return "✅ Already connected as {handle}, active orgs: {list}" instead. The /start command in Telegram is the deep-link target for connection flow, not a status check — but many users intuitively press it to check status, and the UX should accommodate that reality.

- Soft-deleted org admin access path: admins should have a separate code path to access soft-deleted orgs for audit/restore purposes. `requireOrgAccess` currently rejects soft-deleted orgs universally. Flagged in v1.4 Commit A review, deferred.

## v1.4 Commit B — invitations + team management

Magic-link invitation flow via Microsoft Graph (internal dogfooding phase — see ADR-0003). Prerequisites: register Entra ID app with Mail.Send application permission, client credentials flow, env vars (GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_TENANT_ID, GRAPH_SENDER_UPN). Abstracted behind EmailService interface so future swap to Resend/SES is one file.

UI: /settings/team page listing members with roles, pending invites, remove/change-role actions. Role badge in header when viewing an org the user doesn't own.

Full permission matrix enforced per ADR-0005 (owner/admin/member/viewer).

## v1.4.1 — active-org switcher

Hook ready via `listUserOrgIds(userId, {activeOrgId?})`. UI not wired. GitHub-style dropdown in header with recent-org pinning.

Blocker before v1.5 bulk upload is usable. Accounting firms managing 50 client orgs cannot live in an aggregate dashboard.

## v1.5 Phase A — extraction schema foundation

Pure schema and TypeScript, no external API calls. Lands in parallel with Commit B.

- Organization.unifiedNumber, nationalNumber indexed columns (crNumber already present)
- ExtractionAudit table (separate from AuditLog per ADR-0013)
- DocumentType enum: 28→7 rename (archive 21 dropped types to company_document_archive_<date> first)
- Zod schemas + TS types per docType
- Validators (isValidUnifiedNumber, isValidZatcaTin, isValidGosiNumber, etc.)
- Merge layer with per-field authority hierarchy (ADR-0009)
- Bulk upload tables: BulkUpload, ProposedCluster, ExtractionResult, OrganizationRelationship
- Organization.source enum (user_created | inferred_from_partner_list | imported_from_bulk)
- UI: 7-type radio at upload, manual-entry fallback always visible, retry-with-different-type

## v1.5 Phase B — vision extraction + clustering

After Phase A is merged. Requires Vertex AI enabled on existing GCP project and `roles/aiplatform.user` on service account.

- Gemini 2.5 Pro classifier + per-type extractor prompts (Flash fallback on Zod failure)
- QR decode in parallel via OpenCV (local only, token for dedup, never fetch government URLs)
- Identifier graph + union-find clustering
- Fuzzy Arabic name pass for orphans (threshold 0.92, conservative guard against identifier conflict)
- Cross-cluster relationship detection (AoA partner lists → parent/subsidiary edges)
- Stub organization support for corporate partners whose docs weren't uploaded
- Supersession within clusters (older NA/VAT flagged superseded)
- Review UI: split/merge/reassign/confirm-stub/discard operations
- Atomic commit of confirmed BulkUpload

Regression fixtures captured: Netaj Holding CR (must extract unified_number 7023947554, cr_number 2051236256, date 1442/11/27), Netaj Holding VAT (TIN 3109739918 and VAT 310973991800003 must be distinct values, current pipeline confuses with barcode 100221051634623).
