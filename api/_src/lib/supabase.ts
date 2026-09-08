import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// A value still wrapped in [brackets] is an unfilled placeholder from .env.example, not a real one.
export const isPlaceholder = (value: string | undefined): boolean => !value || (value.startsWith("[") && value.endsWith("]"));

const url = process.env["VITE_SUPABASE_URL"];
const anonKey = process.env["VITE_SUPABASE_ANON_KEY"];

// Stays null until Supabase auth env vars are set, so the API keeps working
// (unprotected) rather than crashing before staff login is configured.
export const supabase: SupabaseClient | null =
  !isPlaceholder(url) && !isPlaceholder(anonKey) ? createClient(url!, anonKey!) : null;
