import crypto from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * Verifies Telegram Mini App initData signature.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Returns the parsed user or null if the signature is invalid / missing.
 */
export function verifyInitData(initData, maxAgeSec = 24 * 3600) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const check = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (check.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(check), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - Number(params.get('auth_date')) > maxAgeSec) return null;

  try {
    return JSON.parse(params.get('user') ?? 'null');
  } catch {
    return null;
  }
}

export async function sendMessage(chatId, text) {
  if (!BOT_TOKEN || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) console.error('[telegram] sendMessage failed', res.status, await res.text());
  return res.ok;
}

export const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]);
