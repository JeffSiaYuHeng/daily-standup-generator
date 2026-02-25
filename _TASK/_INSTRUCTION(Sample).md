# Task Instruction

## Context
[Brief explanation: Why does this task exist? What is the core objective?]
Derived from: [Reference the specific CURRENT FOCUS or Milestone in _PLAN.md]

---

## Context Scope (Strict)


**The Coder agent is ONLY allowed to modify the following files:**

- path/to/file_A.ts
- path/to/file_B.tsx
- path/to/file_C.sql

**No other files may be touched. If a change is required outside of this list, STOP immediately and report to the Planner.**

> RULE:
> - Exactly listed paths only
> - No glob patterns
> - No implied files


---

## Steps (Execution Order)

All steps MUST:
- Be written as imperative bullet points
- Describe WHAT to do, not HOW to code it
- Avoid all ambiguous verbs

1. Rename the displayed queue number to "OG Serial Number" in the UI.
2. Ensure the value source remains unchanged from the existing queue logic.
3. Update any related label text to match the new naming.

> FORBIDDEN WORDS:
> - "maybe"
> - "try"
> - "optimize"
> - "improve"
> - "if needed"

### 1. Module/File [Name A]
1. **[Action Type: Refactor/Setup/Implement]**: 
   - Specific implementation detail 1...
   - Specific implementation detail 2...
   - Expected outcome/logic.

### 2. Module/File [Name B]
1. **[Action Type]**:
   - Step-by-step logic (reference exact function names, variable names, or component names).
   - Data flow description (e.g., "Extract from FormData -> Validate -> DB Operation -> Revalidate Cache").
2. **[Specific Logic Handling]**:
   - Error handling requirements.
   - Specific imports or dependency usage.

### 3. Module/File [Name C]
1. ...

---

## Constraints & Rules
- **[Tech Stack Constraints]**: (e.g., "Must use Supabase Admin Client to bypass RLS," "Must use existing S3 utility functions").
- **[Standard Compliance]**: (e.g., "Follow naming conventions in _DOCS/02_STYLE_GUIDE.md").
- **[Data Integrity]**: (e.g., "Must match types defined in _DOCS/01_DB_SCHEMA.md").
- **[Error Handling]**: (e.g., "Wrap server actions in try/catch and return a standardized { error: string } object").

---

## Out of Scope (Hard Stop)
**The Coder MUST NOT:**

- **Modify**:
  - [Forbidden File 1]
  - [Forbidden File 2]
  - [General system-wide config files]
- **Actions**:
  - Do NOT modify the database schema (schema changes must be a separate task).
  - Do NOT refactor code unrelated to the steps listed above.
  - Do NOT introduce new dependencies not already present in the project.

---

## Quality Checklist (Self-Review)
- [ ] Are all modifications strictly within the **Context Scope**?
- [ ] Has the **Execution Order** been followed exactly?
- [ ] Are all function names and logic flows aligned with existing project patterns?
- [ ] Has any "scope creep" (unrequested cleanup) been avoided?