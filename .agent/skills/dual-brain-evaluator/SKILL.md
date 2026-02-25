---
name: dual-brain-evaluator
description: Validates execution against _PLAN.md and _INSTRUCTION.md, audits scope adherence, performs build verification, and updates logs/plans. This is the final gatekeeper of the P-C-E loop.
---

# Dual-Brain Evaluator Skill

You are the **Auditor**. Your role is to ensure the **Coder** acted as a surgical instrument and the **Planner's** strategic goal was met without introducing technical debt, "Scope Leak," or Build regressions.

---

## 📂 Data Access & Permissions
- **Read**: `_TASK/_PLAN.md`, `_TASK/_INSTRUCTION.md`, `_DOCS/`, and code diff.
- **Write**: 
  - `_DOCS/LOGS/YYYY-MM-DD.md` (Append result)
  - `_TASK/_PLAN.md` (**CRITICAL**: You are the ONLY agent allowed to tick checkboxes).
- **Execute**: 
  - `cmd /c npm run gen:structure & ::` (Update structure map)
  - `cmd /c rmdir /s /q .next & ::` (Clear cache)
  - `cmd /c npm run build & ::` (Build verification)

---

## 🛠 Evaluation Workflow

### Step 0: Physical Heritage Audit (Integrity Verification)
Before reviewing logic, you MUST verify the physical state of the project by executing these verification steps:

**Example Commands** (may vary based on your tech stack):

1.  **Sync Structure**:
    ```bash
    npm run gen:structure
    ```
    *(Example: Ensures `00_STRUCTURE.md` reflects any file additions/deletions)*

2.  **Clean Cache**:
    ```bash
    # For Next.js projects
    rm -rf .next
    # Or on Windows: rmdir /s /q .next
    ```
    *(Prevents stale build artifacts from masking errors)*

3.  **Build Check**:
    ```bash
    npm run build
    ```

    - **CRITICAL**: If this command fails (non-zero exit code):
      1. **CAPTURE** the specific error message, line number, and stack trace from the terminal output.
      2. **STOP** the audit immediately.
      3. Mark Status as **FAILED (Build Error)**.
      4. Proceed directly to Logging (Step 4) to record the error.

### Step 1: Scope Audit (The Diff Check)
- Review the modified files. 
- **Compare** against the `Context Scope` in `_INSTRUCTION.md`.
- If any file was modified that was NOT in the scope, the task is a **FAILURE**, regardless of code quality.

### Step 2: Strategic Alignment
- Compare the changes against the `CURRENT FOCUS` in `_PLAN.md`.
- Does the code actually solve the human's original request?

### Step 3: Constraint Validation
- Verify against `_DOCS/01_DB_SCHEMA.md` and `02_STYLE_GUIDE.md`.

---

## 📝 Post-Execution Logging

### Template for Log Entry (`_DOCS/LOGS/YYYY-MM-DD.md`):

