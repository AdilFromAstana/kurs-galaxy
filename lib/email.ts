import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.RESEND_FROM || 'KursGalaxy <onboarding@resend.dev>';

let resend: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  msg: EmailMessage,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getClient();
  if (!client) {
    // Dev-режим без ключа — пишем в консоль чтобы было видно в docker logs
    console.log('[email] RESEND_API_KEY не задан, письмо НЕ отправлено');
    console.log('[email] To:     ', msg.to);
    console.log('[email] Subject:', msg.subject);
    if (msg.text) console.log('[email] Text:\n', msg.text);
    return { ok: false, reason: 'no_api_key' };
  }
  try {
    const { error } = await client.emails.send({
      from: fromAddress,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    if (error) {
      console.error('[email] Resend error:', error);
      return { ok: false, reason: error.message ?? 'send_failed' };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[email] sendEmail exception:', err);
    return { ok: false, reason: err?.message ?? 'unknown_error' };
  }
}

export function passwordResetEmail({
  recipientName,
  resetUrl,
  expiresInHours = 1,
}: {
  recipientName: string;
  resetUrl: string;
  expiresInHours?: number;
}): EmailMessage {
  const safeName = recipientName || 'Студент';
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Сброс пароля</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899 0%,#db2777 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;line-height:64px;font-size:30px;color:#fff;">🎓</div>
              <h1 style="margin:16px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">Сброс пароля</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;color:#27272a;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px 0;">Здравствуйте, <strong>${escapeHtml(safeName)}</strong>!</p>
              <p style="margin:0 0 16px 0;">Мы получили запрос на сброс пароля для вашего аккаунта. Если это вы — нажмите кнопку ниже, чтобы задать новый пароль:</p>
              <p style="margin:32px 0;text-align:center;">
                <a href="${resetUrl}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">Сбросить пароль</a>
              </p>
              <p style="margin:0 0 8px 0;color:#71717a;font-size:13px;">Если кнопка не работает, скопируйте ссылку:</p>
              <p style="margin:0 0 24px 0;color:#71717a;font-size:13px;word-break:break-all;background:#f4f4f5;padding:12px;border-radius:8px;">${resetUrl}</p>
              <p style="margin:0;color:#71717a;font-size:13px;">⏱ Ссылка действует <strong>${expiresInHours} ${expiresInHours === 1 ? 'час' : 'часа'}</strong>.</p>
              <p style="margin:8px 0 0 0;color:#71717a;font-size:13px;">Если вы не запрашивали сброс — просто игнорируйте это письмо. Ваш пароль останется прежним.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;">© ${new Date().getFullYear()} KursGalaxy.kz</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Здравствуйте, ${safeName}!

Мы получили запрос на сброс пароля для вашего аккаунта.
Перейдите по ссылке, чтобы задать новый пароль:

${resetUrl}

Ссылка действует ${expiresInHours} ${expiresInHours === 1 ? 'час' : 'часа'}.

Если вы не запрашивали сброс — игнорируйте это письмо.

— Команда KursGalaxy.kz`;

  return {
    to: '',
    subject: 'Сброс пароля — KursGalaxy.kz',
    html,
    text,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function emailLayout({
  title,
  emoji,
  bodyHtml,
  brandName = 'KursGalaxy.kz',
}: {
  title: string;
  emoji: string;
  bodyHtml: string;
  brandName?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.06);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#ec4899 0%,#db2777 100%);padding:32px 40px;text-align:center;">
          <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;line-height:64px;font-size:30px;color:#fff;">${emoji}</div>
          <h1 style="margin:16px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#27272a;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;">
          <p style="margin:0;">© ${new Date().getFullYear()} ${escapeHtml(brandName)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function welcomeEmail({
  recipientName,
  catalogUrl,
  brandName = 'KursGalaxy.kz',
}: {
  recipientName: string;
  catalogUrl: string;
  brandName?: string;
}): EmailMessage {
  const safeName = recipientName || 'Студент';
  const html = emailLayout({
    title: `Добро пожаловать, ${escapeHtml(safeName)}!`,
    emoji: '🎉',
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Спасибо, что присоединились к <strong>${escapeHtml(brandName)}</strong>!</p>
      <p style="margin:0 0 16px 0;">Ваш аккаунт создан. Теперь вы можете:</p>
      <ul style="margin:0 0 24px 0;padding-left:20px;color:#27272a;">
        <li style="margin-bottom:6px;">Просмотреть каталог курсов</li>
        <li style="margin-bottom:6px;">Купить курс и получить доступ ко всем урокам</li>
        <li style="margin-bottom:6px;">Получить именной сертификат после прохождения</li>
      </ul>
      <p style="margin:0 0 32px 0;text-align:center;">
        <a href="${catalogUrl}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">Перейти к курсам</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">Если возникнут вопросы — просто ответьте на это письмо.</p>
    `,
    brandName,
  });
  const text = `Добро пожаловать, ${safeName}!

Спасибо, что присоединились к ${brandName}.

Каталог курсов: ${catalogUrl}

Если возникнут вопросы — просто ответьте на это письмо.`;
  return {
    to: '',
    subject: `Добро пожаловать в ${brandName}!`,
    html,
    text,
  };
}

