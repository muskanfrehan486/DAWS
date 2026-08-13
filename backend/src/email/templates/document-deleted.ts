import type { NotificationEmailVars } from "../types";
import { infoBoxHtml, layoutHtml, renderTemplate } from "./render";

export function documentDeletedSubject(vars: NotificationEmailVars): string {
  return renderTemplate("Document Deleted: {{document_title}}", vars);
}

export function documentDeletedHtml(vars: NotificationEmailVars): string {
  const body = `
    <p>Dear <strong>${vars.recipientName}</strong>,</p>
    <p>${vars.message}</p>
    ${infoBoxHtml(
      vars,
      `<p style="margin:0;"><strong>Document:</strong> ${vars.documentTitle}</p>`,
    )}
  `;

  return layoutHtml(documentDeletedSubject(vars), body);
}

export function documentDeletedText(vars: NotificationEmailVars): string {
  return [
    `Dear ${vars.recipientName},`,
    "",
    vars.message,
    "",
    `Document: ${vars.documentTitle}`,
  ].join("\n");
}
