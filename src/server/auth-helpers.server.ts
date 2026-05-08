import type { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuthenticatedAccessTokenUser = {
  userId: string;
  email: string | null;
  user: User;
};

export async function getUserFromAccessToken(
  access_token?: string | null,
): Promise<AuthenticatedAccessTokenUser | null> {
  const token = typeof access_token === "string" ? access_token.trim() : "";
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    const user = data?.user;

    if (error || !user?.id) return null;

    return {
      userId: user.id,
      email: user.email ?? null,
      user,
    };
  } catch {
    return null;
  }
}