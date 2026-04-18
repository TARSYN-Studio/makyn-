# ADR-0010: Arabic UI keeps "شركة", English uses "Organization"

**Status:** Accepted
**Date:** 2026-04-18
**Deciders:** Mohammed
**Relates to:** ADR-0005 (multi-user rename), i18n strategy

## Context
ADR-0005 renamed `Company` to `Organization` throughout the code
and English UI, because "Organization" is the right abstraction for
a system that supports accounting-firm users managing multiple
client entities. The Arabic translation of "Organization" raises a
question that English-first developers routinely get wrong: what's
the correct Arabic word?

Three candidates in Arabic:

- **شركة (sharika):** the word Saudi business owners actually use
  for their registered business entity. On every CR certificate,
  every AoA, every government form. Legal-domain standard.
- **مؤسسة (mu'assasa):** in Saudi business context, this typically
  means sole proprietorship (مؤسسة فردية). Using it as the generic
  Arabic term would be confusing: "is my شركة also a مؤسسة?"
- **منظمة (munazzama):** reads as non-profit organization or NGO
  in Arabic. Wrong connotation for a for-profit business registry.

## Options considered
- **Translate "Organization" literally to مؤسسة:** misrepresents
  the domain. Saudi users would read it as "sole proprietorship
  portal" despite the product supporting LLCs, JSCs, etc.
- **Translate "Organization" to منظمة:** reads as NGO management
  software, confuses the ICP.
- **Keep English term "Organization" in Arabic UI:** lazy, signals
  the product wasn't designed for Arabic speakers.
- **Keep شركة (the legal-domain term) in Arabic regardless of the
  English rename:** semantic fidelity — Arabic UI uses the word
  Saudi users already use for their business entity.

## Decision
Arabic UI uses شركة / الشركات / شركتي everywhere. English UI uses
"Organization" / "Organizations" / "my organization." The two
languages represent the same concept with the right word in each
language, not a word-for-word translation.

## Rationale
English "Organization" is a technical app concept chosen for
abstraction power (it generalizes across single-owner LLCs, firms
managing many clients, holding structures, etc.). Arabic Saudi
business domain has a single word that already expresses exactly
this: شركة. Translating English to Arabic literally would
mis-signal the product's audience and scope — Saudi users would
read a UI in مؤسسة or منظمة and feel it's not for them. This is
a case where the right translation is a different concept, not a
different word.

Precedent: this is how Stripe's Arabic localization handles the
same problem. "Account" in English is "حساب" in Arabic — direct.
"Organization" in English is "شركة" in Arabic — contextual.
Product managers and translators in this space generally agree.

## Consequences
- Arabic i18n strings use شركة throughout: `nav.organizations` in
  Arabic = "الشركات"; `action.create_organization` = "إنشاء شركة".
- When reviewing AI-generated translations (Gemini or any other),
  watch for automatic "Organization → مؤسسة" swaps. Reject and
  replace with شركة.
- Any future multi-lingual additions (Urdu, Indonesian, etc.)
  should undergo the same check: "what word does a local business
  owner actually use for their registered entity?" — don't assume
  translation.
- Domain docs (`docs/knowledge/domain/arabic-terminology.md`)
  capture this reasoning for future engineers and translators.

## When to revisit
- If MAKYN expands to a country where شركة is not the natural term
  (unlikely for GCC expansion; more likely for non-Arab markets).
- If a specific feature requires distinguishing between شركة and
  مؤسسة in Arabic UI (e.g., a "convert sole proprietorship to LLC"
  flow) — then both terms would appear in that narrow context, but
  the top-level abstraction stays شركة.