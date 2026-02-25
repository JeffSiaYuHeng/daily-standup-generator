# Dependency Graph

**AUTO-GENERATED** by `scripts/generate-dependency-graph.js`
**DO NOT EDIT MANUALLY** - Regenerate with: `npm run gen:graph`
**Last Updated:** 2/25/2026

---

## Purpose

This file maps import/export relationships across the codebase.
**Critical for Planner**: Before modifying a file, check if it's imported by others.

---

## Statistics

- **Total Files Analyzed**: 15
- **High Complexity Files**: `App.tsx`
- **Core Services**: `storageService.ts`, `geminiService.ts`

---

## High-Impact Files

1. `types.ts`: Imported by almost all components and services.
2. `services/storageService.ts`: Core data layer used by `App.tsx`.
3. `services/supabaseClient.ts`: Used by `storageService.ts`.
4. `components/ui/*`: Reusable UI primitives.

---

## Maintenance

- **Update**: Run `npm run gen:graph` before planning sessions.
- **Directories Analyzed**: components, services, utils, context.
- **File Types**: .ts, .tsx.
