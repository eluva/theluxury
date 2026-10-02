import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBillzCatalog } from './billz.js';
import { esc, sendMessage, verifyInitData } from './telegram.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(__dirname, '../../web/dist');
const DEMO_CATALOG = path.resolve(__dirname, '../../web/src/data/catalog.json');

const PORT = Number(process.env.PORT || 8080);
const DATA_SOURCE = process.env.DATA_SOURCE || 'demo'; // 'demo' | 'billz'
const CACHE_TTL = Number(process.env.CATALOG_CACHE_SECONDS || 300) * 1000;
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID;

// ---------- catalog with cache ----------
let cached = null;
let cachedAt = 0;
let loading = null;

async function getCatalog() {
  if (cached && Date.now() - cachedAt < CACHE_TTL) return cached;
  if (!loading) {
    loading = (async () => {
      try {
        cached = DATA_SOURCE === 'billz' ? await loadBillzCatalog() : JSON.parse(fs.readFileSync(DEMO_CATALOG, 'utf8'));
        cachedAt = Date.now();
      } catch (e) {
        console.error('[catalog] load failed:', e.message);
        if (!cached) throw e; // serve stale data if we have it
      } finally {
        loading = null;
      }
      return cached;
    })();
  }
  return loading;
}

// ---------- app ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, source: DATA_SOURCE }));

app.get('/api/catalog', async (_req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(await getCatalog());
  } catch {
    res.status(503).json({ error: 'catalog_unavailable' });
  }
});

let orderSeq = Number(String(Date.now()).slice(-6));

app.post('/api/orders', async (req, res) => {
  const body = req.body ?? {};
  const user = verifyInitData(body.initData);
  if (process.env.REQUIRE_TELEGRAM === '1' && !user) return res.status(401).json({ error: 'bad_init_data' });

  const name = String(body.customer?.name ?? '').trim().slice(0, 100);
  const phone = String(body.customer?.phone ?? '').replace(/[^\d+]/g, '').slice(0, 20);
  if (!name || phone.replace(/\D/g, '').length < 9 || !Array.isArray(body.items) || !body.items.length) {
    return res.status(400).json({ error: 'invalid_order' });
  }

  // Never trust prices from the client — recalculate from the catalog.
  const catalog = await getCatalog();
  const items = [];
  for (const it of body.items.slice(0, 50)) {
    const product = catalog.products.find((p) => p.id === it.productId);
    const size = product?.sizes.find((s) => s.size === String(it.size));
    const qty = Math.max(1, Math.min(10, Number(it.qty) || 1));
    if (!product || !size) return res.status(409).json({ error: 'product_not_found', productId: it.productId });
    if (size.qty < qty) return res.status(409).json({ error: 'out_of_stock', productId: it.productId, size: size.size });
    items.push({ name: product.name, sku: size.sku ?? product.sku, size: size.size, qty, price: product.price });
  }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const id = String(++orderSeq);
  const delivery = body.delivery?.method === 'courier' ? `Курьер: ${String(body.delivery.address ?? '').slice(0, 300)}` : 'Самовывоз';
  const fmt = (n) => n.toLocaleString('ru-RU').replace(/ |,/g, ' ');

  const text = [
    `🛍 <b>Новый заказ #${id}</b>`,
    '',
    ...items.map((i) => `• ${esc(i.name)} — р. ${esc(i.size)} × ${i.qty} = ${fmt(i.price * i.qty)} сум${i.sku ? ` <code>${esc(i.sku)}</code>` : ''}`),
    '',
    `💰 <b>Итого: ${fmt(total)} сум</b>`,
    `🚚 ${esc(delivery)}`,
    `👤 ${esc(name)}`,
    `📞 ${esc(phone)}`,
    user ? `✈️ ${user.username ? '@' + esc(user.username) : `<a href="tg://user?id=${user.id}">профиль</a>`}` : '',
    body.comment ? `💬 ${esc(String(body.comment).slice(0, 500))}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  console.log(`[order] #${id}`, JSON.stringify({ name, phone, items, total, delivery }));

  // TODO(BILLZ): when the BILLZ account enables order/sale creation via API,
  // create the order there as well (items carry `sku` — use it to match BILLZ products).
  const sent = await sendMessage(MANAGER_CHAT_ID, text);
  if (!sent && process.env.BOT_TOKEN) return res.status(502).json({ error: 'notify_failed' });

  if (user?.id) {
    sendMessage(user.id, `Спасибо! Ваш заказ <b>#${id}</b> принят ✅\nМенеджер LUXURY скоро свяжется с вами.`).catch(() => {});
  }

  res.json({ id });
});

// Serve the built Mini App from the same origin (optional)
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { maxAge: '1h', index: 'index.html' }));
}

app.listen(PORT, () => {
  console.log(`LUXURY server on http://localhost:${PORT}  (data: ${DATA_SOURCE})`);
  getCatalog().catch(() => {});
});
