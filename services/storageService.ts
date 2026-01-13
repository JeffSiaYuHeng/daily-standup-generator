
import { StandupEntry, JiraTicket } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE_NAME = 'standups';
const TICKETS_TABLE = 'jira_tickets';
const LOCAL_STORAGE_KEY = 'standup_history_local_v1';
const TICKETS_STORAGE_KEY = 'jira_tickets_local_v1';
const GEMINI_API_KEY_STORAGE = 'GEMINI_API_KEY';

// Robust check to avoid calling API with known bad credentials
export const isClientReady = () => {
  return isSupabaseConfigured();
};

// --- Gemini API Key Helpers ---
export const getGeminiApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    return key ? key.trim() : null;
  } catch (e) {
    console.warn("Failed to retrieve Gemini API key from localStorage");
    return null;
  }
};

export const saveGeminiApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') return;
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("API key cannot be empty");
  }
  localStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed);
};

export const removeGeminiApiKey = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_API_KEY_STORAGE);
};

// --- Mappers for Standups ---
const mapRowToEntry = (row: any): StandupEntry => ({
  id: row.id,
  date: row.date,
  rawInput: row.raw_input,
  generatedOutput: row.generated_output,
  consistencyNotes: row.consistency_notes || []
});

const mapEntryToRow = (entry: StandupEntry) => ({
  id: entry.id,
  date: entry.date,
  raw_input: entry.rawInput,
  generated_output: entry.generatedOutput,
  consistency_notes: entry.consistencyNotes
});

// --- Mappers for Tickets ---
const mapRowToTicket = (row: any): JiraTicket => ({
  id: row.id,
  ticketKey: row.ticket_key,
  title: row.title,
  status: row.status,
  link: row.link,
  updatedAt: row.updated_at
});

const mapTicketToRow = (ticket: JiraTicket) => ({
  id: ticket.id,
  ticket_key: ticket.ticketKey,
  title: ticket.title,
  status: ticket.status,
  link: ticket.link,
  updated_at: new Date().toISOString()
});

// --- Local Storage Helpers ---
const getLocalHistory = (): StandupEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    const history = item ? JSON.parse(item) : [];
    // Always return sorted for safety
    return history.sort((a: StandupEntry, b: StandupEntry) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (e) {
    console.warn("LocalStorage error:", e);
    return [];
  }
};

const saveLocalHistory = (history: StandupEntry[]) => {
  if (typeof window === 'undefined') return;
  // Sort before saving
  const sorted = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
};

const getLocalTickets = (): JiraTicket[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(TICKETS_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.warn("LocalStorage error:", e);
    return [];
  }
};

const saveLocalTickets = (tickets: JiraTicket[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
};

// --- Service Methods (Standups) ---

export const getHistory = async (): Promise<StandupEntry[]> => {
  if (!isClientReady()) {
    return getLocalHistory();
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      handleSupabaseError(error, "fetching history");
      return getLocalHistory(); // Fallback if cloud fails
    }

    return (data || []).map(mapRowToEntry);
  } catch (err) {
    console.error("Unexpected error in getHistory:", err);
    return getLocalHistory();
  }
};

export const saveEntry = async (entry: StandupEntry): Promise<StandupEntry[]> => {
  if (!isClientReady()) {
    const current = getLocalHistory();
    const updated = [entry, ...current];
    saveLocalHistory(updated);
    return getLocalHistory();
  }

  const dbEntry = mapEntryToRow(entry);

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert([dbEntry]);

  if (error) {
    handleSupabaseError(error, "saving entry");
    throw new Error(`Database Error: ${error.message}`);
  }

  return getHistory();
};

export const updateEntry = async (entry: StandupEntry): Promise<StandupEntry[]> => {
  if (!isClientReady()) {
    const current = getLocalHistory();
    const updated = current.map(item => item.id === entry.id ? entry : item);
    saveLocalHistory(updated);
    return getLocalHistory();
  }

  const dbEntry = {
    raw_input: entry.rawInput,
    generated_output: entry.generatedOutput,
    consistency_notes: entry.consistencyNotes,
    date: entry.date
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(dbEntry)
    .eq('id', entry.id);

  if (error) {
    handleSupabaseError(error, "updating entry");
    throw new Error(`Database Error: ${error.message}`);
  }

  return getHistory();
};

export const deleteEntry = async (id: string): Promise<StandupEntry[]> => {
  if (!isClientReady()) {
    const current = getLocalHistory();
    const updated = current.filter(item => item.id !== id);
    saveLocalHistory(updated);
    return getLocalHistory();
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error, "deleting entry");
    throw new Error(`Database Error: ${error.message}`);
  }

  return getHistory();
};

