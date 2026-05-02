import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
};

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    loading: true,
    userId: null,
    email: null,
    isAdmin: false,
  });

  useEffect(() => {
    let mounted = true;

    const checkRole = async (userId: string | null, email: string | null) => {
      if (!userId) {
        if (mounted) setState({ loading: false, userId: null, email: null, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) {
        setState({ loading: false, userId, email, isAdmin: !!data });
      }
    };

    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // defer the role check to avoid deadlock
      setTimeout(() => {
        checkRole(session?.user?.id ?? null, session?.user?.email ?? null);
      }, 0);
    });

    // Then read existing session
    supabase.auth.getSession().then(({ data }) => {
      checkRole(data.session?.user?.id ?? null, data.session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
