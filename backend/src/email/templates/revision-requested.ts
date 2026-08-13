import type { NotificationEmailVars } from "../types";
import { infoBoxHtml, layoutHtml, renderTemplate } from "./render";

export function revisionRequestedSubject(vars: NotificationEmailVars): string {
  return renderTemplate("Revision Required: {{document_title}}", vars);
}

export function revisionRequestedHtml(vars: NotificationEmailVars): string {
  const body = `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p>A revision has been requested for the document you submitted.</p>
    ${infoBoxHtml(
      vars,
      `
      <p style="margin:0 0 8px;"><strong>Document:</strong> ${vars.documentTitle}</p>
      ${vars.actorName ? `<p style="margin:0 0 8px;"><strong>Requested by:</strong> ${vars.actorName}</p>` : ""}
      ${vars.comments ? `<p style="margin:0;"><strong>Comments:</strong> ${vars.comments}</p>` : ""}
    `,
    )}
    <p>Please revise the document and resubmit at your earliest convenience.</p>
  `;

  return layoutHtml(revisionRequestedSubject(vars), body);
}

export function revisionRequestedText(vars: NotificationEmailVars): string {
  return [
    `Dear ${vars.recipientName},`,
    "",
    "A revision has been requested for the document you submitted.",
    "",
    `Document: ${vars.documentTitle}`,
    vars.actorName ? `Requested by: ${vars.actorName}` : "",
    vars.comments ? `Comments: ${vars.comments}` : "",
    vars.actionUrl ? `Open document: ${vars.actionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
