# In-Flight Work

## v1.4 Commit B — invitations + team management

**Branch:** `feature/v1.4-commit-b-invitations`
**Current HEAD:** `a2dcda1` (5 commits ahead of main)

**Landed:**
- `b983676` — Invitation schema + Organization.inviteDomainRestriction + indexes + CHECK role≠OWNER
- `939ec54` — Microsoft Graph email transport + AR/EN templates (RTL for AR)
- `607cfb3` — Permissions helper expansion (invitation.revoke + invite_domain_restriction)
- `888b3cd` — Invite lifecycle API (POST/DELETE invitations, POST accept) + audit.ts + email.ts singleton
- `a2dcda1` — Accept UI (public landing page + accept form, bilingual)

**Remaining punch list:**
3. Team routes (GET members, GET invitations, PATCH role, DELETE member)
4. Invitation settings routes (GET + PUT domain restriction)
5. `/settings/team` page — 4 sections (members, pending, invite form, settings)
6. Role badge in header + i18n strings (AR + EN)
7. Shadow DB dogfood → prod snapshot → deploy → shipped.md append

**Spec corrections applied during implementation:**
- Route prefix is `/api/organizations/[orgId]/invitations/` (spec said `/api/orgs/` — inconsistent with rest of codebase, corrected)
- Domain restriction returns `403` not `422` (consistency with rest of permission surface)

**Verified:**
- Typecheck clean across all 5 workspace packages (2026-04-18)
- Four non-negotiable callouts from spec all satisfied: case-insensitive email match, idempotent accept, no token in POST response, 410 Gone on expired token

**Estimated remaining:** ~6-9 hours of agent work across 2 sessions.
