import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TeamMember = {
  userId: string;
  email: string;
  roles: string[];
  lastSignInAt: string | null;
  createdAt: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (roleErr) throw new Error(roleErr.message);

    const { data: userList, error: userErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (userErr) throw new Error(userErr.message);

    const byUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role as string);
      byUser.set(r.user_id, list);
    }

    return userList.users
      .map((u) => ({
        userId: u.id,
        email: u.email ?? "(no email)",
        roles: (byUser.get(u.id) ?? []).sort(),
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
      }))
      .sort((a, b) => Number(b.roles.length > 0) - Number(a.roles.length > 0) || a.email.localeCompare(b.email));
  });

const roleInput = z.object({
  email: z.string().trim().email().max(255),
  role: z.enum(["admin", "staff", "moderator", "user"]),
});

export const grantTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => roleInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userList, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);

    const target = userList.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );
    if (!target) {
      throw new Error(
        `No account found for ${data.email}. Ask them to sign up first, then grant access.`,
      );
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: target.id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);

    return { ok: true as const, userId: target.id };
  });

export const revokeTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "staff", "moderator", "user"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && data.role === "admin") {
      throw new Error("You can't remove your own admin access.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });