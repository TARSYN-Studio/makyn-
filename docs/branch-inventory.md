# Branch inventory

_Snapshot: 2026-04-20. Base for comparison: `main` at `585e8fd`
(_App audit: brand DNA gap analysis_, 2026-04-19)._

Read-only reconnaissance. No branches were merged, deleted, renamed, or
rebased in producing this report.

## Summary

- **3** active branches (carrying unique work not in main and with a clear owner/purpose)
- **2** stale-active branches (carry unique patches but no clear continuation; dormant since 2026-04-17)
- **5** merged/obsolete branches (all commits or equivalent patches already in main)
- **0** tags
- **4** unreachable commits in the object store (all identified as pre-amend duplicates of already-merged work)
- **2** open PR refs on GitHub (`refs/pull/1/head`, `refs/pull/2/head`); no GitHub CLI auth available to read PR state/comments

### Totals by branch tip

| Section | Count |
|---|---|
| Active                     | 3 |
| Stale-active               | 2 |
| Merged / obsolete          | 5 (2 remote, 3 local-only) |
| Tags                       | 0 |
| Unreachable commits        | 4 |
| PR refs (no local branch)  | 0 (both PR refs are also branches) |

### Top 5 branches by unique-patch count

_"Unique patches" = count of `git cherry main <branch>` lines starting with `+`
(patch content not equivalent to anything currently on main)._

| Rank | Branch | Unique patches |
|---|---|---|
| 1 | `feature/v1.4-commit-b-invitations` | **18** |
| 2 | `claude/practical-noyce-d35e6a` | **14** (content thematically superseded by main's v1.3 finish commits) |
| 3 | `brand-dna-pass-1-cleanup` | **12** |
| 4 | `pull/2/head` (closed PR #2) | **11** (subset of #2 above; superseded) |
| 5 | `brand-dna-pass-1` | **6** (all 6 are ancestors of `brand-dna-pass-1-cleanup`) |

---

## 1. Active branches

### `feature/v1.4-commit-b-invitations`
Local + remote. Current tip: `8c049b1`. Ahead of main: **18**. Behind: 3 (the three commits on `main` that landed after the feature branch was cut). Most recent commit: **2026-04-18** by Mohammed. Subject: _"v1.4 Commit B fix: complete signup→accept handoff + idempotent-accept audit"._

**What it is:** The full team/invitations feature set — schema + migration for the `Invitation` model and `inviteDomainRestriction` org field, Microsoft Graph email transport with AR/EN templates, full invite lifecycle (POST/DELETE/accept), `/settings/team` members table + pending invitations table + invite form + domain-allowlist settings, a public invitation-accept landing page, per-org role-based permission hooks, and a signup→accept handoff.

**Commit list (chronological):**
```
b983676 v1.4 Commit B schema: Invitation + inviteDomainRestriction
939ec54 v1.4 Commit B email: Graph transport + AR/EN invitation templates
607cfb3 v1.4 Commit B permissions: invitation.revoke + invite_domain_restriction
888b3cd v1.4 Commit B invite lifecycle: POST/DELETE invitations, GET/POST accept
a2dcda1 v1.4 Commit B accept UI: public invitation landing page + form
b01d336 v1.4 Commit B team routes: GET members, GET invitations, PATCH role, DELETE member
f497173 v1.4 Commit B invitation settings: GET + PUT inviteDomainRestriction
8f43ed1 WIP: v1.4 Commit B item 5 — team.* i18n strings (AR + EN)
9d8c48b WIP: team i18n strings — revisions per review
e92c27f v1.4 Commit B Section 1: /settings/team members table + org "Team" link
3901400 v1.4 Commit B Section 2: pending invitations table
02bda21 v1.4 Commit B Section 3: invite new member form
4189fe1 v1.4 Commit B Section 4: invitation settings (domain allowlist)
0bebc00 v1.4 Commit B: cap invitation domain allowlist at 20 entries
53ad758 v1.4 Commit B item 6: role badge in org-scoped page headers
0f4ee5a v1.4 Commit B: DEV_EMAIL_OVERRIDE safety rail for shadow testing
387c860 v1.4 Commit B fix: drop duplicate "شركة" prefix in AR invitation template
8c049b1 v1.4 Commit B fix: complete signup→accept handoff + idempotent-accept audit
```

**Files changed vs main** (35 files):
```
.gitignore
apps/web/src/actions/auth.ts
apps/web/src/actions/team.ts
apps/web/src/app/(app)/organizations/[id]/page.tsx
apps/web/src/app/(app)/organizations/[id]/settings/team/invitation-settings-form.tsx
apps/web/src/app/(app)/organizations/[id]/settings/team/invitations-table.tsx
apps/web/src/app/(app)/organizations/[id]/settings/team/invite-form.tsx
apps/web/src/app/(app)/organizations/[id]/settings/team/members-table.tsx
apps/web/src/app/(app)/organizations/[id]/settings/team/page.tsx
apps/web/src/app/api/invitations/accept/[token]/route.ts
apps/web/src/app/api/organizations/[orgId]/invitations/[id]/route.ts
apps/web/src/app/api/organizations/[orgId]/invitations/route.ts
apps/web/src/app/api/organizations/[orgId]/members/[userId]/route.ts
apps/web/src/app/api/organizations/[orgId]/members/route.ts
apps/web/src/app/api/organizations/[orgId]/settings/invitations/route.ts
apps/web/src/app/invitations/accept/[token]/accept-form.tsx
apps/web/src/app/invitations/accept/[token]/page.tsx
apps/web/src/app/login/login-form.tsx
apps/web/src/app/login/page.tsx
apps/web/src/app/signup/page.tsx
apps/web/src/app/signup/signup-form.tsx
apps/web/src/components/ui/role-badge.tsx
apps/web/src/lib/audit.ts
apps/web/src/lib/email.ts
apps/web/src/lib/i18n.ts
apps/web/src/lib/permissions.ts
docs/app-audit.md
docs/knowledge/roadmap/in-flight.md
packages/core/email/email-service.ts
packages/core/email/index.ts
packages/core/email/invitation-tokens.ts
packages/core/email/microsoft-graph-email-service.ts
packages/core/email/templates/invitation-render.ts
packages/db/prisma/migrations/20260418100000_v14b_invitations/migration.sql
packages/db/prisma/schema.prisma
scripts/deploy.sh
```

**Summary:** Team / user-authorities / invitations feature, apparently complete (ships the 7-section Commit B spec end-to-end plus two follow-up fixes). Not yet merged to main.

### `brand-dna-pass-1-cleanup`
Local + remote. Current tip: `df65d4b`. Ahead: **12**. Behind: 0. Most recent commit: **2026-04-20** by Mohammed. Subject: _"Add reduced-motion regression protection (test or CSS comment)"._

**What it is:** Everything from `brand-dna-pass-1` plus six follow-up items (deterministic dates, orphan logo removal, locale-aware badge typography, Phosphor→Lucide, user-name-locale backlog doc, reduced-motion guard comment).

**Commit list (chronological):**
```
8224e91 Port brand tokens (paper, ink scale, signal) and desaturate status colors
80a03e7 Remove urgent-pulse motion; tame skeleton shimmer; audit app motion
2383cf1 Swap fonts to Inter + Tajawal; reserve Fraunces italic for specific moments
1b6a1be Rewrite copy in brand voice across i18n and hardcoded strings
3e2eee8 Replace logo with official brand SVGs; align favicon set
5a90157 Replace empty state illustrations with MK-01 mark + brand-voice copy
83ccb3e Deterministic date formatting for AR and EN locales
c25651e Remove orphan logo.png; references migrated to brand SVGs
9cfa0ee Locale-aware badge typography: EN uppercase tracked, AR semibold sentence-case
2d31e91 Swap Phosphor duotone icons for Lucide at 1.5 stroke weight
0fc1f55 Document user name locale handling as product-backlog item
df65d4b Add reduced-motion regression protection (test or CSS comment)
```

**Files changed vs main** (60 files — abbreviated):
```
apps/web/package.json
apps/web/public/favicon/* (7 files)
apps/web/public/logo.png (deleted)
apps/web/public/logos/makyn-{en,ar,en-onink,ar-onink}.svg
apps/web/src/app/(app)/**/*.tsx (11 files across channels/dashboard/organizations/settings)
apps/web/src/app/globals.css
apps/web/src/app/layout.tsx
apps/web/src/app/login/**, signup/**, onboarding/** — token+font+copy rewrites
apps/web/src/components/** — LogoMark, MobileNavDrawer, PageFrame, app-shell, brand/EmptyStateMark, illustrations/* (deleted), onboarding/** (9 files), ui/** (7 files)
apps/web/src/lib/i18n.ts
apps/web/tailwind.config.ts
docs/product-backlog.md
pnpm-lock.yaml
```

**Summary:** Brand-DNA alignment pass + cleanup — the tip of the brand work; supersedes `brand-dna-pass-1`.

### `brand-dna-pass-1`
Local + remote. Current tip: `5a90157`. Ahead: **6**. Behind: 0. Most recent commit: **2026-04-19** by Mohammed. Subject: _"Replace empty state illustrations with MK-01 mark + brand-voice copy"._

**What it is:** Ancestor of `brand-dna-pass-1-cleanup`; the first six brand-DNA commits (tokens, motion, fonts, copy, logos, empty states). All six commits are also on the cleanup branch verbatim.

**Commit list (chronological):** same as the first six on `brand-dna-pass-1-cleanup` above.

**Files changed vs main** (57 files) — identical to the cleanup branch minus `package.json`, `pnpm-lock.yaml`, `public/logo.png`, and `docs/product-backlog.md`.

**Summary:** First pass of brand-DNA alignment; retained as a stable checkpoint but fully subsumed by the cleanup branch.

---

## 2. Stale-active branches

Neither qualifies as stale under the 7-day rule (today − 7 = 2026-04-13,
both tips are 2026-04-17) — but both are **dormant** with no clear
owner and **do** carry unique patches. Flagging for inspection.

### `claude/practical-noyce-d35e6a`
Local only. Remote marked `[gone]` by `git fetch --prune` — i.e., the
remote branch was deleted at some point, but the local copy was
retained. Current tip: `141e52f`. Ahead of main: **15** (14 unique
patches + 1 whose patch content exists in main via a later rewrite).
Behind: 27.

Most recent commit: **2026-04-17** by Mohammed. Subject: _"feat(web v1.3): dashboard KPIs, PageFrame motion, empty-state illustrations"._

**Commit list (chronological):**
```
c6b69df feat(web v1.2): wire next/font and CSS-var design tokens
20f3f4a feat(web v1.2): rewrite tailwind config on CSS-var tokens
9bd124b feat(web v1.2): add LogoMark + Wordmark components
95104d7 feat(web v1.2): replace sidebar with 56px top-bar nav
b96ba7b feat(web v1.2): refresh UI primitives on Slate tokens
58763d3 feat(web v1.2): add /dashboard landing + redirect post-login there
7b280e1 feat(web v1.2): companies list — filters, search, sort, grid/list toggle
9d12626 feat(web v1.2): rework /companies/[id] with tabs, stats, timeline
e8db781 feat(web v1.2): issue detail two-column layout with quick actions
bdf82ac feat(web v1.2): migrate auxiliary pages to Slate tokens
f261cb3 feat(web v1.2): RTL audit — swap directional classes for logical equivalents
c12ac02 feat(web v1.3): swap LogoMark/Wordmark to image-based logo
0245d24 feat(web v1.3): Arabic typography — Readex Pro + 16.5/1.9 body
ea04a77 feat(web v1.3): primitives — 8px radii, Phosphor icons, pared hovers
141e52f feat(web v1.3): dashboard KPIs, PageFrame motion, empty-state illustrations  ← patch equivalent found in main
```

**Files changed vs main:** 68 files across `apps/bot`, `apps/web` (routes for `/companies/*` rather than `/organizations/*`), `packages/core`, `packages/db`, `docs/`.

**Summary:** The pre-rename v1.2 + v1.3 design-system pass (when the product still said "companies" not "organizations"). Main's commits `850575d` (real MAKYN logo), `2bfc422 feat(web v1.3): dashboard KPIs`, `8852b1f primitives`, `a250f23 Arabic typography`, `08d2393 swap LogoMark`, `6bb2cc8 finish Slate migration` thematically cover the same ground — the **ideas** from this branch are in main, but the specific patches are not, so `git cherry` reports 14 of 15 as `+`. Safe to delete if you're satisfied main carries the same design; keep if you want a historical reference. Do not delete reflexively — this is the branch most likely to hide a forgotten snippet.

### `pull/2/head` (GitHub PR #2 ref)
Remote-only (read-only under `refs/pull/2/head`). Current tip: `f261cb3`. Ahead of main: **11** (all unique patches). Behind: 27.

Most recent commit: **2026-04-17** by Mohammed. Subject: _"feat(web v1.2): RTL audit — swap directional classes for logical equivalents"._

**Commit list:** identical to the first 11 commits of `claude/practical-noyce-d35e6a` above (the v1.2 series, stopping at the RTL-audit commit; the subsequent four v1.3 commits are not part of this PR).

**Summary:** PR #2's head — the v1.2 design-system pass. Strict subset of `claude/practical-noyce-d35e6a`. GitHub CLI not authenticated so I can't read whether the PR was closed, abandoned, or is still open; the PR ref existing at all means a PR was opened at some point.

---

## 3. Merged / obsolete

For each: `git cherry main <ref>` returned only `-` lines (or the branch is
strictly an ancestor of main), meaning **every patch already applies to
main**. Safe to delete.

### `origin/claude/v1.4-commit-a`  _(remote only)_
Tip: `e982831`. Ahead: 5 **by commit hash** / 0 **by patch content**. Behind: 12.

Commit subjects match main commits `67d82b9` → `0f4eccb` exactly; `git cherry` reports all five as `-`. The branch is a pre-rebase twin of main's v1.4-Commit-A / v1.5-Commit-A sequence.

**Summary:** v1.4 Commit A + v1.5 Commit A, already in main via rebase. Safe to delete upstream.

### `claude/v1.4-commit-a`  _(local only)_
Tip: `0f4eccb`. Ahead: 0. Behind: 5. Strict ancestor of main.

**Summary:** Points at a mid-main commit. Stale local ref. Safe to delete.

### `claude/gallant-mendel-02fb88`  _(local only)_
Tip: `b683d12`. Ahead: 0. Behind: 12. Strict ancestor of main.

**Summary:** Points at main's `b683d12 docs: v1.3.1 extraction-rework spec review`. Scratch worktree branch. Safe to delete.

### `claude/tender-rosalind-c67826`  _(local only)_
Tip: `e28f0e2`. Ahead: 0. Behind: 3. Strict ancestor of main.

**Summary:** Points at main's `e28f0e2 docs(roadmap): planned.md …`. Scratch worktree branch. Safe to delete.

### `claude/funny-moore-4c6862`  _(local + remote, also `pull/1/head`)_
Tip: `4c40467`. Ahead: 0. Behind: 28.

**Summary:** The `4c40467 docs: update HANDOFF.md with v1.1 PR + deploy instructions` single commit; present in main's history. Attached to a now-irrelevant PR #1. Safe to delete both sides.

---

## 4. Tags

_None._ `git tag -l` returns empty. No release or checkpoint tags exist in the repo.

---

## 5. Additional checks

### `git log --all --oneline --graph -50` (top)

```
* df65d4b (HEAD -> docs/branch-inventory, brand-dna-pass-1-cleanup,
           origin/brand-dna-pass-1-cleanup) Add reduced-motion regression protection
* 0fc1f55 Document user name locale handling as product-backlog item
* 2d31e91 Swap Phosphor duotone icons for Lucide at 1.5 stroke weight
* 9cfa0ee Locale-aware badge typography
* c25651e Remove orphan logo.png; references migrated to brand SVGs
* 83ccb3e Deterministic date formatting for AR and EN locales
* 5a90157 (origin/brand-dna-pass-1, brand-dna-pass-1) Replace empty state illustrations
* 3e2eee8 Replace logo with official brand SVGs; align favicon set
* 1b6a1be Rewrite copy in brand voice across i18n and hardcoded strings
* 2383cf1 Swap fonts to Inter + Tajawal
* 80a03e7 Remove urgent-pulse motion; tame skeleton shimmer
* 8224e91 Port brand tokens (paper, ink scale, signal) and desaturate status colors
* 585e8fd (origin/main, origin/HEAD, main) App audit: brand DNA gap analysis
* fe47e6d docs(roadmap): in-flight.md — Commit B 5/7 checkpoint
* 1c8e902 deploy: bump Node heap to 2GB
| * 8c049b1 (origin/feature/v1.4-commit-b-invitations, feature/v1.4-commit-b-invitations) …signup→accept handoff
| * 387c860 v1.4 Commit B fix: drop duplicate "شركة" prefix
| * 0f4ee5a v1.4 Commit B: DEV_EMAIL_OVERRIDE safety rail
| * 53ad758 v1.4 Commit B item 6: role badge
| * 0bebc00 v1.4 Commit B: cap invitation domain allowlist at 20 entries
| * 4189fe1 v1.4 Commit B Section 4: invitation settings
| * 02bda21 v1.4 Commit B Section 3: invite new member form
| * 3901400 v1.4 Commit B Section 2: pending invitations table
| * e92c27f v1.4 Commit B Section 1: /settings/team members table
| * 9d8c48b WIP: team i18n strings — revisions per review
| * 8f43ed1 WIP: v1.4 Commit B item 5 — team.* i18n strings
| * f497173 v1.4 Commit B invitation settings: GET + PUT
| * b01d336 v1.4 Commit B team routes
| * a2dcda1 v1.4 Commit B accept UI
| * 888b3cd v1.4 Commit B invite lifecycle
| * 607cfb3 v1.4 Commit B permissions
| * 939ec54 v1.4 Commit B email: Graph transport
| * b983676 v1.4 Commit B schema: Invitation + inviteDomainRestriction
|/
* e28f0e2 (claude/tender-rosalind-c67826) docs(roadmap): planned.md
* 3490dbd docs(roadmap): shipped.md
* 0f4eccb (claude/v1.4-commit-a) v1.5 Commit A cleanup
* 309312d v1.5 fix schema @map
* 7517b58 v1.5 Commit A: app-layer rename + multi-user rewrites
* 5b09d31 v1.5 schema: Issue provenance + soft-delete
* 67d82b9 v1.4 Commit A WIP: schema + migration + permission/audit scaffolding
| * e982831 (origin/claude/v1.4-commit-a) v1.5 Commit A cleanup  ← duplicate of 0f4eccb above
| * a1af7b6 v1.5 fix schema @map
| * 13cd7b4 v1.5 Commit A: app-layer rename
| * 99489d9 v1.5 schema
| * 5792b2e v1.4 Commit A WIP
|/
* adc8d31 docs(knowledge): domain overview
* 13e3100 docs(knowledge): initial ADRs 0001-0013 + template
* b683d12 (claude/gallant-mendel-02fb88) docs: v1.3.1 extraction-rework spec review
* 6bb2cc8 refactor(web v1.3): finish Slate migration + sort auto-submit
…
```

Three visible forks from main: the brand-DNA lane (left, most recent),
the Commit-B-invitations lane (middle, early April 18), and the
rebased-away `origin/claude/v1.4-commit-a` twin (lower, duplicates
already in main).

### `git fsck --unreachable --no-reflogs`

**Four unreachable commits.** Each investigated; all four are pre-amend
duplicates of commits that landed on main or another active branch under
a different hash. No unique content found in any.

| Hash | Date | Author | Subject | Reachable equivalent |
|---|---|---|---|---|
| `7ed0e87` | 2026-04-18 | Mohammed | docs(roadmap): planned.md — Commit 2 (manual routing)… | `e28f0e2` on main (same subject) |
| `10b1df9` | 2026-04-18 | Mohammed | docs(roadmap): shipped.md — v1.4 Commit A live in prod | `3490dbd` on main |
| `9a55a32` | 2026-04-18 | Mohammed | v1.4 Commit B fix: drop duplicate "شركة" prefix in AR invitation template | `387c860` on `feature/v1.4-commit-b-invitations` |
| `502ad8a` | 2026-04-18 | Mohammed | docs(knowledge): initial ADRs 0001-0013 + template | `13e3100` on main |

No "meaningful lost work" among the unreachable objects. They will be
reaped on next `git gc` (default 2-week window). Safe to ignore.

### `git ls-remote origin`

```
585e8fd  HEAD
5a90157  refs/heads/brand-dna-pass-1
df65d4b  refs/heads/brand-dna-pass-1-cleanup
4c40467  refs/heads/claude/funny-moore-4c6862
e982831  refs/heads/claude/v1.4-commit-a
8c049b1  refs/heads/feature/v1.4-commit-b-invitations
585e8fd  refs/heads/main
4c40467  refs/pull/1/head
f261cb3  refs/pull/2/head
```

**Remote branches missing locally:** none — all six remote branches are tracked.

**Local branches with no remote:** four scratch branches, all `claude/*` (funny-moore is tracked; gallant-mendel, practical-noyce, tender-rosalind, v1.4-commit-a (local) have no upstream). All four point either at main ancestors or at a pre-rebase twin; none represent unpublished work.

**PR refs not matched to any local branch:** `refs/pull/2/head` (at `f261cb3`). The branch this PR was opened from has been deleted on GitHub (the tip `f261cb3` sits inside `claude/practical-noyce-d35e6a` locally — PR #2's work lives on exactly as a subset of that dormant branch). PR #1's ref (`4c40467`) matches `claude/funny-moore-4c6862` one-to-one.

### `gh pr list`

`gh` is installed but **not authenticated** (`gh auth login` not run). Could not read PR state, title, author, comments, or labels. The only PR visibility I have is the two `refs/pull/N/head` refs on origin, noted above.

Recommend: run `gh auth login` and rerun `gh pr list --state all --limit 50` to confirm PR #1 and PR #2 are closed, and to surface any PRs opened against branches already deleted.

---

## Answers to the five report-back questions

**1. Summary count.**
3 active · 2 stale-active · 5 merged/obsolete · 0 tags · 4 unreachable (all pre-amend duplicates).

**2. Top 5 by unique-patch count** _(patches that are not equivalent to anything on main)._
1. `feature/v1.4-commit-b-invitations` — 18
2. `claude/practical-noyce-d35e6a` — 14 (superseded by main's v1.3 rewrite)
3. `brand-dna-pass-1-cleanup` — 12
4. `pull/2/head` — 11 (subset of #2; superseded)
5. `brand-dna-pass-1` — 6 (subset of #3)

**3. Orphaned commits / unreachable objects.**
Four unreachable commits found (`7ed0e87`, `10b1df9`, `9a55a32`, `502ad8a`). Each cross-checked against reachable tips; all four are pre-amend duplicates of commits on main or on the Commit-B feature branch. **No meaningful lost work.**

**4. Name/content mismatches.**
- `claude/v1.4-commit-a` (both local and remote) is **misnamed** — it points at v1.4 Commit A **plus** the full v1.5 Commit A work (schema rename, multi-user rewrites, i18n revert). A reader opening a branch labelled "v1.4-commit-a" would expect only the v1.4 patches.
- `claude/funny-moore-4c6862`, `claude/gallant-mendel-02fb88`, `claude/practical-noyce-d35e6a`, `claude/tender-rosalind-c67826` are Claude Code scratch worktree branches whose names carry no intent signal at all; the content ranges from "major feature work" (practical-noyce) to "one-doc-update" (funny-moore). This is a naming-discipline issue, not a correctness issue, but note that `practical-noyce` in particular hides 15 commits of real design work behind an opaque label.

**5. Features built on a branch that's been deleted upstream.**
- `claude/practical-noyce-d35e6a` — the remote was deleted (`[gone]` marker). The v1.2 + v1.3 design-system pass lives on only in the local branch and in the `pull/2/head` ref. If this local clone is lost or `git gc`'d, the branch's 14 unique patches disappear entirely. Thematically covered by later rewrites on main, but the exact patches (including the pre-rename `/companies/*` route tree) exist nowhere else.
- `pull/2/head` — the source branch for PR #2 has been deleted on GitHub; the PR ref is the only remaining reference to those 11 commits upstream.

Neither represents active unmerged work, but both are "features that exist only because a local clone still has the branch checked out" — the one-laptop-dies-this-disappears category.
