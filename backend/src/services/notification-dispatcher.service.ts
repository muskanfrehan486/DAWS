import { NotificationType } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { emailService } from "../email";
import { auditService } from "./audit.service";
import { notificationsService } from "./notifications.service";

export type NotificationMetadata = {
  actorName?: string;
  comments?: string;
  workflowStep?: string;
  isReview?: boolean;
  isFinalApproval?: boolean;
};

export type DispatchNotificationInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  documentId?: string;
  documentTitle?: string;
  workflowRunId?: string;
  metadata?: NotificationMetadata;
};

class NotificationDispatcherService {
  async dispatch(input: DispatchNotificationInput) {
    const notification = await notificationsService.createNotification({
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      documentId: input.documentId,
      workflowRunId: input.workflowRunId,
    });

    this.sendEmailAsync(input).catch((error) => {
      console.error("Failed to send notification email:", error);
    });

    return notification;
  }

  async dispatchMany(inputs: DispatchNotificationInput[]) {
    const notifications = [];

    for (const input of inputs) {
      notifications.push(await this.dispatch(input));
    }

    return notifications;
  }

  async sendPendingEmails(inputs: DispatchNotificationInput[]) {
    await Promise.all(
      inputs.map((input) =>
        this.sendEmailAsync(input).catch((error) => {
          console.error("Failed to send notification email:", error);
        }),
      ),
    );
  }

  private async sendEmailAsync(input: DispatchNotificationInput) {
    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!recipient?.email) {
      return;
    }

    const result = await emailService.sendNotificationEmail({
      type: input.type,
      to: recipient.email,
      recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),
      documentTitle:
        input.documentTitle ?? this.extractDocumentTitle(input.message),
      message: input.message,
      documentId: input.documentId,
      metadata: input.metadata,
    });

    if (!result) {
      return;
    }

    await auditService.createAuditLog({
      action: "EMAIL_SENT",
      entityType: "Notification",
      entityId: input.documentId ?? input.recipientId,
      newValue: {
        recipientId: input.recipientId,
        recipientEmail: recipient.email,
        notificationType: input.type,
        provider: result.provider,
        messageId: result.messageId ?? null,
      },
    });
  }

  private extractDocumentTitle(message: string): string {
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1];
    }

    return "Document";
  }
}

export const notificationDispatcher = new NotificationDispatcherService();
