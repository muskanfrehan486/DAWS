import type { EmailConfig } from "./config";
import type { EmailProvider } from "./provider.interface";
import { NoopEmailProvider } from "./providers/noop.provider";
import { SmtpEmailProvider } from "./providers/smtp.provider";

export function createEmailProvider(config: EmailConfig): EmailProvider {
  if (!config.enabled || config.provider === "noop") {
    return new NoopEmailProvider();
  }

  switch (config.provider) {
    case "smtp":
      if (!config.smtp.user || !config.smtp.pass) {
        throw new Error(
          "SMTP_USER and SMTP_PASS are required when EMAIL_PROVIDER=smtp",
        );
      }
      return new SmtpEmailProvider(config);
    case "resend":
    case "microsoft":
      throw new Error(
        `Email provider "${config.provider}" is not implemented yet. Use smtp or noop.`,
      );
    default:
      throw new Error(`Unsupported email provider: ${config.provider}`);
  }
}
