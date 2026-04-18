# Shipped Releases

Chronological record of what has actually gone to production. Latest first.

## v1.4 Commit A — shipped 2026-04-18

Multi-user foundation. Single biggest architectural change in MAKYN to date.

**Schema and data model:**
- Company → Organization rename (app-layer only, DB table `companies` preserved via Prisma `@@map`)
- Memberships table + OrgRole enum (OWNER / ADMIN / MEMBER / VIEWER)
- Polymorphic AuditLog table + writeAudit helper (Tier 2 scope: sensitive actions + data writes, no reads)
- Issue tri-field creator semantics: detectedBy enum, createdByUserId nullable, assignedToUserId nullable
- Six cross-org trace columns on Issue: sourceChannel, sourceUserId, matchedByIdentifier, matchedToOrganizationId, matchConfidence, needsManualRouting
- Organization soft-delete: deletedAt, deletedByUserId
- Old flat AuditLog renamed to AiEventLog (preserves AI pipeline logs)

**App layer:**
- requireOrgAccess middleware on every route and server component data fetch
- listUserOrgIds(userId, { activeOrgId? }) scoping helper — switcher-ready
- Route folder rename: /companies to /organizations (301 redirect for one release cycle)
- API folder rename: /api/companies to /api/organizations (301 redirect)
- EN strings updated: "Company" to "Organization"
- AR strings kept as الشركة per ADR-0010

**Data migration:**
- One OWNER Membership created per existing (user, company) pair
- companies.ownerId column dropped after backfill verified
- No data loss

**Deployment details:**
- Prod HEAD: 0f4eccb
- Shadow DB retained: makyn_shadow
- Rollback snapshot: /opt/makyn/backups/makyn-snapshot-20260418-040112.dump
- Snapshot delete date: after 2026-04-21 if prod stable

**Referenced ADRs:** 0004 (soft delete), 0005 (multi-user), 0006 (Issue tri-field), 0010 (Arabic terminology), 0013 (audit table separation)

**Environment fixes rolled in during deploy:**
- UPLOADS_ROOT env variable added for portability (prod path preserved as default)
- Per-app .env symlinks for monorepo dev environments
- Connection pool limit of 5 for Prisma dev server

## v1.3 — shipped 2026-04 (earlier)

Visual uplift.

- MAKYN logo (wordmark with navy dot accent)
- Readex Pro Arabic font
- Phosphor icons (regular weight, duotone for stat cards)
- Semantic KPI colors (navy / amber / red / green by metric type)
- Display serif extended to stat numbers with tabular-nums
- 8px radii, restrained motion, designed non-UI element per page

## v1.0 — v1.2

Initial MAKYN foundation. Single-user ownership model. OCR + OpenAI extraction pipeline. Telegram channel integration. Three organizations onboarded (شركة نتاج الصناعية / شركة نتاج القابضة / شركة نتاج الصناعية القابضة). First real issue processed.

Predecessor to the multi-user migration (v1.4) and the extraction rework (v1.5).
