import "dotenv/config";

function getEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

function getBooleanEnv(key: string, fallback = false): boolean {
  const value = process.env[key]?.trim().toLowerCase();
  if (!value) {
    return fallback;
  }

  return value === "true" || value === "1" || value === "yes";
}

function getNumberEnv(key: string, fallback: number): number {
  const value = process.env[key]?.trim();
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL?.trim() || undefined,
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  PORT: (process.env.PORT || "3000").trim(),
  NODE_ENV: (process.env.NODE_ENV || "development").trim(),
  EMAIL_ENABLED: getBooleanEnv("EMAIL_ENABLED", false),
  EMAIL_PROVIDER: (getOptionalEnv("EMAIL_PROVIDER", "noop") as
    | "smtp"
    | "noop"
    | "resend"
    | "microsoft"),
  EMAIL_FROM: getOptionalEnv("EMAIL_FROM", "DocFlow <no-reply@example.com>"),
  FRONTEND_URL: getOptionalEnv("FRONTEND_URL", "http://localhost:5173"),
  SMTP_HOST: getOptionalEnv("SMTP_HOST", "smtp.gmail.com"),
  SMTP_PORT: getNumberEnv("SMTP_PORT", 587),
  SMTP_SECURE: getBooleanEnv("SMTP_SECURE", false),
  SMTP_USER: getOptionalEnv("SMTP_USER"),
  SMTP_PASS: getOptionalEnv("SMTP_PASS"),
} as const;
