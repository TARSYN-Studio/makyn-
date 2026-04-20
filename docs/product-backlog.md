# Product backlog

Items flagged from design/engineering passes that require a product
decision before they can be implemented. Not a roadmap — a parking lot.

## User name locale handling

Current behavior: `user.fullName` is stored as-entered (single string field). When the UI locale differs from the script the user typed, surfaces that reference the name render in the "wrong" script (e.g., Latin "mohammed" shown in an Arabic interface).

Surfaces affected:
- Avatar initial letter
- Settings profile form default value
- Any future "Assigned to X" labels
- Account switcher (if/when built)

Options for resolution (requires product decision):
1. Store separate `fullNameAr` and `fullNameEn` fields; render the locale-matched one with fallback to the other.
2. Store a single canonical name and always render it in its original script regardless of UI locale.
3. Accept the current behavior and ensure UX never presents the name in conflict with surrounding script.

Blocker: requires product decision + data migration plan. Not a design fix.
