import { createClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";
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

// Cached JWKS fetcher: keys are fetched once and reused, so verifying a
// token normally does not require any network call (only a rare
// background refresh when the key set rotates or the cache expires).
const jwks = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export async function verifySupabaseToken(
  token: string
): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    });

    if (!payload.sub) {
      return null;
    }

    return { id: payload.sub };
  } catch {
    return null;
  }
}
