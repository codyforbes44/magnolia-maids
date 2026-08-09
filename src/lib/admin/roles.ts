import type { SupabaseClient } from "@supabase/supabase-js";

/** Roles allowed to make changes in the admin control center. */
export const WRITE_ROLES = ["admin"] as const;

/**
 * Server-side guard: throws unless the signed-in user holds an admin role.
 * Runs through the caller's RLS-scoped client — never the service role.
 */
export async function assertAdmin(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Error("Forbidden: this action requires an admin role.");
  }
}
