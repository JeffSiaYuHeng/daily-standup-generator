import { createClient } from '@supabase/supabase-js';
import { config } from '../supabaseConfig';

// Helper to get dynamic config from Browser Local Storage
const getStoredConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('supabase_settings');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Failed to parse stored supabase config");
      return null;
    }
  }
  return null;
};

const stored = getStoredConfig();

// URL: User Input (Storage) > Static Config (Default) > Fallback
const supabaseUrl = stored?.url || config.supabaseUrl || "https://placeholder.supabase.co";

// Key: MUST come from User Input (Storage). 
// We no longer read from static config to ensure security.
const supabaseAnonKey = stored?.key || "placeholder";

// Initialize client
// Note: If key is "placeholder", requests will fail, but the app won't crash.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Status check used by the app to toggle between Local and Cloud modes
export const isSupabaseConfigured = () => {
  if (!supabaseAnonKey || supabaseAnonKey === "placeholder") {
    return false;
  }
  // Basic validation to ensure it's a real JWT-like string
  return supabaseAnonKey.length > 20;
};