export function purchaseReceiptEmail({
  recipientName,
  courseTitle,
  planName,
  amount,
  currency,
  expiresAt,
  courseUrl,
  brandName = 'KursGalaxy.kz',
}: {
  recipientName: string;
  courseTitle: string;
  planName: string;
  amount: number;
  currency: string;
  expiresAt: Date | null;
  courseUrl: string;
  brandName?: string;
}): EmailMessage {
  const safeName = recipientName || 'Студент';
  const accessText = expiresAt
    ? `до ${expiresAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`
    : 'безлимитный';
  const html = emailLayout({
    title: 'Спасибо за покупку!',
    emoji: '🎉',
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Здравствуйте, <strong>${escapeHtml(safeName)}</strong>!</p>
      <p style="margin:0 0 16px 0;">Оплата прошла успешно. Доступ к курсу открыт.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#f9fafb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:14px 16px;color:#71717a;font-size:13px;border-bottom:1px solid #e4e4e7;">Курс</td>
          <td style="padding:14px 16px;color:#27272a;font-weight:600;text-align:right;border-bottom:1px solid #e4e4e7;">${escapeHtml(courseTitle)}</td>
        </tr>
        <tr>
          <td style="padding:14px 16px;color:#71717a;font-size:13px;border-bottom:1px solid #e4e4e7;">Тариф</td>
          <td style="padding:14px 16px;color:#27272a;font-weight:600;text-align:right;border-bottom:1px solid #e4e4e7;">${escapeHtml(planName)}</td>
        </tr>
        <tr>
          <td style="padding:14px 16px;color:#71717a;font-size:13px;border-bottom:1px solid #e4e4e7;">Доступ</td>
          <td style="padding:14px 16px;color:#27272a;font-weight:600;text-align:right;border-bottom:1px solid #e4e4e7;">${escapeHtml(accessText)}</td>
        </tr>
        <tr>
          <td style="padding:14px 16px;color:#71717a;font-size:13px;">Сумма</td>
          <td style="padding:14px 16px;color:#db2777;font-weight:700;font-size:18px;text-align:right;">${amount.toLocaleString()} ${escapeHtml(currency)}</td>
        </tr>
      </table>
      <p style="margin:0 0 32px 0;text-align:center;">
        <a href="${courseUrl}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">Начать обучение</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">Если возникнут вопросы — просто ответьте на это письмо.</p>
    `,
    brandName,
  });
  const text = `Здравствуйте, ${safeName}!

Оплата прошла успешно. Доступ к курсу открыт.

Курс: ${courseTitle}
Тариф: ${planName}
Доступ: ${accessText}
Сумма: ${amount.toLocaleString()} ${currency}

Начать обучение: ${courseUrl}`;
  return {
    to: '',
    subject: `Доступ открыт: «${courseTitle}»`,
    html,
    text,
  };
}

export function expiryWarningEmail({
  recipientName,
  courseTitle,
  daysRemaining,
  expiresAt,
  courseUrl,
  brandName = 'KursGalaxy.kz',
}: {
  recipientName: string;
  courseTitle: string;
  daysRemaining: number;
  expiresAt: Date;
  courseUrl: string;
  brandName?: string;
}): EmailMessage {
  const safeName = recipientName || 'Студент';
  const expiresStr = expiresAt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dayWord =
    daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней';

  const html = emailLayout({
    title: 'Срок доступа скоро истекает',
    emoji: '⏰',
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Здравствуйте, <strong>${escapeHtml(safeName)}</strong>!</p>
      <p style="margin:0 0 16px 0;">Доступ к курсу <strong>«${escapeHtml(courseTitle)}»</strong> истекает через <strong>${daysRemaining} ${dayWord}</strong> — ${expiresStr}.</p>
      <p style="margin:0 0 24px 0;">Если хотите успеть пройти оставшиеся уроки или продлить доступ — перейдите к курсу:</p>
      <p style="margin:0 0 32px 0;text-align:center;">
        <a href="${courseUrl}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">Открыть курс</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">После истечения срока вы потеряете доступ к платным урокам, но прогресс и сертификат (если получен) останутся.</p>
    `,
    brandName,
  });
  const text = `Здравствуйте, ${safeName}!

Доступ к курсу «${courseTitle}» истекает через ${daysRemaining} ${dayWord} — ${expiresStr}.

Открыть курс: ${courseUrl}`;
  return {
    to: '',
    subject: `Доступ к «${courseTitle}» истекает через ${daysRemaining} ${dayWord}`,
    html,
    text,
  };
}
