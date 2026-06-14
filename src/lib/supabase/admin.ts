import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/** サーバー専用（Storage アップロード等） */
export function createAdminClient() {
  try {
    return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  }
}
