import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, options).catch(error => {
        // Add more context to fetch errors
        if (error.message?.includes('fetch')) {
          throw new Error(
            'Unable to connect to the database service. Please ensure the local Supabase server is running.',
          );
        }
        throw error;
      });
    },
  },
});
