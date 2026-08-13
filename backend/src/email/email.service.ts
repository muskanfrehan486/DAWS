import { getEmailConfig } from "./config";
import { createEmailProvider } from "./provider.factory";
import { getNotificationTemplate } from "./templates";
import type { NotificationEmailInput, NotificationEmailVars } from "./types";

class EmailService {
  private readonly config = getEmailConfig();
  private readonly provider = createEmailProvider(this.config);

  private buildActionUrl(documentId?: string): string | undefined {
    if (!documentId) {
      return undefined;
    }

    return `${this.config.frontendUrl.replace(/\/$/, "")}/documents/${documentId}`;
  }

  private buildVars(input: NotificationEmailInput): NotificationEmailVars {
    return {
      recipientName: input.recipientName,
      documentTitle: input.documentTitle,
      message: input.message,
      actionUrl: this.buildActionUrl(input.documentId),
      actorName: input.metadata?.actorName,
      comments: input.metadata?.comments,
      workflowStep: input.metadata?.workflowStep,
      isFinalApproval: input.metadata?.isFinalApproval,
      submissionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }

  async sendNotificationEmail(input: NotificationEmailInput) {
    if (!this.config.enabled) {
      return null;
    }

    const template = getNotificationTemplate(input.type);
    const vars = this.buildVars(input);

    return this.provider.send({
      to: input.to,
      subject: template.subject(vars),
      html: template.html(vars),
      text: template.text(vars),
    });
  }
}

export const emailService = new EmailService();
