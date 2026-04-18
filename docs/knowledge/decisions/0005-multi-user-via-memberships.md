# ADR-0005: Multi-user via Memberships table with role enum

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0004 (soft delete), ADR-0006 (Issue creator fields), v1.4 Commit A

## Context
MAKYN's v1.0 data model assumed single ownership: `Company.ownerId →
User.id`. A user could have many companies; a company had exactly
one user. This fails the target customer case: accounting firms and
law firms managing many client organizations, where multiple users
per firm need access to the same set of client records. Even a family
business has a partner who needs visibility. The single-owner model
must be replaced before any external launch.

## Options considered
- **Shared accounts:** tell firms to share login credentials. Rejected
  — breaks audit, breaks per-user permissions, violates common sense.
- **Team feature as a flag:** add `teamMembers` JSON column on
  Organization. Rejected — untyped, no roles, no invite flow, no
  audit possible.
- **Proper memberships table with roles:** `Membership(userId,
  organizationId, role)` as a join table with an OrgRole enum.
  Industry standard for B2B SaaS. Clean audit, clean permissions,
  clean invite semantics.

## Decision
Replace the single-owner model with Memberships. Create a `Membership`
table with `(userId, organizationId, role)` and an `OrgRole` enum
(`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`). Rename `Company` to
`Organization` at the Prisma model layer; keep the DB table named
`companies` via `@@map` to avoid a table rename migration. Every
query against organizations or their children must go through
`requireOrgAccess(userId, orgId, action)`.

Permission matrix:
- OWNER: everything, including delete org and transfer ownership
- ADMIN: invite, manage members (except OWNER), all data actions
- MEMBER: all data actions, no member management
- VIEWER: read-only

## Rationale
This is the single biggest architectural change in MAKYN and must
happen before any multi-user-dependent feature (bulk upload, bot
routing, audit logs scoped to orgs). Doing it early while the user
base is internal makes the migration trivial; doing it after
paying customers exist is a multi-month rewrite. Memberships as a
join table is the only shape that supports the accounting-firm
case correctly: one firm user, many client orgs, per-(user,org)
role.

## Consequences
- Every API route, server component, and query must route through
  `requireOrgAccess` instead of checking `Organization.ownerId`.
- Data migration creates one `OWNER` membership per existing
  (user, company) pair. No data loss.
- `listUserOrgIds(userId, { activeOrgId? })` becomes the canonical
  way to scope queries — accepts optional active-org filter so the
  v1.4.1 switcher is a one-line change.
- Invitations flow and `/settings/team` UI deferred to v1.4 Commit B
  (blocked on email provider).
- The `companies` table name in Postgres is kept via `@@map` to
  avoid a rename migration; may be renamed in a future release if
  anyone cares.

## When to revisit
- When designing the org-switcher UX in v1.4.1.
- When bulk upload lands in v1.5 — firm users will need OWNER on
  every bulk-created org; revisit if that changes.
- If we ever need per-organization custom roles beyond the four
  enum values (unlikely for v1.x).