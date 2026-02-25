# Task Instruction: Fix Date Formatting

## Context
The user requested the date format across the history interface to strictly follow the pattern `D/M/YYYY dddd` (e.g., "25/2/2026 Wednesday"). Currently, there are inconsistencies in how the date is formatted in the application display (e.g. M/D/YYYY). We need to standardize this.

---

## Context Scope (Strict)
The Coder agent is ONLY allowed to modify the following files:
- components/HistorySidebar.tsx

---

## Reference Scope (Read-Only)
- types.ts

---

## Steps (Execution Order)
1. Locate all instances where a `Date` object is formatted into a string for display in `components/HistorySidebar.tsx` (e.g. inside `handleExport` or the sidebar UI).
2. Update the string interpolation to enforce the exact format layout: `[Day]/[Month]/[Year] [DayName]` (e.g., `${day}/${month}/${year} ${dayName}`). Note that JavaScript `getMonth()` returns 0-11, so ensure `month` is computed as `date.getMonth() + 1`.
3. Ensure both the list view item headers and the detailed view headers use this exact format to consistently render dates like `25/2/2026 Wednesday`.

---

## Constraints & Rules
- Do NOT use third-party libraries like `moment` or `date-fns` unless already installed. Native `Date` methods (`getDate()`, `getMonth() + 1`, `getFullYear()`, `toLocaleDateString('en-US', { weekday: 'long' })`) are sufficient.
- The format must match exactly: `D/M/YYYY dddd` (e.g., `25/2/2026 Wednesday`).

---

## Out of Scope (Hard Stop)
- Do not modify the actual save/update logic yet; only fix the display formatting in this task.
- Do not modify `App.tsx` or `StandupOutput.tsx`.

---

## Quality Checklist (Self-Review)
- [ ] Context Scope contains ≤ 4 files
- [ ] Reference Scope contains ≤ 2 files
- [ ] Reference Scope files are NOT in Context Scope
- [ ] No code snippets included
- [ ] Out of Scope is explicit
