import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export function createSupabaseAnonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAnon = createSupabaseAnonClient();

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function verifySupabaseToken(token: string) {
  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
