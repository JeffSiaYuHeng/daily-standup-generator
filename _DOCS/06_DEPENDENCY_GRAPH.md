# Dependency Graph

**AUTO-GENERATED** by `scripts/generate-dependency-graph.js`
**DO NOT EDIT MANUALLY** - Regenerate with: `npm run gen:graph`
**Last Updated:** 02/25/2026, 17:36

---

## Purpose

This file maps import/export relationships across the codebase.
**Critical for Planner**: Before modifying a file, check if it's imported by others.
If a file has many importers, changes may require updating Reference Scope or Context Scope.

---

## Statistics

- **Total Files Analyzed**: 7
- **Total Dependencies**: 15
- **Average Dependencies per File**: 2.1

---

## High-Impact Files (Top 20)

These files are imported by many others. Modifying them requires careful impact analysis.


### `components/ui/Button.tsx`
- **Impact Level**: HIGH
- **Imported By**: 6 file(s)
- **Key Importers**:
  - `components/ApiKeySettings.tsx`
  - `components/HistorySidebar.tsx`
  - `components/InstallPrompt.tsx`
  - `components/JiraTicketManager.tsx`
  - `components/StandupInput.tsx`
  - *...and 1 more*


### `types.ts`
- **Impact Level**: HIGH
- **Imported By**: 3 file(s)
- **Key Importers**:
  - `components/HistorySidebar.tsx`
  - `components/JiraTicketManager.tsx`
  - `components/StandupInput.tsx`



### `components/ui/Skeleton.tsx`
- **Impact Level**: HIGH
- **Imported By**: 2 file(s)
- **Key Importers**:
  - `components/HistorySidebar.tsx`
  - `components/StandupOutput.tsx`



### `services/storageService.ts`
- **Impact Level**: HIGH
- **Imported By**: 1 file(s)
- **Key Importers**:
  - `components/ApiKeySettings.tsx`



### `services/supabaseClient.ts`
- **Impact Level**: HIGH
- **Imported By**: 1 file(s)
- **Key Importers**:
  - `components/HistorySidebar.tsx`



### `context/ToastContext.tsx`
- **Impact Level**: HIGH
- **Imported By**: 1 file(s)
- **Key Importers**:
  - `components/StandupOutput.tsx`



### `components/ui/Toast.tsx`
- **Impact Level**: HIGH
- **Imported By**: 1 file(s)
- **Key Importers**:
  - `context/ToastContext.tsx`



---

## Full Dependency Map

<details>
<summary>Click to expand complete dependency graph (JSON format)</summary>

```json
{
  "components/ApiKeySettings.tsx": [
    "components/ui/Button.tsx",
    "services/storageService.ts"
  ],
  "components/HistorySidebar.tsx": [
    "types.ts",
    "services/supabaseClient.ts",
    "components/ui/Skeleton.tsx",
    "components/ui/Button.tsx"
  ],
  "components/InstallPrompt.tsx": [
    "components/ui/Button.tsx"
  ],
  "components/JiraTicketManager.tsx": [
    "types.ts",
    "components/ui/Button.tsx"
  ],
  "components/StandupInput.tsx": [
    "types.ts",
    "components/ui/Button.tsx"
  ],
  "components/StandupOutput.tsx": [
    "components/ui/Button.tsx",
    "context/ToastContext.tsx",
    "components/ui/Skeleton.tsx"
  ],
  "context/ToastContext.tsx": [
    "components/ui/Toast.tsx"
  ]
}
```

</details>

---

## Reverse Dependency Map

<details>
<summary>Click to expand reverse dependencies (which files import what)</summary>

```json
{
  "components/ui/Button.tsx": [
    "components/ApiKeySettings.tsx",
    "components/HistorySidebar.tsx",
    "components/InstallPrompt.tsx",
    "components/JiraTicketManager.tsx",
    "components/StandupInput.tsx",
    "components/StandupOutput.tsx"
  ],
  "services/storageService.ts": [
    "components/ApiKeySettings.tsx"
  ],
  "types.ts": [
    "components/HistorySidebar.tsx",
    "components/JiraTicketManager.tsx",
    "components/StandupInput.tsx"
  ],
  "services/supabaseClient.ts": [
    "components/HistorySidebar.tsx"
  ],
  "components/ui/Skeleton.tsx": [
    "components/HistorySidebar.tsx",
    "components/StandupOutput.tsx"
  ],
  "context/ToastContext.tsx": [
    "components/StandupOutput.tsx"
  ],
  "components/ui/Toast.tsx": [
    "context/ToastContext.tsx"
  ]
}
```

</details>

---

## How Planner Should Use This

### Before Creating Context Scope:

1. **Read this file** to understand the file's position in the dependency tree
2. **Check "High-Impact Files"** section first
3. **If modifying a high-impact file**:
   - Add key importers to **Reference Scope** (read-only)
   - OR add to **Context Scope** if they also need changes
   - Document potential side-effects in instruction

### Example Decision Flow:

```
Task: Modify lib/utils/validation.ts

Step 1: Check 06_DEPENDENCY_GRAPH.md
Step 2: Find validation.ts is imported by 12 files
Step 3: Identify top 3 importers:
  - app/auth/login/page.tsx
  - components/forms/UserForm.tsx
  - lib/actions/user-actions.ts

Step 4: Add to _INSTRUCTION.md:
  Context Scope:
    - lib/utils/validation.ts

  Reference Scope:
    - app/auth/login/page.tsx (uses validateEmail)
    - components/forms/UserForm.tsx (uses validatePassword)
```

---

## Maintenance

- **Update**: Run `npm run gen:graph` before planning sessions
- **Tool**: Uses madge (install: `npm install -g madge`) or built-in analyzer
- **Directories Analyzed**: app, components, lib, utils, hooks, context
- **File Types**: .ts, .tsx, .js, .jsx

---

## Integration with Evaluator

The Evaluator should verify:
- If a Context Scope file is high-impact, did the Coder test affected importers?
- Are breaking changes properly documented in 03_SERVER_ACTIONS.md?
