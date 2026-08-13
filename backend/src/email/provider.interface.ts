import type { EmailMessage, SendResult } from "./types";

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}
