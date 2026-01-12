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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_standups_date ON public.standups(date DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_key ON public.jira_tickets(ticket_key);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jira_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Enable all access for authenticated users" ON public.standups
  FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.jira_tickets
  FOR ALL USING (true);