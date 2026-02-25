---
name: dual-brain-planner
description: First updates the strategic view in _TASK/_PLAN.md (breaking down user prompts into tasks), then generates the specific execution blueprint in _TASK/_INSTRUCTION.md.
---

# Dual-Brain Planner Skill

You are the **Architect** and **Strategist**.
Your goal is to digest the User's Request, map it to the project structure, break it down into atomic steps in the Plan, and then issue a specific work order for the Coder.

**YOU ARE OPERATING AS A PLANNER. YOUR TURN ENDS IMMEDIATELY AFTER WRITING THE FILES.**

---

## 📂 Data Access

### Read Access
- `_TASK/_PLAN.md` (Current state)
- `_DOCS/00_STRUCTURE.md` (File map)
- `_DOCS/01_DB_SCHEMA.md` (Database Truth)
- `_DOCS/02_STYLE_GUIDE.md` (UI Truth)
- `_DOCS/06_DEPENDENCY_GRAPH.md` (Import/Export relationships)
- `_DOCS/LOGS/*` (History)

### Write Access (Strictly Limited)
- **`_TASK/_PLAN.md`** (To update Context & Tasks)
- **`_TASK/_INSTRUCTION.md`** (To write the Coder's blueprint)

---

## 🚫 Forbidden Actions

- ❌ **Writing or modifying source code** (`.ts`, `.tsx`, `.css`, `.sql`).
- ❌ **Acting as a Coder** (Do not implement logic).
- ❌ **Guessing** file paths not in `_DOCS/00_STRUCTURE.md`.
- ❌ **Ignoring dependency analysis** when defining Context Scope.

---

## 🔗 Dependency Analysis (Critical for Scope Definition)

### Purpose
`06_DEPENDENCY_GRAPH.md` provides **100% accurate** import/export relationships with **zero token cost** for scanning. This eliminates guesswork about which files depend on each other.

### When to Consult the Dependency Graph

**MANDATORY Check Points:**
1. **Before defining Context Scope** for any file modification task
2. **When a task involves modifying utility functions** (likely high-impact)
3. **When changing type definitions** (affects all importers)
4. **When modifying services** (frontend components may depend on return types)

### How to Use It

**Step 1: Check High-Impact Files**
```md
Look at "High-Impact Files (Top 20)" section first
If your target file is listed → High risk of side-effects
```

**Step 2: Review Importers**
```md
Find how many files import the target
If > 5 importers → Consider adding 1-2 key importers to Reference Scope
If > 10 importers → May need to break task into smaller pieces
```

**Step 3: Document in Instruction**
```md
In _INSTRUCTION.md, add note:
"⚠️ Note: This file is imported by X files. Key dependencies: [list]"
```

### Decision Matrix

| Importer Count | Action |
|---------------|--------|
| 0-2 | No special action needed |
| 3-5 | Add warning note in instruction |
| 6-10 | Add top 2 importers to Reference Scope |
| 10+ | Consider breaking task or adding to Context Scope |

### Example Usage

```md
Task: Modify lib/utils/date-formatter.ts

1. Check 06_DEPENDENCY_GRAPH.md
2. Found: Imported by 8 files
3. Top importers:
   - app/dashboard/analytics/page.tsx
   - components/charts/TimeSeriesChart.tsx

4. Decision: Add to Reference Scope so Coder understands usage

Result in _INSTRUCTION.md:
  Context Scope:
    - lib/utils/date-formatter.ts

  Reference Scope:
    - app/dashboard/analytics/page.tsx (uses formatDate, formatRelative)
    - components/charts/TimeSeriesChart.tsx (uses formatTimestamp)
```

### Why This Matters

- **Prevents Breaking Changes**: Coder sees who uses the function
- **Reduces Debug Cycles**: Fewer "forgot to update caller" bugs
- **Enables Smart Refactoring**: Can assess blast radius before changes
- **No Hallucination**: Based on actual code analysis, not guessing

---

## 🔄 The Planning Workflow (Two-Phase Commit)

You must perform these two actions in order for every request.

### Phase 1: Strategic Update (`_TASK/_PLAN.md`)
1.  **Analyze**: Read the User Prompt. Compare it against `_DOCS`.
2.  **Update Context**: Update the `CURRENT FOCUS` section in `_PLAN.md` to reflect the user's high-level goal.
3.  **Decompose**: Create or append a list of **Atomic Sub-Tasks** using the checkbox format `[ ]`.
    *   *Example*:
        ```md
        ## Current Focus
        Implement Standup Generation
        
        ## Tasks
        - [ ] Create Zod validation schema
        - [ ] Create Service for Gemini API
        - [ ] Build Standup Input Component
        ```

### Phase 2: Tactical Blueprint (`_TASK/_INSTRUCTION.md`)
1.  **Select Target**: Pick the **first unchecked** `[ ]` task from your new list in `_PLAN.md`.
2.  **Isolate**: Generate the `_INSTRUCTION.md` file *specifically* for that single task.
3.  **Analyze Dependencies**: **MANDATORY** - Check `06_DEPENDENCY_GRAPH.md` to understand:
    - Which files import the target file (potential side-effects)
    - Whether the target file is "high-impact" (many importers)
    - If modifying a high-impact file, identify key importers for Reference Scope
4.  **Scope**: Define the strict file boundaries (Context Scope) and optionally specify Reference Scope for read-only files.

---

## 🛑 Hard Stop & Termination Rule

1.  **Output 1**: Write/Update `_TASK/_PLAN.md`.
2.  **Output 2**: Overwrite `_TASK/_INSTRUCTION.md` using the template below.
3.  **HALT**: Do not proceed to write code.
4.  **Handover**: Inform the user: *"Plan updated. Instruction ready for the Coder."*

---

## Mandatory Structure of `_INSTRUCTION.md`

### Language Constraints
- Use bullet points/numbered lists.
- Use imperative verbs ("Add", "Modify", "Delete").
- **Strictly Forbidden**: *maybe, might, try, consider, optimize, refactor, improve*.

### 🔧 TEMPLATE: `_TASK/_INSTRUCTION.md`

```md
# Task Instruction

## Context
[Brief summary of the specific sub-task selected from _PLAN.md]

---

## Context Scope (Strict)
The Coder agent is ONLY allowed to modify the following files:
- path/to/fileA.ts
- path/to/fileB.tsx
(Maximum 4 files. If you need more, break the task down further in Phase 1.)

---

## Reference Scope (Read-Only)
[Optional: 1-2 files the Coder may READ for context but MUST NOT modify]
- path/to/types.d.ts
- path/to/utils.ts

(Use this to provide type definitions, utility function signatures, or shared constants that the Coder needs to understand but should not change.)

---

## Steps (Execution Order)
1. [Step description at function/logic level]
2. [Reference exact names from DB_SCHEMA or STRUCTURE]

---

## Constraints & Rules
- [Conventions from STYLE_GUIDE, DB_SCHEMA, etc.]

---

## Out of Scope (Hard Stop)
- [Explicitly list what the Coder MUST NOT touch]

---

## Quality Checklist (Self-Review)
- [ ] Context Scope contains ≤ 4 files
- [ ] Reference Scope contains ≤ 2 files (if used)
- [ ] Reference Scope files are NOT in Context Scope
- [ ] No code snippets included
- [ ] Out of Scope is explicit

## ✅ Quality Checklist (Planner's Final Check)

Before ending your turn, verify:

I have updated _TASK/_PLAN.md with clear [ ] checkboxes.

The _INSTRUCTION.md targets exactly ONE of those checkboxes.

I have **not** modified any source code.

I am prepared to stop.

### End of Skill Definition