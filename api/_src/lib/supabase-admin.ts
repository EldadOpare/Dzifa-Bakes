import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isPlaceholder } from "./supabase";

const url = process.env["VITE_SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

// The service role key bypasses storage permissions entirely, so it never
// leaves the server. Used only to write uploaded photos into the bucket.
export const supabaseAdmin: SupabaseClient | null =
  !isPlaceholder(url) && !isPlaceholder(serviceRoleKey) ? createClient(url!, serviceRoleKey!) : null;
