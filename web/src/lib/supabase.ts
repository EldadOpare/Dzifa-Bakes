import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// A value still wrapped in [brackets] is an unfilled placeholder from .env.example, not a real one.
const isPlaceholder = (value: string | undefined): boolean => !value || (value.startsWith('[') && value.endsWith(']'));

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Stays null until VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are set, so the
// public storefront still works even before staff login is configured.
export const supabase: SupabaseClient | null =
  !isPlaceholder(url) && !isPlaceholder(anonKey) ? createClient(url, anonKey) : null;

if (!supabase) {
  console.warn('Supabase auth is not configured yet: staff login will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// The API needs the same session token on staff-only requests, so it can
// tell a logged-in staff member from anyone else calling the API directly.
setAuthTokenGetter(async () => (await supabase?.auth.getSession())?.data.session?.access_token ?? null);
