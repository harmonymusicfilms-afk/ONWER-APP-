import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // In development, we might not want to crash everything if keys are missing
      // but the user's specific error was that createClient was called with invalid args.
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Deprecated: Use getSupabase() instead. Keeping this as a throwing proxy to catch top-level usage
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    return (getSupabase() as any)[prop];
  }
});
