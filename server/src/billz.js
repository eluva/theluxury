// BILLZ 2.0 API client.
// Docs: https://docs.billz.ai  (request API access / secret token from BILLZ support or in the admin panel:
// Настройки → Интеграции → API).
//
// ⚠️ Field names below follow the public BILLZ 2.0 API as of writing. Before going live, check them
// against a real response: run `npm run billz:dump` and look at billz-sample.json.

const BASE = process.env.BILLZ_API_URL || 'https://api-admin.billz.ai';
const SECRET = process.env.BILLZ_SECRET_TOKEN;
/** Only stock/prices of this shop are used (a brand can have several shops in BILLZ). Empty → all shops summed. */
const SHOP_ID = process.env.BILLZ_SHOP_ID || '';
/** Name of the product attribute that holds the shoe size. */
const SIZE_ATTR = (process.env.BILLZ_SIZE_ATTRIBUTE || 'размер|size|o‘lcham|olcham').toLowerCase();

let token = null;
let tokenExpires = 0;

async function auth() {
  if (token && Date.now() < tokenExpires) return token;
  if (!SECRET) throw new Error('BILLZ_SECRET_TOKEN is not set');
  const res = await fetch(`${BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_token: SECRET }),
  });
  if (!res.ok) throw new Error(`BILLZ auth failed: HTTP ${res.status}`);
  const json = await res.json();
  token = json.data?.access_token ?? json.access_token;
  const ttl = Number(json.data?.expires_in ?? 3600);
  tokenExpires = Date.now() + (ttl - 60) * 1000;
  return token;
}

async function billzGet(path, params = {}) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await auth()}` } });
  if (res.status === 401) {
    token = null;
    return billzGet(path, params);
  }
  if (!res.ok) throw new Error(`BILLZ ${path}: HTTP ${res.status}`);
  return res.json();
}

/** Loads all products page by page. */
export async function fetchBillzProducts() {
  const limit = 100;
  const all = [];
  for (let page = 1; page < 200; page++) {
    const json = await billzGet('/v2/products', { limit, page, shop_ids: SHOP_ID || undefined });
    const items = json.products ?? json.data ?? [];
    all.push(...items);
    const total = json.count ?? json.total;
    if (items.length < limit || (total && all.length >= total)) break;
  }
  return all;
}

// ---------- mapping BILLZ → our Catalog format (see web/src/types.ts) ----------

const pickShop = (arr = []) => (SHOP_ID ? arr.filter((x) => x.shop_id === SHOP_ID) : arr);

function attr(p, re) {
  const a = (p.product_attributes ?? p.attributes ?? []).find((x) => new RegExp(re, 'i').test(x.attribute_name ?? x.name ?? ''));
  return a?.attribute_value ?? a?.value;
}

function stockOf(p) {
  return pickShop(p.shop_measurement_values).reduce((n, s) => n + Number(s.active_measurement_value ?? 0), 0);
}

function priceOf(p) {
  const prices = pickShop(p.shop_prices);
  const retail = Math.max(0, ...prices.map((x) => Number(x.retail_price ?? 0)));
  const promo = Math.max(0, ...prices.map((x) => Number(x.promo_price ?? 0)));
  return promo && promo < retail ? { price: promo, oldPrice: retail } : { price: retail };
}

function imagesOf(p) {
  const list = [p.main_image_url_full, p.main_image_url, ...(p.photos ?? []).map((x) => x.photo_url)].filter(Boolean);
  return [...new Set(list)];
}

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-|-$/g, '');

/**
 * In BILLZ every size of a shoe is usually a separate product (variation) sharing a parent/model.
 * We group them into one storefront product with a size table.
 */
export function mapBillzCatalog(raw) {
  const groups = new Map();
  for (const p of raw) {
    if (p.is_deleted || p.archived) continue;
    const size = attr(p, SIZE_ATTR);
    const baseName = size ? String(p.name).replace(new RegExp(`[\\s,/-]*${size}\\s*$`), '').trim() : p.name;
    const key = p.parent_id || p.product_group_id || baseName;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ p, size: size ? String(size) : 'One size', baseName });
  }

  const categories = new Map();
  const products = [];

  for (const [key, variants] of groups) {
    const first = variants[0].p;
    const cat = first.categories?.[0];
    const catId = cat ? String(cat.id) : 'other';
    const images = [...new Set(variants.flatMap((v) => imagesOf(v.p)))];
    if (!categories.has(catId)) {
      categories.set(catId, { id: catId, name: { ru: cat?.name ?? 'Другое', uz: cat?.name ?? 'Boshqa' }, image: images[0] ?? '' });
    }
    const { price, oldPrice } = priceOf(first);
    products.push({
      id: slug(key) || first.id,
      sku: first.sku,
      name: variants[0].baseName,
      category: catId,
      collection: first.brand_name || attr(first, 'коллекция|collection') || undefined,
      gender: /жен|women|ayol/i.test(`${cat?.name} ${attr(first, 'пол|gender|jins') ?? ''}`) ? 'women' : 'men',
      price,
      oldPrice,
      images,
      sizes: variants
        .map((v) => ({ size: v.size, qty: stockOf(v.p), billzId: v.p.id, sku: v.p.sku }))
        .sort((a, b) => parseFloat(a.size) - parseFloat(b.size)),
      color: attr(first, 'цвет|color|rang'),
      material: attr(first, 'материал|material'),
      description: first.description || undefined,
      isNew: first.created_at ? Date.now() - new Date(first.created_at).getTime() < 30 * 864e5 : false,
    });
  }

  // hide products that have no price or no photos
  const visible = products.filter((p) => p.price > 0 && p.images.length);
  return { categories: [...categories.values()].filter((c) => visible.some((p) => p.category === c.id)), products: visible };
}

export async function loadBillzCatalog() {
  return mapBillzCatalog(await fetchBillzProducts());
}
