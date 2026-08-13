import type { EmailProvider } from "../provider.interface";
import type { EmailMessage, SendResult } from "../types";

export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";

  async send(_message: EmailMessage): Promise<SendResult> {
    return { provider: "noop" };
  }
}
