import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side role check used to hide/disable privileged admin controls.
 * Server functions enforce the same rule — this is UX, not the security boundary.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading: isAdmin === null };
}
