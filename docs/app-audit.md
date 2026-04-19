# app.makyn.site — Brand DNA Audit

_Generated 2026-04-19. Read against makyn.site v2 brand DNA
(`/Users/mz/makyn-website`, tailwind.config.ts, app/globals.css,
components/ui/*, components/brand/*, messages/*.json, ADR-0010)._

## Summary

The app and the site are running on two different visual languages. The
accent colour (`#1E3A8A`) is the only brand token that survived the fork
— everything else (canvas, ink, type, motion, density, iconography)
reads as a generic cream-tinted SaaS dashboard rather than an
institutional compliance instrument. The single highest-impact gap is
the **typographic system**: the app loads Instrument Serif + Readex Pro
instead of Fraunces + Tajawal, sets a 14 px SaaS body, and uses fixed
heading sizes instead of the site's clamped editorial scale — flipping
any page makes the disconnect obvious before the eye reaches the copy.
The lowest-effort fix with visible return is swapping the canvas
tokens: replace `--bg / --surface / --card / --text` with the site's
`--paper / --paper-light / --paper-deep / --ink` (plus the `--ink-80/60/40/20`
scale), re-map `--accent` → `--signal`, and remove `--teal` / `--gold`
aliases. That alone brings the app into the same colour universe without
touching a single component file.

## 1. Color palette

### What matches
- `--accent: #1E3A8A` is identical to site `--signal: #1E3A8A`. Correct hue, wrong token name.
- `--red`, `--green`, `--amber` exist in both systems as functional-only status colours.
- Status tint pattern (`*_l` backgrounds + solid foreground) mirrors the site's `signal-tint` concept.

### What diverges

| Current value (app) | Should be (site brand) | Severity |
|---|---|---|
| `--bg: #F5F5F0` (warm off-white) | `--paper: #F2EEE6` + gradient `paper-light → paper` + fractalNoise grain | **High** — canvas is the first 60 % of the visual identity; a flat non-grain slate reads as "software" |
| `--surface: #FAFAF7`, `--card: #FFFFFF` | `--paper-light: #F7F4EE`, `--paper-deep: #E8E3D7` (no pure white in brand) | **High** — white cards punch holes in the cream continuum |
| `--text: #1A1A14` (warm near-black) | `--ink: #0E1628` (deep navy) | **High** — the ink/navy is load-bearing; warm black reads newspaper, not institutional |
| `--text-mid: #4A4A3C`, `--text-dim: #9A9A88` | `--ink-80: #2A3349`, `--ink-60: #4E5568`, `--ink-40: #8B91A0`, `--ink-20: #C4C7CF` | **High** — 3-stop warm scale vs 5-stop cool scale; no 1:1 mapping |
| `--border: #E5E4DC`, `--border-s: #CECCC0` | `--stone: #C9C2B3`, `--stone-light: #DDD8CC` | Med — close in tone, different names/values, no layering rationale |
| `--accent-mid: #2D52B8` (lighter hover) | `--signal-deep: #152C6B` (darker hover) | Med — app brightens on hover, site deepens. Opposite gesture. |
| `--accent-l: #EEF2FF`, `--accent-xl: #F5F7FF` | `--signal-tint: #E8ECF5` (single tint) | Low — two tints where brand has one, both cooler than site's warmer tint |
| `--red: #B91C1C`, `--green: #065F46`, `--amber: #92400E` | `--error: #8B2635`, `--success: #1F6F43`, `--alert: #B8860B` | Med — app uses Tailwind-default semantics (brighter, more saturated); brand uses muted/archival values |
| `--teal: #0E7490`, `--teal-l: #F0FDFA` | _(no equivalent on site)_ | **High** — saturated teal violates the "signal is the only saturated colour" rule |
| `bg-[var(--accent)] text-white` avatar circle | _(no avatar pattern on site)_ — would be paper on ink, or ink-60 initials | Med |
| `rgba(0,0,0,0.3)` drawer scrim | brand would use ink-based rgba | Low |
| `shadow-card: rgba(26,26,20,...)`, `shadow-modal: rgba(26,26,20,...)` | brand shadows use `rgba(14, 22, 40, ...)` (ink-based) | Med — wrong undertone |
| No paper-grain overlay (body::before SVG noise) | fractalNoise SVG at 2.5 % opacity, multiply blend | Med — removes the "archival" tactile layer entirely |

**Ambiguous / flag for review:** the three status-l tints are close enough to the brand's muted palette that they _may_ be intentional derivatives; the `--teal` pair is the clearest violation and almost certainly an ad-hoc addition.

## 2. Typography

### What matches
- Inter as Latin body font — correct primary.
- JetBrains Mono for tabular numerals is acceptable; brand uses `ui-monospace` stack but either is in keeping with the institutional reading.
- `html[lang="ar"]` bumps base size and line-height — the _direction_ is right; the numbers differ from the site.

### What diverges

| Current (app) | Should be (site brand) | Severity |
|---|---|---|
| Display font: **Instrument Serif** (400 + italic) | **Fraunces** (500, italic axis reserved for narrative passages) | **High** — Instrument Serif is a different voice (contemporary editorial) from Fraunces (institutional) |
| Arabic font: **Readex Pro** (300/400/500/600/700) | **Tajawal** (400/500/700/800) | **High** — different letterform personality; brand explicitly chose Tajawal for its "STC/GOSI geometric look" |
| Body base: 14 px EN, 16.5 px AR | 16 px EN base (site never sets a global 14px body — it's set on individual elements where tight reading is required) | **High** — 14 px is SaaS density, not editorial |
| Headings: fixed sizes (`text-[32px]`, `text-[20px]`, `text-[40px]`) | `Heading` component with `clamp(2.5rem, 6vw, 5.5rem)` fluid scale, 4 levels (H1–H4) with distinct leading/tracking per script | **High** — no fluid scale, no shared component, no script-aware treatment |
| Headings use `.font-display-en` in inline styles on pages | `<Heading level locale italic>` component encapsulates all per-script tokens | Med — encapsulation missing; heading typography re-implemented at every call site |
| Italic not reserved — `Instrument_Serif style: ["normal", "italic"]` loaded but unused for narrative | Fraunces italic reserved for narrative passages and the `01/٠١` button-index marker only | Med — pattern absent from app |
| `text-[11px] uppercase tracking-wider` for labels | Eyebrow component: `text-[11px] uppercase tracking-[0.1em]` (the `tracking-label` token) | Low — same intent, no shared Eyebrow component |
| Button label typography: `text-[13px]/[14px] font-medium` | `text-[15px] font-semibold tracking-[0.01em]` (RTL: 16 px bold, no tracking) | Med — app buttons read lighter and smaller |
| `.num` class forces LTR + tabular — but emits **Latin digits** in AR UI | AR surfaces should render Arabic-Indic numerals where the site uses them (`٠١` button index, etc.) | Med — see §7 |
| Uppercase `Th` headers (`uppercase tracking-wider`) in data tables | Site has no data-table treatment, but the uppercase-caps convention itself is compatible with brand | Low — keep |

## 3. Components

Twenty most-visible UI components in the app:

| # | Component | Current visual | Brand-aligned state | Gap |
|---|---|---|---|---|
| 1 | Primary button | `bg-accent text-white rounded-lg px-[18px] py-[10px] text-[13px] font-medium`, `active:scale-[0.98]`, focus ring `rgba(30,58,138,0.1)` | `bg-signal text-paper rounded-[6px] px-[20px] h-11 text-[15px] font-semibold`, leading 5×5 `bg-paper` dot + 1px divider, optional trailing arrow glyph, hover → `signal-deep` | **High** — dot/divider/arrow identity missing; `active:scale` is SaaS feedback; radius 8 vs 6; size 13 vs 15 |
| 2 | Secondary button | transparent + `border-[var(--border)] text-[var(--text-mid)]` | `border-ink text-ink`, italic Fraunces index "01" + divider, arrow, hover **inverts** to `bg-ink text-paper` | **High** — app's secondary is a muted neutral tag; site's is the editorial workhorse |
| 3 | Text input | `rounded-lg bg-card border px-3 py-2.5 text-[14px]` focus ring 3 px | no equivalent on site, but brand radii are 2–6 px (not `rounded-lg` = 8 px); `bg-card: #FFFFFF` also off-palette | Med — radius and white fill diverge; sizing otherwise fine |
| 4 | Select / dropdown | native `<select>` (SortSelect) | _app-specific, correctly absent from site_ | None |
| 5 | Checkbox | none found in `components/ui/`; presumed native | _app-specific_ | None (flag if styled checkboxes appear later) |
| 6 | Radio | as above | _app-specific_ | None |
| 7 | Modal | none in `components/ui/`; `MobileNavDrawer` uses framer-motion x-slide, easing `[0.2, 0.8, 0.2, 1]` | site has no modal pattern but defines `transitionTimingFunction.expo: cubic-bezier(0.16, 1, 0.3, 1)` as the canonical curve | Med — wrong easing curve, close but not brand |
| 8 | Toast | not present (errors render inline as `text-[var(--red)]`) | no toast in brand — inline is correct | None |
| 9 | Data table | `bg-card text-[14px]`, thead `bg-surface`, Th `text-[11px] uppercase tracking-wider`, Tr bottom border | _app-specific, correctly absent from site_ — typography of Th is on-brand | Low — card bg (white) + `rounded-lg` wrap should be paper + sharper radius |
| 10 | Card | `bg-card rounded-lg shadow-card border-[var(--border)]`, interactive variant adds `-translate-y-px` hover | brand uses paper-layered sections with ambient/float shadow (`rgba(14,22,40,0.05/0.08)`) and rarely "cards" as a first-class unit; radius `0.25rem` default | **High** — card-heavy composition + hover lift = SaaS grammar |
| 11 | List row | `px-5 py-3 border-b` inside a Card | equivalent site pattern: container + 1px stone-light separators, no enclosing card | Med — dense, encapsulated in white card |
| 12 | Sidebar nav item | none — top nav only | _app-specific, correctly absent from site_ | None |
| 13 | Top nav item | `px-3 text-[13px] font-medium`, active = 2 px `bg-accent` underline at bottom edge | site nav (see `components/ui/*`) uses an ink hover underline, 6 px offset, 1 px decoration | Med — active-state bar is the one SaaS tell |
| 14 | Empty state | custom outlined SVG "NoCompanies / NoIssues / NoDeadlines" + `text-dim` copy | brand never uses flat-line illustrations — vocabulary is institutional photography + geometric marks (MK-01…05) | **High** — illustrations are the single most off-brand element by vocabulary |
| 15 | Loading state | `.skeleton` linear-gradient shimmer (1.5 s) on greyed blocks | brand has no skeleton pattern; page transitions use fade; data renders when ready | Med — remove shimmer |
| 16 | Error state | `urgent-pulse` 2 s infinite red-border pulse on the Urgent banner | brand is explicit: restraint, no attention-getting flourishes | **High** — infinite pulse violates voice before a word is read |
| 17 | Success state | inline green tint (`text-[var(--green)]`), semi-bold | compatible in principle, but `#065F46` ≠ brand `#1F6F43`; no "success toast" culture here, which is correct | Low |
| 18 | Tooltip | none found | _app-specific_ | None |
| 19 | Badge | 15 variants (neutral, red, urgent, open, navy, accent, progress, teal, waiting, amber, done, escalated, gold, …), `rounded px-2 py-0.5 text-[11px]` | brand has no badge primitive but the sharp `rounded` (2 px) + 11 px caps reads correctly; the **15-variant taxonomy** is the SaaS marker | Med — radius fine, variant proliferation is off-brand (status palette should be 3 values, not 15 aliases) |
| 20 | Avatar | `h-8 w-8 rounded-full bg-accent text-white` initial | brand never renders a user avatar on public surfaces; if added, would be `bg-ink-20 text-ink` square or 2 px radius, no signal fill | Med — "Slack-style" circle in pure signal = SaaS badge, high recognition penalty |

## 4. Layout and density

The app has no `Container` component and no `max-w-content: 1440px` token. Pages hand-roll their widths: `max-w-7xl` (1280 px) on the dashboard, `max-w-4xl` on landing, full-bleed elsewhere. The site's 1440 px ceiling is part of the institutional rhythm; dropping to 1280 px and varying per-page reads as "ad-hoc product UI".

Horizontal padding is `px-4 md:px-6` (16/24 px), tighter than the site's cadence. The top header is `h-14` (56 px) — closer to Linear/Notion than to the site's marketing chrome. Card padding `px-5 py-4` (20/16 px) and table cells `px-3 py-2.5` are SaaS-dense; this is partly justified by the product needing to show 8–12 metric tiles and 20-row tables per viewport, so mark these as **app-specific, correctly absent from site**.

The dashboard-specific flourishes that do diverge:
- **Metric StatCard grid** (4 colored-tile icons, 40 px display numeral, tinted icon container via `color-mix`): the colored tint blocks are genre-specific (Stripe, Linear, Notion dashboards) and read as "KPI dashboard".
- **Deadline carousel** (`overflow-x-auto`, `min-w-[280px]`, tinted card per urgency band): horizontal scroll cards are correctly app-specific but the urgency-tint background (`bg-[var(--red-l)]` etc.) swaps the canvas colour from cream — should use a 2 px accent bar on paper instead.
- **Greeting line pattern** (`repeating-linear-gradient` 12 px stripes, radial mask) — this is actually the most brand-compatible ornament in the app; it's restrained, geometric, editorial. Keep.

## 5. Voice and copy

### Violations found

| File:line | Current copy | Rewrite suggestion |
|---|---|---|
| [src/lib/i18n.ts:62](apps/web/src/lib/i18n.ts:62) | AR: `"onboarding.title": "لنبدأ العمل"` | `"الخطوات الأولى"` |
| [src/lib/i18n.ts:257](apps/web/src/lib/i18n.ts:257) | EN: `"onboarding.title": "Let's get you set up"` | `"Initial setup"` or `"First steps"` |
| [src/lib/i18n.ts:40](apps/web/src/lib/i18n.ts:40) | AR: `"landing.cta": "ابدأ الآن"` | `"ابدأ المحادثة"` (mirrors site's _Begin a conversation_) |
| [src/lib/i18n.ts:235](apps/web/src/lib/i18n.ts:235) | EN: `"landing.cta": "Get started"` | `"Request a demonstration"` (site's primary CTA verbatim) |
| [src/lib/i18n.ts:41,236](apps/web/src/lib/i18n.ts:41) | `"landing.signin"` is a primary-weight CTA next to `Get started` | keep label, reduce to `tertiary` variant — not two primaries |
| [src/lib/i18n.ts:210–212](apps/web/src/lib/i18n.ts:210) | EN: `"Good morning, {name}"` / AR: `"صباح الخير، أستاذ {name}"` | Drop time-of-day greeting. Site voice does not address the reader by time of day. Replace with a page title (`"Today"`/`"اليوم"`) and keep the Gregorian+Hijri date line. |
| [src/lib/i18n.ts:213](apps/web/src/lib/i18n.ts:213) | EN: `"Urgent: {n} issues need action today"` | `"{n} notices require action today."` — drop the "Urgent:" prefix label (the surrounding treatment already signals urgency) |
| [src/lib/i18n.ts:261](apps/web/src/lib/i18n.ts:261) | EN: `"Link the bot to receive government notices and turn them into actions."` | `"Connect Telegram to route incoming notices into their organization's file."` — "turn them into actions" reads CRM-ish |
| [src/lib/i18n.ts:202](apps/web/src/lib/i18n.ts:202) | EN: `"brand.tagline": "Saudi compliance command center"` | `"A compliance instrument for Saudi Arabia."` (site's exact tagline) |
| [src/lib/i18n.ts:7](apps/web/src/lib/i18n.ts:7) | AR: `"brand.tagline": "مركز عمليات الامتثال السعودي"` | `"أداة امتثال للمملكة العربية السعودية."` |
| [src/lib/i18n.ts:237](apps/web/src/lib/i18n.ts:237) | EN: `"landing.headline": "All your government notices, understood and organized"` | reframe as a complete sentence; drop the gerund-adjacent participles. e.g. `"Every notice from ZATCA, GOSI, HRSD, Balady and MOCI — routed, read, resolved."` (site-cadence) |
| [src/lib/i18n.ts:276](apps/web/src/lib/i18n.ts:276) | EN: `"companies.empty.desc": "Start by adding your first organization."` | `"No organizations on file. Add one to begin."` — removes imperative SaaS framing |
| [src/app/login/login-form.tsx:34](apps/web/src/app/login/login-form.tsx:34) | `"Invalid email or password."` / `"البريد الإلكتروني أو كلمة المرور غير صحيحة."` | Generic error message — flag for review. Not banned, but thin; consider `"The email and password don't match a known account."` |
| [src/app/(app)/dashboard/page.tsx:318](apps/web/src/app/(app)/dashboard/page.tsx:318) | `"No urgent items. Last activity"` | `"Nothing urgent. Most recent activity"` — drops "items" (noun from SaaS) |
| [src/lib/i18n.ts:166–173](apps/web/src/lib/i18n.ts:166) | `"channels.whatsapp.soon": "Coming soon"` / `"قريباً"` | `"Available in the next phase."` — less launch-marketing |
| [src/lib/i18n.ts:367](apps/web/src/lib/i18n.ts:367) | `"channels.whatsapp.soon": "Coming soon"` — duplicated | same as above |

**Empty adjectives, SaaS verbs, exclamation marks, "Oops"/"Whoops"/"Uh oh!"**: _none found_ in user-facing strings. This is one clear strength of the current copy.

**Gerund headlines**: none of the section headings are gerunds (`"Recent Activity"`, `"Upcoming Deadlines"`, `"My Organizations"` are all noun phrases). Pass.

### Voice-aligned copy to preserve

- All Arabic `issue.status.*` labels (`مفتوحة`, `قيد المراجعة`, `لدى الأخصائي`, `بانتظار الجهة الحكومية`, `محلولة`, `مصعّدة`, `مؤرشفة`) — institutional register, bureaucracy-literate.
- `"If ignored"` / `"عقوبة التجاهل"` (`issue.penalty`) — direct, consequential, not softened.
- `"Waiting on gov"` / `"بانتظار الجهة الحكومية"` — flat declarative state; no SaaS flourish.
- Noun-phrase section titles across the board.
- `"Danger zone"` / `"المنطقة الحساسة"` — acceptable industry idiom; the AR phrasing is notably restrained.

## 6. Brand marks

**Present**
- `/logo.png` — a single raster logo, served through a plain `<img>`. Loaded at 32 px (nav) and 64 px (landing). Acts as both icon and wordmark.

**Missing**
- SVG `Logo` component with locale-aware form (site has EN and AR wordmarks as distinct SVG assets).
- On-paper vs on-ink variant handling.
- The five geometric marks: `MarkContact`, `MarkFirms`, `MarkFrame`, `MarkMethod`, `MarkPlatform` (site `components/brand/*`). None referenced in app.
- `InstitutionalImage` treatment (three-layer grayscale/contrast/overlay filter) — not needed until the app uses photography, but flag for when it does.

**Shouldn't be there**
- Phosphor duotone icon set (`@phosphor-icons/react` with `weight="duotone"`) — the duotone weight carries soft-fill saturation that reads as consumer-app vocabulary. The site uses hand-drawn 1 px-stroke marks (see the Button `ArrowGlyph`) and its five bespoke geometric marks; no duotone icons anywhere.
- The three outlined SVG illustrations (`NoCompanies`, `NoIssues`, `NoDeadlines`) — same family as Stripe/Linear empty-state art. Brand has no equivalent.

## 7. Bilingual state

| Dimension | State | Notes |
|---|---|---|
| `lang` + `dir` on `<html>` | **Pass** | Set correctly from session in `layout.tsx:48–50` |
| `me-*` / `ms-*` / `start`/`end` logical properties | **Pass** | Used consistently (e.g. `me-6`, `ms-auto`, `text-start`, `insetInlineEnd`) |
| RTL icon flipping | **Pass** | `.flip-rtl { transform: scaleX(-1) }` utility; applied on `CaretRight` and similar |
| Arabic font | **Fail** | Loads Readex Pro; brand specifies Tajawal (see site `app/[locale]/layout.tsx:30`). Replace the `Readex_Pro` import with `Tajawal` at `weights: ["400","500","700","800"]`. |
| Arabic legibility floor | **Partial** | `html[lang="ar"]` bumps xs/sm to 14–15 px; the site solves this with a script-aware `Heading` component rather than post-hoc utility overrides. Works; less systematic. |
| Arabic-Indic numerals | **Fail** | `.num` class forces `direction: ltr` and `var(--font-mono-stack)`, which emits Latin digits even inside an RTL page. Site renders Arabic-Indic digits (`٠١`, etc.) on AR surfaces. Consider `font-variant-numeric` + `unicode-bidi: plaintext` + Tajawal rendering for AR. |
| Terminology: org in AR | **Pass** | `شركة` / `شركاتي` throughout — matches ADR-0010. |
| Terminology: org in EN | **Pass** | `Organization` / `Organizations` — matches ADR-0010. |
| Honorific "أستاذ" in AR greeting | **Flag** | Culturally correct but adds an interpersonal register the site never uses. Recommend removing alongside the greeting itself (§5). |
| Language toggle affordance | **Partial** | A form-submit text button shows `العربية`/`EN` in the top nav. Site uses a dedicated `LanguageToggle` component with underline/tracking conventions. |

## 8. Motion

| Pattern | Classification | Notes |
|---|---|---|
| `.fade-in` — 200 ms ease-out, 2 px y-offset, on `<main>` | **on-brand** | Close to the site's expo curve in duration and restraint |
| `.urgent-pulse` — 2 s infinite border-color loop | **violates brand** | Infinite attention-seeking motion; site voice is explicit about restraint |
| `.skeleton` — 1.5 s linear shimmer | **violates brand** | SaaS vocabulary; remove |
| `active:scale-[0.98]` on buttons | **needs adjustment** | Tactile "pressed" micro-bounce; site's primary button uses colour change only |
| `hover:-translate-y-px` on Card (interactive variant) | **needs adjustment** | "Lift to indicate clickable" is Stripe/Linear grammar; site uses colour + underline |
| MobileNavDrawer — framer-motion slide, 200 ms, easing `[0.2, 0.8, 0.2, 1]` | **needs adjustment** | Nearly brand-aligned; wrong curve. Replace with site's `expo: cubic-bezier(0.16, 1, 0.3, 1)` |
| Scrim fade 200 ms | **on-brand** | Fine |
| Nav underline appears on active (no transition) | **on-brand** | Restrained; fine as-is, though could adopt the site's hover-underline animation for consistency |
| `transition-colors duration-[120ms]` on buttons | **on-brand** | Matches site cadence |
| Phosphor icons rendered as `weight="duotone"` | **violates brand** (static, but treated here as a motion-adjacent affordance) | Covered in §6 |

## Prioritized fix list

Effort is engineer-hours for a founder-familiar codebase; impact is a 1–10
subjective score of how much the change closes the visual gap. Sorted by
impact-to-effort ratio, highest first.

| # | Change | Files | Effort | Impact | I/E |
|---|---|---|---|---|---|
| 1 | **Swap canvas tokens** — rename `--bg/--surface/--card/--text` → `--paper/--paper-light/--paper-deep/--ink`; add `--ink-80/60/40/20`; remove `--teal*`, `--accent-xl`; rename `--accent` → `--signal`. Add a Tailwind `@layer base` body gradient + fractalNoise grain | [globals.css](apps/web/src/app/globals.css), [tailwind.config.ts](apps/web/tailwind.config.ts) | 2 h | 9 | 4.5 |
| 2 | **Fix fonts** — replace `Instrument_Serif` → `Fraunces`, `Readex_Pro` → `Tajawal`; keep Inter + JetBrains Mono. Update `--font-display` stack | [layout.tsx](apps/web/src/app/layout.tsx) | 0.5 h | 8 | 16 |
| 3 | **Remove `.urgent-pulse` and `.skeleton`** — delete the CSS keyframes and their call sites; show dashboard urgent banner with a 2 px signal-deep border, no motion | [globals.css](apps/web/src/app/globals.css), [dashboard/page.tsx](apps/web/src/app/(app)/dashboard/page.tsx) | 1 h | 6 | 6 |
| 4 | **Rewrite onboarding title + landing CTA + brand tagline** — 6 i18n string edits | [i18n.ts](apps/web/src/lib/i18n.ts) | 1 h | 7 | 7 |
| 5 | **Port site's `Button` component** — replace app button's `scale + rounded-lg + bg-accent` with `rounded-[6px] + dot + divider + arrow glyph + hover:bg-signal-deep`; add secondary-variant index marker | [components/ui/button.tsx](apps/web/src/components/ui/button.tsx) | 3 h | 9 | 3 |
| 6 | **Remove the three SVG empty-state illustrations** — replace with a geometric mark (port one of `MK-01…05` into `apps/web/src/components/brand/`) + a one-line copy | [NoCompanies.tsx](apps/web/src/components/illustrations/NoCompanies.tsx), [NoIssues.tsx](apps/web/src/components/illustrations/NoIssues.tsx), [NoDeadlines.tsx](apps/web/src/components/illustrations/NoDeadlines.tsx), [dashboard/page.tsx](apps/web/src/app/(app)/dashboard/page.tsx), [organizations/page.tsx](apps/web/src/app/(app)/organizations/page.tsx) | 3 h | 8 | 2.7 |
| 7 | **Collapse the Badge taxonomy** — 15 variants → 4 (`neutral`, `signal`, `success`, `error`, `alert`). Map the other 11 aliases into those four | [badge.tsx](apps/web/src/components/ui/badge.tsx) + call sites | 2 h | 5 | 2.5 |
| 8 | **Remove Phosphor duotone icons** — switch to `weight="regular"` at minimum; for dashboard metric icons, replace with a 1 px-stroke glyph matching the site's `ArrowGlyph` family | [dashboard/page.tsx](apps/web/src/app/(app)/dashboard/page.tsx), [app-shell.tsx](apps/web/src/components/app-shell.tsx), [MobileNavDrawer.tsx](apps/web/src/components/MobileNavDrawer.tsx) | 2 h | 6 | 3 |
| 9 | **Port the `Heading` component** — adopt fluid clamped scale with per-script tokens; update every `h1/h2/h3` call site to use it | new `components/ui/Heading.tsx`, ~20 call sites | 4 h | 7 | 1.75 |
| 10 | **Port the `Container` component** — `max-w-content` (1440 px) + consistent horizontal padding scale; replace `max-w-7xl` / `max-w-4xl` hand-rolls | new `components/ui/Container.tsx`, top-level pages | 2 h | 4 | 2 |
| 11 | **Replace logo.png with a locale-aware SVG `Logo` component** — mirror site's `components/ui/Logo.tsx`; support `on-paper`/`on-ink` variants | [LogoMark.tsx](apps/web/src/components/LogoMark.tsx) | 2 h | 5 | 2.5 |
| 12 | **Remove `hover:-translate-y-px` + `active:scale-[0.98]` micro-motion** — colour change only | [card.tsx](apps/web/src/components/ui/card.tsx), [button.tsx](apps/web/src/components/ui/button.tsx) | 0.5 h | 3 | 6 |
| 13 | **Fix the drawer easing** — replace `[0.2, 0.8, 0.2, 1]` with `[0.16, 1, 0.3, 1]`; expose as a Tailwind `transitionTimingFunction.expo` token | [tailwind.config.ts](apps/web/tailwind.config.ts), [MobileNavDrawer.tsx](apps/web/src/components/MobileNavDrawer.tsx) | 0.5 h | 2 | 4 |
| 14 | **Drop the time-of-day greeting** — replace with `"Today"` / `"اليوم"` page title + existing date line | [i18n.ts](apps/web/src/lib/i18n.ts), [dashboard/page.tsx](apps/web/src/app/(app)/dashboard/page.tsx) | 0.5 h | 3 | 6 |
| 15 | **Render Arabic-Indic digits on AR surfaces** — decouple `.num` from the mono stack on `html[lang="ar"]`; let Tajawal render `٠١٢٣٤٥٦٧٨٩` | [globals.css](apps/web/src/app/globals.css) | 1 h | 3 | 3 |

Top-five execution order by I/E: **2 → 4 → 7 → 8 → 12**. Together these cost
roughly 6 hours and shift the app from "different product" to "same family" on
first glance — primarily through fonts, copy, icon weight, and removing the
two clearest SaaS tells (card lift + button press-scale).
