import type { NotificationEmailVars } from "../types";
import { infoBoxHtml, layoutHtml, renderTemplate } from "./render";

export function rejectedSubject(vars: NotificationEmailVars): string {
  return renderTemplate("Document Rejected: {{document_title}}", vars);
}

export function rejectedHtml(vars: NotificationEmailVars): string {
  const body = `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p style="color:#dc2626;font-weight:600;">A document in your workflow has been rejected.</p>
    ${infoBoxHtml(
      vars,
      `
      <p style="margin:0 0 8px;"><strong>Document:</strong> ${vars.documentTitle}</p>
      ${vars.actorName ? `<p style="margin:0 0 8px;"><strong>Rejected by:</strong> ${vars.actorName}</p>` : ""}
      ${vars.comments ? `<p style="margin:0;"><strong>Reason:</strong> ${vars.comments}</p>` : ""}
    `,
    )}
  `;

  return layoutHtml(rejectedSubject(vars), body);
}

export function rejectedText(vars: NotificationEmailVars): string {
  return [
    `Dear ${vars.recipientName},`,
    "",
    "A document in your workflow has been rejected.",
    "",
    `Document: ${vars.documentTitle}`,
    vars.actorName ? `Rejected by: ${vars.actorName}` : "",
    vars.comments ? `Reason: ${vars.comments}` : "",
    vars.actionUrl ? `Open document: ${vars.actionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
