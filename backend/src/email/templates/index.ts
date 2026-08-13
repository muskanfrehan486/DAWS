import type { NotificationType } from "../../generated/prisma/client";
import type { NotificationEmailVars } from "../types";
import {
  approvalNeededHtml,
  approvalNeededSubject,
  approvalNeededText,
} from "./approval-needed";
import {
  approvedHtml,
  approvedSubject,
  approvedText,
} from "./approved";
import {
  documentDeletedHtml,
  documentDeletedSubject,
  documentDeletedText,
} from "./document-deleted";
import {
  rejectedHtml,
  rejectedSubject,
  rejectedText,
} from "./rejected";
import {
  revisionRequestedHtml,
  revisionRequestedSubject,
  revisionRequestedText,
} from "./revision-requested";

type EmailTemplate = {
  subject: (vars: NotificationEmailVars) => string;
  html: (vars: NotificationEmailVars) => string;
  text: (vars: NotificationEmailVars) => string;
};

const TEMPLATES: Record<NotificationType, EmailTemplate> = {
  APPROVAL_NEEDED: {
    subject: approvalNeededSubject,
    html: approvalNeededHtml,
    text: approvalNeededText,
  },
  REVISION_REQUESTED: {
    subject: revisionRequestedSubject,
    html: revisionRequestedHtml,
    text: revisionRequestedText,
  },
  APPROVED: {
    subject: approvedSubject,
    html: approvedHtml,
    text: approvedText,
  },
  REJECTED: {
    subject: rejectedSubject,
    html: rejectedHtml,
    text: rejectedText,
  },
  DOCUMENT_DELETED: {
    subject: documentDeletedSubject,
    html: documentDeletedHtml,
    text: documentDeletedText,
  },
  RESUBMITTED: {
    subject: approvalNeededSubject,
    html: approvalNeededHtml,
    text: approvalNeededText,
  },
};

export function getNotificationTemplate(type: NotificationType): EmailTemplate {
  return TEMPLATES[type];
}
