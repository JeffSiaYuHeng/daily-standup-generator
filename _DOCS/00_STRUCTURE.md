# Daily Standup AI - Project Structure

**AUTO-GENERATED** by `scripts/generate-structure.cjs`  
**DO NOT EDIT MANUALLY** - This file is regenerated before each planning session.  
**Last Updated:** 2/25/2026 Wednesday

---

## Overview
Daily Standup AI is a web application designed to help software engineers generate high-quality daily standup updates. It takes raw, unstructured notes (text or voice) and transforms them into professional, team-ready status updates using Google Gemini AI.

## Directory Structure

```
daily-standup-generator/
├── App.tsx
├── index.tsx
├── types.ts
├── database.sql
├── vite.config.ts
├── package.json
├── tsconfig.json
├── index.html
├── _DOCS/
│   └── LOGS/
│       ├── 2026-02-06.md
│       ├── 2026-02-07.md
│       ├── LOG(format).md
│   └── 00_STRUCTURE.md
│   └── 01_DB_SCHEMA.md
│   └── 02_STYLE_GUIDE.md
│   └── 03_SERVER_ACTIONS.md
│   └── 03_SERVICES.md
│   └── 04_TECH_STACK.md
│   └── 05_PROJECT_SNAPSHOT.md
│   └── 06_DEPENDENCY_GRAPH.md
│   └── PROJECT_SNAPSHOT.md
├── _TASK/
│   └── _INSTRUCTION.md
│   └── _INSTRUCTION(Sample).md
│   └── _PLAN.md
│   └── _PLAN(Sample).md
│   └── _RESULT.md
├── .agent/
│   └── skills/
│       └── dual-brain-archivist/
│           ├── SKILL.md
│       └── dual-brain-coder/
│           ├── SKILL.md
│       └── dual-brain-evaluator/
│           ├── SKILL.md
│       └── dual-brain-planner/
│           └── SKILL.md
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Skeleton.tsx
│       ├── Toast.tsx
│   └── ApiKeySettings.tsx
│   └── HistorySidebar.tsx
│   └── InstallPrompt.tsx
│   └── JiraTicketManager.tsx
│   └── StandupInput.tsx
│   └── StandupOutput.tsx
├── context/
│   └── ToastContext.tsx
├── services/
│   └── geminiService.ts
│   └── storageService.ts
│   └── supabaseClient.ts
├── public/
│   └── icons/
│       ├── android-chrome-192x192.png
│       ├── android-chrome-512x512.png
│       ├── apple-touch-icon.png
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── favicon.ico
│       ├── Logo.png
│       ├── site.webmanifest
│   └── manifest.json
│   └── service-worker.js
├── utils/
│   └── dateFormatter.ts
└── scripts/
    └── generate-dependency-graph.js
    └── generate-structure.cjs
    └── generate-structure.js
```

## Core Features

### 1. Standup Generation
- **Raw Input**: Accepts free-form text or voice input (via Web Speech API).
- **AI Processing**: Uses Google Gemini 1.5/2.0 to structure the input into "Yesterday", "Today", and "Blockers".
- **Context Awareness**: Can reference yesterday's standup or specific Jira tickets to improve accuracy.
- **Refinement**: Allows iterative refinement of the generated output via follow-up AI instructions.

### 2. Jira Ticket Management
- Track active tickets (In Progress, Todo, etc.).
- Easily select tickets to include in the current standup context.
- Keep a local/synced list of ticket keys and titles.

### 3. History & Persistence
- Automatically saves generated standups to local storage.
- Optional Cloud Sync with Supabase for cross-device access.
- Sidebar for browsing and reloading previous entries.

### 4. PWA Support
- Installable on desktop and mobile.
- Offline support via service workers.
- Add to Home Screen prompts.

## Component Architecture

- `App.tsx`: Central coordinator for state, view switching, and core logic.
- `StandupInput`: Handles the drafting phase (input field, ticket selection, mode toggles).
- `StandupOutput`: Displays the AI results, consistency notes, and refinement tools.
- `HistorySidebar`: Manages the list of past entries and sync controls.
- `JiraTicketManager`: Dedicated view for managing the user's ticket list.
- `ApiKeySettings`: Securely handles the Gemini API key storage.

## Data Flow

1. **Input**: User types notes or selects active Jira tickets.
2. **Context**: Optionally fetches the previous day's standup as reference.
3. **Generation**: Sends input + context to `geminiService` which prompts Gemini AI.
4. **Validation**: AI returns the standup plus "consistency notes" (e.g., forgotten tickets).
5. **Review**: User reviews, edits, or refines the output.
6. **Save**: Entry is persisted to local storage and/or Supabase.

## State Management

- **Local State**: Component-level state for UI toggles and form inputs.
- **App State**: Centralized in `App.tsx` (History, Tickets, Current Standup).
- **Persistence**: `storageService.ts` handles the abstraction between `localStorage` and Supabase.
- **Theme**: Dark/Light mode managed via Tailwind's `dark` class on the root element.

---

## Maintenance

- **Auto-generated:** Run `npm run gen:structure` or `node scripts/generate-structure.cjs`
- **Pre-planning hook:** This should run automatically before Planner agent execution
- **Ignored items:** node_modules, .git, dist, build, .turbo, coverage
- **Scanned directories:** _DOCS, _TASK, .agent, components, context, services, public, utils, scripts
