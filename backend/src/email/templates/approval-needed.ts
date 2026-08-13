import type { NotificationEmailVars } from "../types";
import { infoBoxHtml, layoutHtml, renderTemplate } from "./render";

export function approvalNeededSubject(vars: NotificationEmailVars): string {
  return renderTemplate("Action Required: {{document_title}}", vars);
}

export function approvalNeededHtml(vars: NotificationEmailVars): string {
  const body = `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p>${vars.message}</p>
    ${infoBoxHtml(
      vars,
      `
      <p style="margin:0 0 8px;"><strong>Document:</strong> ${vars.documentTitle}</p>
      ${vars.actorName ? `<p style="margin:0 0 8px;"><strong>Submitted by:</strong> ${vars.actorName}</p>` : ""}
      ${vars.submissionDate ? `<p style="margin:0 0 8px;"><strong>Date:</strong> ${vars.submissionDate}</p>` : ""}
      ${vars.workflowStep ? `<p style="margin:0;"><strong>Step:</strong> ${vars.workflowStep}</p>` : ""}
    `,
    )}
  `;

  return layoutHtml(approvalNeededSubject(vars), body);
}

export function approvalNeededText(vars: NotificationEmailVars): string {
  return [
    `Dear ${vars.recipientName},`,
    "",
    vars.message,
    "",
    `Document: ${vars.documentTitle}`,
    vars.actorName ? `Submitted by: ${vars.actorName}` : "",
    vars.workflowStep ? `Step: ${vars.workflowStep}` : "",
    vars.actionUrl ? `Open document: ${vars.actionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
