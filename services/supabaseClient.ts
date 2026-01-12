import { createClient } from '@supabase/supabase-js';

// Helper to get dynamic config from Browser Local Storage
const getStoredConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('supabase_settings');
      return stored ? JSON.parse(stored) : null;
    } catch {
      console.warn('Failed to parse stored supabase config');
      return null;
    }
  }
  return null;
};

const stored = getStoredConfig();

/**
 * Supabase URL
 * Must come from user input (Local Storage)
 */
const supabaseUrl =
  stored?.url || 'https://placeholder.supabase.co';

/**
 * Supabase Anon Key
 * MUST come from user input (Local Storage)
 */
const supabaseAnonKey =
  stored?.key || 'placeholder';

// Initialize client
// If not configured, requests will fail gracefully
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Used by the app to determine Local vs Cloud mode
 */
export const isSupabaseConfigured = () => {
  if (!stored) return false;
  if (!stored.url || !stored.key) return false;

  // Basic JWT-like length check
  return stored.key.length > 20;
};
