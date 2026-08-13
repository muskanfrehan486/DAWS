import type { NotificationEmailVars } from "../types";

export function renderTemplate(
  template: string,
  vars: Record<string, string | boolean | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === undefined || typeof value === "boolean" ? "" : value;
  });
}

export function layoutHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f0f7f2;font-family:Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f7f2;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#22c55e 0%,#15803d 100%);padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;">
                DocFlow
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-size:14px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px;font-size:12px;color:#64748b;border-top:1px solid #f1f5f9;">
                This is an automated message from DocFlow. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function infoBoxHtml(vars: NotificationEmailVars, fields: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin:16px 0;font-size:13px;">
    ${fields}
  </div>
  ${vars.actionUrl ? `<p style="margin:20px 0 0;"><a href="${vars.actionUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Open Document</a></p>` : ""}`;
}
