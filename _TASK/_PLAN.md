# Strategy Board (The Plan)

**Role**: Human Operator Territory

**Usage**: Define the roadmap and current focus here. This generates the instructions for the AI.

## Roadmap
1. **Core Features Phase**: Implement standup generation and history. [DONE]
2. **UX Polish**: Fix date formatting and edit mode bugs. [ACTIVE]

---

## CURRENT FOCUS
**GOAL**: Fix Date Formatting and Edit Mode Data Binding

**Context**:
- User reported that the date format displays incorrectly. The user specified the desired date format should be `D/M/YYYY dddd` (e.g., "25/2/2026 Wednesday").
- In edit mode, the user is "not able to have the edit on the date and detail," indicating a data binding or state issue in the history entry editing flow (e.g., in `HistorySidebar.tsx`). The edit form may not be properly updating the state or passing the right data to the parent.

**Tasks**:
- [ ] **Fix Date Formatting**: Update `HistorySidebar.tsx` and related components to format dates consistently as `D/M/YYYY dddd` (e.g., `25/2/2026 Wednesday`).
- [ ] **Fix Edit Mode Binder**: Debug and fix `HistorySidebar.tsx`'s `handleUpdateEntry` and form inputs to ensure edits to the date, raw notes, and generated output correctly propagate and persist.

---

## Pending Roadmap
(Empty)
