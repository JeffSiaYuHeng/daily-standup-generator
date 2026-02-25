# Daily Standup AI - Database Schema

## Overview
The application uses a hybrid storage approach. By default, data is stored in `localStorage` for privacy and offline capability. Users can optionally sync their data to a Supabase PostgreSQL database for cross-device access.

## Schema Diagram (Supabase)

```
standups (Table)
  - id (UUID, PK)
  - date (TIMESTAMPTZ)
  - raw_input (TEXT)
  - generated_output (TEXT)
  - consistency_notes (JSONB)
  - created_at (TIMESTAMPTZ)

jira_tickets (Table)
  - id (UUID, PK)
  - ticket_key (TEXT, UNIQUE)
  - title (TEXT)
  - status (TEXT)
  - link (TEXT)
  - updated_at (TIMESTAMPTZ)
```

## Tables

### standups
Stores the generated standup entries.

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | Primary key, defaults to `gen_random_uuid()` |
| `date` | TIMESTAMPTZ | The date the standup refers to |
| `raw_input` | TEXT | The raw notes or transcript provided by the user |
| `generated_output` | TEXT | The final AI-generated standup text |
| `consistency_notes` | JSONB | Array of strings highlighting potential gaps (e.g., missing tickets) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### jira_tickets
Stores the user's active Jira tickets for context.

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `ticket_key` | TEXT | Jira key (e.g., PROJ-123), unique |
| `title` | TEXT | Ticket title |
| `status` | TEXT | Ticket status (To Do, In Progress, etc.) |
| `link` | TEXT | Optional URL to the ticket |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Storage Strategy

1. **Local First**: All write operations first go to `localStorage`.
2. **Cloud Sync**: The `syncLocalToCloud` service function reconciles local data with Supabase.
3. **RLS (Row Level Security)**: Both tables have RLS enabled. Currently, policies allow access for authenticated sessions.

## SQL Definition

```sql
-- Create standups table
CREATE TABLE IF NOT EXISTS public.standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_input TEXT NOT NULL,
  generated_output TEXT NOT NULL,
  consistency_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jira_tickets table
CREATE TABLE IF NOT EXISTS public.jira_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  link TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_standups_date ON public.standups(date DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_key ON public.jira_tickets(ticket_key);
```
