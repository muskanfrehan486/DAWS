import "dotenv/config";

function getEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL?.trim() || undefined,
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  PORT: (process.env.PORT || "3000").trim(),
  NODE_ENV: (process.env.NODE_ENV || "development").trim(),
} as const;
