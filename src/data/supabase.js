// Supabase client.
// Reads from environment variables so the anon key isn't hardcoded.
// In Vite, env vars must be prefixed with VITE_ to be exposed to the browser.
//
// Local dev:    set them in .env.local at the project root
// Vercel:       set them in the Vercel dashboard (Settings -> Environment Variables)

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    'ChurchHub: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
      'Falling back to local seed data only. Set them in .env.local (dev) or Vercel env vars (prod).'
  );
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isSupabaseConfigured = Boolean(supabase);
