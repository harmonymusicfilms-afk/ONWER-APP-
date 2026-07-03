import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export const STORAGE_BUCKETS = {
  LOGOS: 'shop-logos',
  STAFF: 'staff-photos',
  GALLERY: 'gallery',
  PROFILES: 'profiles'
} as const;

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const sb = getSupabase();
  const { data, error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true
  });
  if (error) throw error;
  
  const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
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

/**
 * Verify Supabase connection and schema
 */
export const verifyConnection = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase connection skipped: Keys are missing in environment.');
    return false;
  }
  
  try {
    const sb = getSupabase();
    
    // Check session/auth
    const { error: authError } = await sb.auth.getSession();
    if (authError) throw authError;
    
    // Check profiles table (most common starting point)
    const { error: profileError } = await sb.from('profiles').select('id').limit(1);
    
    // If it's a 404 (PGRST116 or similar), it might just mean no rows or table doesn't exist yet
    // but if we get a response, the connection is alive
    if (profileError && profileError.code !== 'PGRST116') {
       console.warn('⚡ Supabase connected but profiles table check returned:', profileError.message);
    } else {
       console.log('✅ Supabase connection verified successfully!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Run verification in the background
if (typeof window !== 'undefined') {
  verifyConnection().catch(console.error);
}
