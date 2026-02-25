# Daily Standup AI - Application Services

## Overview
As a client-side React application built with Vite, this project uses modular services to handle external integrations (AI and Database) rather than Next.js Server Actions.

## 1. Gemini Service (`geminiService.ts`)
Handles communication with Google's Generative AI.

### Logic:
- **`generateStandup`**: Takes user input, yesterday's context, and active tickets. It uses a structured prompt to ensure the output matches the required "Yesterday/Today/Blockers" format.
- **`refineStandup`**: Allows the user to provide natural language instructions (e.g., "make it shorter", "add that I fixed the bug") to modify the existing generated text.
- **Prompt Engineering**: Uses system instructions to enforce a professional tone and specific formatting (markdown).

## 2. Storage Service (`storageService.ts`)
The abstraction layer for data persistence.

### Logic:
- **Local Persistence**: Uses `localStorage` for immediate saves. Key: `standup_history`, `jira_tickets`.
- **Cloud Integration**: Uses the `supabaseClient` to sync data when requested or during specific triggers.
- **Reconciliation**: When syncing, it compares local timestamps with cloud timestamps to ensure data integrity.

### Methods:
- `getHistory()` / `saveEntry()` / `deleteEntry()`
- `getTickets()` / `saveTicket()` / `deleteTicket()`
- `syncLocalToCloud()`: Performs a bulk upsert to Supabase.

## 3. Supabase Client (`supabaseClient.ts`)
Standard Supabase JS client initialization using environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Data Handling
- **UUIDs**: Generated on the client using the `uuid` library to ensure unique IDs across local and cloud environments.
- **Dates**: Stored as ISO strings (`new Date().toISOString()`).
- **Security**: The Gemini API key is stored in `localStorage` (via `ApiKeySettings.tsx`) and passed to the generation service; it is never hardcoded.
