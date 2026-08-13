import { env } from "../lib/env";
import type { EmailProviderName } from "./types";

export type EmailConfig = {
  enabled: boolean;
  provider: EmailProviderName;
  from: string;
  frontendUrl: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
};

export function getEmailConfig(): EmailConfig {
  return {
    enabled: env.EMAIL_ENABLED,
    provider: env.EMAIL_PROVIDER,
    from: env.EMAIL_FROM,
    frontendUrl: env.FRONTEND_URL,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  };
}
