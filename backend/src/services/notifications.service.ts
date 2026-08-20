import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { NotificationType, Prisma } from "../generated/prisma/client";

type CreateNotificationInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  documentId?: string;
  workflowRunId?: string;
  tx?: Prisma.TransactionClient;
};

class NotificationsService {
  async createNotification(input: CreateNotificationInput) {
    const client = input.tx ?? prisma;

    return client.notification.create({
      data: {
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        message: input.message,
        documentId: input.documentId ?? null,
        workflowRunId: input.workflowRunId ?? null,
      },
    });
  }

  async getNotifications(userId: string, isRead?: boolean) {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(isRead !== undefined && { isRead }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return notifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw errors.notFound("Notification not found.");
    }

    if (notification.recipientId !== userId) {
      throw errors.forbidden("You cannot access this notification.");
    }

    if (notification.isRead) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw errors.notFound("Notification not found.");
    }

    if (notification.recipientId !== userId) {
      throw errors.forbidden("You cannot delete this notification.");
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: "Notification deleted successfully." };
  }

  async deleteAllNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: { recipientId: userId },
    });

    return {
      message: "All notifications deleted successfully.",
      deletedCount: result.count,
    };
  }
}

export const notificationsService = new NotificationsService();
