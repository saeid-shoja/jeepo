import { SITE_EMAIL, SITE_NAME_FA, SITE_URL } from '@offroad/shared';

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const LOGO_URL = `${SITE_URL.replace(/\/$/, '')}/logo.png`;

const RTL_TEXT =
  'direction:rtl;text-align:right;font-family:Tahoma,"Segoe UI",Arial,sans-serif;';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type EmailLayoutOptions = {
  title: string;
  previewText?: string;
  bodyHtml: string;
};

export function buildEmailLayout(options: EmailLayoutOptions): string {
  const { title, previewText, bodyHtml } = options;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${previewText ? `<title>${escapeHtml(previewText)}</title>` : ''}
</head>
<body style="margin:0;padding:0;background:#eef2f7;${RTL_TEXT}">
  <div style="max-width:600px;margin:0 auto;padding:24px 12px;direction:rtl;text-align:right;">
    <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;border-radius:16px;box-shadow:0 12px 40px rgba(15,23,42,0.12);overflow:hidden;direction:rtl;">
      <tr>
        <td style="padding:28px 28px 8px;direction:rtl;text-align:right;">
          <h1 style="margin:0 0 6px;font-size:32px;color:#d62828;font-weight:bold;${RTL_TEXT}">${escapeHtml(SITE_NAME_FA)}</h1>
          <h1 style="margin:0 0 20px;font-size:20px;color:#1e3a5f;line-height:1.6;border-bottom:3px solid #d62828;padding-bottom:12px;${RTL_TEXT}">${escapeHtml(title)}</h1>
          <div style="font-size:15px;line-height:1.95;color:#334155;${RTL_TEXT}">${bodyHtml}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 24px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);direction:rtl;text-align:right;">
          <p style="margin:0 0 10px;font-size:13px;color:#64748b;${RTL_TEXT}">با تشکر از انتخاب شما</p>
          <p style="margin:0 0 16px;font-size:16px;color:#94a3b8;line-height:1.8;${RTL_TEXT}">
            تیم ${escapeHtml(SITE_NAME_FA)}<br />
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
            <tr width="100%">
              <td width="100%" style="text-align:center;vertical-align:middle;">
                <img src="${LOGO_URL}" alt="${escapeHtml(SITE_NAME_FA)}" width="100" height="100" style="display:inline-block;border-radius:8px;background:#ffffff;padding:3px;box-shadow:0 2px 8px rgba(15,23,42,0.12);vertical-align:middle;" />
                <p style="display:inline-block;margin-right:10px;font-size:12px;color:#94a3b8;vertical-align:middle;${RTL_TEXT}">${escapeHtml(SITE_HOST)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function emailGreeting(name: string): string {
  return `<p style="margin:0 0 16px;${RTL_TEXT}">سلام <strong>${escapeHtml(name)}</strong>،</p>`;
}

export function emailCodeBox(label: string, code: string): string {
  return `
    <div style="margin:24px 0;direction:rtl;text-align:right;">
      <div style="display:inline-block;background:linear-gradient(135deg,#fef2f2 0%,#fff7ed 100%);border:2px dashed #d62828;border-radius:14px;padding:22px 28px;min-width:200px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#64748b;${RTL_TEXT}">${escapeHtml(label)}</p>
        <p style="margin:0;font-size:34px;font-weight:bold;color:#d62828;letter-spacing:8px;direction:ltr;text-align:center;font-family:'Courier New',monospace;">${escapeHtml(code)}</p>
      </div>
      <p style="margin:14px 0 0;font-size:13px;color:#94a3b8;${RTL_TEXT}">این کد تا ۱۵ دقیقه معتبر است</p>
    </div>
  `;
}

export function emailButton(text: string, href: string): string {
  return `
    <p style="margin:24px 0;text-align:center;direction:rtl;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:linear-gradient(135deg,#d62828,#b91c1c);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 4px 14px rgba(214,40,40,0.35);">${escapeHtml(text)}</a>
    </p>
  `;
}

export function emailInfoBox(contentHtml: string): string {
  return `
    <div style="margin:16px 0;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#475569;${RTL_TEXT}">
      ${contentHtml}
    </div>
  `;
}

export function emailHighlightBox(contentHtml: string): string {
  return `
    <div style="margin:16px 0;padding:16px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:15px;color:#9a3412;${RTL_TEXT}">
      ${contentHtml}
    </div>
  `;
}