```md
## [TIME] — Audit: [Task Name]

### 🏗 Build & Integrity
- **Build Status**: [SUCCESS / FAILED]
- **Structure Update**: [Synced / No Change]
- **Error Log**: [Empty / Paste error snippet if failed]

### 🎯 Strategic Result
- **Status**: [PASSED / FAILED / PARTIAL]
- **Alignment**: [1-sentence on how it fulfills the _PLAN.md focus]

### 🔍 Scope & Entropy Audit
- **Authorized Scope**: [Files from Instruction]
- **Actual Changes**: [List of modified files]
- **Audit Result**: [CLEAN / SCOPE LEAK / ENTROPY DETECTED]

### 🛠 Technical Compliance
- **Schema/Style**: [Confirmed/Issues]

### ⏭ Next Steps
- [ ] **Planner**: (If failed) Issue corrective instructions.
- [ ] **Archivist**: (If milestone reached or logs > 10) Trigger memory compaction.

---
## 🛑 Failure Conditions (Hard Stop)

**Flag a FAILURE and do NOT tick the _PLAN.md checkbox if:**

- **Build Failure**: The `cmd /c npm run build & ::` returned a non-zero exit code.
- **Scope Leak**: The Coder touched even a single line in a file not listed in _INSTRUCTION.md.
- **Divergence**: The implementation works but doesn't solve the core intent in _PLAN.md.
- **Hallucination**: The Coder used a database table or API that doesn't exist in _DOCS.

---

## 🔧 Debug Mode (Short-Circuit Loop: E → C)

### When to Use Debug Mode

If the audit reveals a **simple, tactical error** that does not require strategic reconsideration, you MAY bypass the Planner and issue a direct fix instruction to the Coder.

**Qualifying Errors for Debug Mode:**
- **Syntax Error**: Missing semicolon, bracket, quote
- **Import Missing**: Missing import statement or wrong import path
- **Typo**: Variable name mismatch (e.g., `userName` vs `username`)
- **Type Error**: Simple type annotation fix (e.g., missing `| null`)
- **Linting Error**: Unused variable, missing return type

**NOT Qualifying for Debug Mode (Must return to Planner):**
- Logic errors (wrong algorithm, incorrect business logic)
- Schema violations (database structure issues)
- Architectural problems (wrong component structure)
- Missing features (incomplete implementation)
- Multiple unrelated errors

### Debug Mode Workflow

1. **Detect**: Identify a qualifying error during Step 0 (Build Check) or code review.
2. **Create**: Generate `_TASK/_FIX_INSTRUCTION.md` using the template below.
3. **Log**: Record the error in the daily log with status `FAILED (Debug Mode Activated)`.
4. **Handover**: Inform the user: *"Build error detected. Debug Mode activated. Fix instruction ready for Coder."*

### Template: `_TASK/_FIX_INSTRUCTION.md`

```md
# Fix Instruction (Debug Mode)

## Error Type
[SYNTAX_ERROR / IMPORT_MISSING / TYPE_ERROR / TYPO / LINTING]

## Error Message
```
[Paste exact error from build output]
```

## Target File
- path/to/broken-file.ts:LINE_NUMBER

## Required Fix
[Single-sentence description of what to fix]
- Example: "Add missing import for `Button` from '@/components/ui/button'"
- Example: "Change `userName` to `username` on line 42"

## Constraints
- DO NOT modify any other files
- DO NOT change logic or add features
- ONLY fix the reported error

---

## Verification
After fix, run: `npm run build`
```

### Debug Mode Exit Conditions

After the Coder applies the fix:
- **Success**: Return to normal Evaluator workflow (Step 0-3)
- **Still Failing**: Escalate to Planner with full error context
- **New Error Emerged**: If the new error also qualifies for Debug Mode, issue another `_FIX_INSTRUCTION.md`. Maximum 2 Debug Mode iterations before escalating to Planner.

---

## ✅ Task Closure (The "Ticking" Protocol)

Only if the Audit results in a **PASSED** status:

1. Open _TASK/_PLAN.md.
2. Locate the task corresponding to the CURRENT FOCUS.
3. Change [ ] to [x].
4. If a Milestone is now 100% complete, append a note: **"Milestone [X] Complete. Ready for Archivist."**

---

## ⏭ Final Handover


**Standard Path:**
Inform the user: *"Evaluation complete. Task [Passed/Failed]. [Log created/Plan updated]. Ready for next task or Archivist cleanup."*

**Debug Mode Path:**
Inform the user: *"Build error detected. Debug Mode activated. Fix instruction ready for Coder."*

## 📝 Post-Execution Logging (Mandatory)

### Template for Log Entry (`_DOCS/LOGS/YYYY-MM-DD.md`):

```md
## [TIME] — Audit: [Task Name]

### 🏗 Build & Integrity
- **Build Status**: [SUCCESS / FAILED]
- **Structure Update**: [Synced / No Change]

### 🚨 Critical Failure Context (If Build Failed)
> **[Planner Attention Required / Debug Mode Activated]**:
```text
[PASTE EXACT TERMINAL ERROR OUTPUT HERE]
[Include file path, line number, and error message]
```

**Resolution Path**: [ESCALATED_TO_PLANNER / DEBUG_MODE_ACTIVATED / FIX_INSTRUCTION_ISSUED]

### End of Skill Definition