export const getLatestEntry = async (): Promise<StandupEntry | null> => {
  if (!isClientReady()) {
    const current = getLocalHistory();
    return current.length > 0 ? current[0] : null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    handleSupabaseError(error, "fetching latest entry");
    // Fallback to local latest if cloud error
    const local = getLocalHistory();
    return local.length > 0 ? local[0] : null;
  }

  return data ? mapRowToEntry(data) : null;
};

// --- Service Methods (Jira Tickets) ---

export const getTickets = async (): Promise<JiraTicket[]> => {
  if (!isClientReady()) {
    return getLocalTickets();
  }

  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        console.warn("Jira Tickets table not found. Please run SQL migration.");
        return getLocalTickets();
      }
      handleSupabaseError(error, "fetching tickets");
      return getLocalTickets();
    }
    return (data || []).map(mapRowToTicket);
  } catch (err) {
    return getLocalTickets();
  }
};

export const saveTicket = async (ticket: JiraTicket): Promise<JiraTicket[]> => {
  if (!isClientReady()) {
    const current = getLocalTickets();
    const exists = current.find(t => t.id === ticket.id);
    let updated;
    if (exists) {
      updated = current.map(t => t.id === ticket.id ? ticket : t);
    } else {
      updated = [ticket, ...current];
    }
    saveLocalTickets(updated);
    return getLocalTickets();
  }

  const dbRow = mapTicketToRow(ticket);
  const { error } = await supabase
    .from(TICKETS_TABLE)
    .upsert(dbRow, { onConflict: 'id' });

  if (error) {
    handleSupabaseError(error, "saving ticket");
    throw new Error(error.message);
  }

  return getTickets();
};

export const deleteTicket = async (id: string): Promise<JiraTicket[]> => {
  if (!isClientReady()) {
    const current = getLocalTickets();
    const updated = current.filter(t => t.id !== id);
    saveLocalTickets(updated);
    return getLocalTickets();
  }

  const { error } = await supabase
    .from(TICKETS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    handleSupabaseError(error, "deleting ticket");
    throw new Error(error.message);
  }
  
  return getTickets();
};


/**
 * Sync Logic
 */
export const syncLocalToCloud = async (): Promise<StandupEntry[]> => {
  if (!isClientReady()) {
    throw new Error("Cannot sync: Supabase API Key is missing.");
  }

  // 1. Sync Standups
  const localHistory = getLocalHistory();
  if (localHistory.length > 0) {
    const rowsToUpsert = localHistory.map(mapEntryToRow);
    const { error: upsertError } = await supabase.from(TABLE_NAME).upsert(rowsToUpsert, { onConflict: 'id' });
    if (!upsertError && typeof window !== 'undefined') {
       // Only remove local after successful cloud save
       localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  // 2. Sync Tickets (Best effort)
  const localTickets = getLocalTickets();
  if (localTickets.length > 0) {
    const ticketsToUpsert = localTickets.map(mapTicketToRow);
    const { error: ticketError } = await supabase.from(TICKETS_TABLE).upsert(ticketsToUpsert, { onConflict: 'id' });
    if (!ticketError && typeof window !== 'undefined') {
       localStorage.removeItem(TICKETS_STORAGE_KEY);
    }
  }

  return getHistory();
};

/**
 * Centralized error logging
 */
function handleSupabaseError(error: any, context: string) {
  const code = error.code;
  if (code === '42P01') {
    console.warn(`[Database] Table missing for ${context}. Run SQL migration.`);
  } else if (code === 'PGRST301') {
    console.error(`[Database Error] Invalid API Key.`);
  } else {
    console.error(`[Database Error] Error ${context}:`, error);
  }
}
