import type { NotificationType } from "../generated/prisma/client";

export type EmailProviderName = "smtp" | "noop" | "resend" | "microsoft";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult = {
  provider: EmailProviderName;
  messageId?: string;
};

export type NotificationEmailVars = {
  recipientName: string;
  documentTitle: string;
  message: string;
  actionUrl?: string;
  actorName?: string;
  comments?: string;
  submissionDate?: string;
  workflowStep?: string;
  isFinalApproval?: boolean;
};

export type NotificationEmailInput = {
  type: NotificationType;
  to: string;
  recipientName: string;
  documentTitle: string;
  message: string;
  documentId?: string;
  metadata?: {
    actorName?: string;
    comments?: string;
    workflowStep?: string;
    isReview?: boolean;
    isFinalApproval?: boolean;
  };
};
