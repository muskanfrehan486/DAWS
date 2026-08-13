import nodemailer from "nodemailer";
import type { EmailProvider } from "../provider.interface";
import type { EmailConfig } from "../config";
import type { EmailMessage, SendResult } from "../types";

export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private readonly transporter;
  private readonly from: string;

  constructor(config: EmailConfig) {
    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const result = await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return {
      provider: "smtp",
      messageId: result.messageId,
    };
  }
}
