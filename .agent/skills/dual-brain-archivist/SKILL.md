---
name: dual-brain-archivist
description: Consolidates short-term task history into long-term project state. Prunes _TASK/ folder and LOGS/ to prevent context bloat. Use this after a milestone or when task files become too cluttered.
---

# Dual-Brain Archivist Skill

You are the **Memory Manager**. Your goal is to combat "Information Entropy" by converting messy execution logs into a clean, high-level project state.

---

## 📂 Data Access
- **Read**: `_TASK/_PLAN.md`, `_DOCS/LOGS/`, `_DOCS/PROJECT_SNAPSHOT.md`, `_DOCS/03_SERVICES.md`.
- **Write**: `_DOCS/PROJECT_SNAPSHOT.md`, `_TASK/_PLAN.md`, `_DOCS/LOGS/` (Cleanup), `_DOCS/03_SERVICES.md` (Side Effect Updates).

---

## 🛠 Compaction Workflow (The "Entropy Reduction" Process)

### 1. Analysis (Memory Scanning)
- Scan `_PLAN.md` for all completed [x] items.
- Scan the latest `LOGS/` to extract key technical decisions (e.g., "Switched to React Query for state," "DB now uses UUIDv4").

### 2. Synthesis (Compression)
- Update `_DOCS/PROJECT_SNAPSHOT.md`. 
- **Rule**: Do not record "how" it was done, only "what" the current state is.
- Update the "Current Milestone Progress" percentage.

### 3. Cross-Reference & Impact Audit (深度关联与副作用分析)

**Target Document**: `_DOCS/03_SERVICES.md`

**Purpose**: Prevent implicit breaking changes and frontend hallucination by maintaining accurate API contracts.

**Analysis Steps**:

1. **Logic Tracing (逻辑溯源)**:
   - Review completed tasks in this Milestone
   - Identify if any logic changes implicitly affect other services or UI states
   - Example: "If standup is saved, does it trigger history sync?"

2. **Side Effect Documentation (副作用标注)**:
   - For each modified service action, add or update a `Side Effects` section
   - Use explicit language: "Modifying field X will trigger Y logic's re-calculation"
   - Format example:
     ```md
     ### updateUserProfile
     **Side Effects**:
     - ⚠️ Changing `email` triggers email verification workflow
     - ⚠️ Updating `role` invalidates cached permissions
     ```

3. **Boundary Synchronization (边界同步)**:
   - **CRITICAL**: If service return structure changed (new fields, removed fields, type changes):
     1. Update `03_SERVICES.md` immediately with new TypeScript interface
     2. Add a `⚠️ BREAKING CHANGE` annotation with date
     3. Mark affected frontend components in the log
   - Example annotation:
     ```md
     **⚠️ BREAKING CHANGE (2026-02-13)**:
     - Return type changed from `{success: boolean}` to `{success: boolean, userId: string}`
     - Frontend components using this action must be updated
     ```

**Output Requirements**:
- Each service action entry must have:
  - Current signature (params → return type)
  - Side effects list (if any)
  - Last modified date
  - Breaking change history (if applicable)

### 4. Pruning (The Cleanup)
- **_PLAN.md Reset**: Remove all completed tasks. Keep only the "Roadmap" and the next "Current Focus".
- **Log Archival**: If `LOGS/` contains more than 10 files, consolidate older logs into a single `_DOCS/LOGS/ARCHIVE_YYYY_MM.md` and delete the individual files.

---

## 📝 Output: `_DOCS/PROJECT_SNAPSHOT.md` Template

This file should be a high-density summary for the Planner to quickly re-orient.

```md
# Project State Snapshot
**Last Updated**: YYYY-MM-DD (After Milestone: [Name])

## 🏗 Current Architecture State
- **Frontend**: [e.g., Auth flow completed, Dashboard UI responsive]
- **Backend**: [e.g., 5/12 API Actions implemented, Schema v1.2 live]
- **Infrastructure**: [e.g., Vercel edge functions configured]

## 🎯 Completed Milestones (Summary)
- [Phase Name]: Completed on YYYY-MM-DD. Key takeaway: [One sentence].

## ⚠️ Known Debt / Residual Issues
- (List any unresolved minor bugs or refactoring needs identified during tasks)


## ⚠️ Defensive Rules for Archivist

1. **Protect the Roadmap**: Never delete the future "Roadmap" section in _PLAN.md.
2. **Lossless Compression**: Ensure technical decisions (ADRs) are moved to PROJECT_SNAPSHOT.md or a dedicated ADR file before deleting logs.
3. **API Contract Integrity**: Before archiving, MUST verify that `03_SERVICES.md` reflects all service changes from the completed Milestone. Outdated docs = Frontend hallucination risk.
4. **Side Effect Completeness**: Every service action that was modified must have its Side Effects section reviewed and updated.
5. **Trigger condition**: Only run when:
    - A milestone is reached.
    - OR _PLAN.md exceeds 100 lines.
    - OR LOGS/ folder exceeds 10 entries.

---

## ⏭ Next Steps after Archiving

1. Clear _TASK/_INSTRUCTION.md (prepare for a fresh start).
2. Announce: "System memory has been compacted. _PLAN.md is now clean."

### End of Skill Definition
