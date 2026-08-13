import type { NotificationEmailVars } from "../types";
import { infoBoxHtml, layoutHtml, renderTemplate } from "./render";

export function approvedSubject(vars: NotificationEmailVars): string {
  if (vars.isFinalApproval === false) {
    return renderTemplate("Approval Progress: {{document_title}}", vars);
  }

  return renderTemplate("Document Approved: {{document_title}}", vars);
}

export function approvedHtml(vars: NotificationEmailVars): string {
  const isIntermediate = vars.isFinalApproval === false;

  const body = isIntermediate
    ? `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p>${vars.message}</p>
    ${infoBoxHtml(
      vars,
      `
      <p style="margin:0 0 8px;"><strong>Document:</strong> ${vars.documentTitle}</p>
      ${vars.actorName ? `<p style="margin:0;"><strong>Approved by:</strong> ${vars.actorName}</p>` : ""}
    `,
    )}
  `
    : `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p style="color:#15803d;font-weight:600;">Your document has been fully approved by all required approvers.</p>
    ${infoBoxHtml(
      vars,
      `
      <p style="margin:0 0 8px;"><strong>Document:</strong> ${vars.documentTitle}</p>
      ${vars.actorName ? `<p style="margin:0 0 8px;"><strong>Final Approver:</strong> ${vars.actorName}</p>` : ""}
      ${vars.submissionDate ? `<p style="margin:0;"><strong>Date:</strong> ${vars.submissionDate}</p>` : ""}
    `,
    )}
  `;

  return layoutHtml(approvedSubject(vars), body);
}

export function approvedText(vars: NotificationEmailVars): string {
  if (vars.isFinalApproval === false) {
    return [
      `Dear ${vars.recipientName},`,
      "",
      vars.message,
      "",
      `Document: ${vars.documentTitle}`,
      vars.actorName ? `Approved by: ${vars.actorName}` : "",
      vars.actionUrl ? `Open document: ${vars.actionUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Dear ${vars.recipientName},`,
    "",
    "Your document has been fully approved by all required approvers.",
    "",
    `Document: ${vars.documentTitle}`,
    vars.actorName ? `Final Approver: ${vars.actorName}` : "",
    vars.actionUrl ? `Open document: ${vars.actionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
