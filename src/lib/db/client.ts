import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type Db = SupabaseClient<Database>;

let db: Db | undefined;

/** Server-side client with the secret key. RLS blocks the public API, so all reads and writes go through here. */
export function getDb(): Db {
  if (!db) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
    db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return db;
}
