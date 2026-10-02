import { useEffect, useState } from 'react';
import demoCatalog from '../data/catalog.json';
import type { Catalog, OrderPayload } from '../types';
import { tg } from './telegram';

/**
 * Data source.
 *  - VITE_API_URL set (or "/api" through the Vite proxy) → catalog comes from our server,
 *    which in turn reads products & stock from BILLZ.
 *  - VITE_API_URL empty → built-in demo catalog, orders are simulated.
 */
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

let cache: Promise<Catalog> | null = null;

export function loadCatalog(): Promise<Catalog> {
  if (!cache) {
    cache = API
      ? fetch(`${API}/catalog`)
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json() as Promise<Catalog>;
          })
          .catch((e) => {
            console.warn('[api] catalog failed, using demo data', e);
            return demoCatalog as Catalog;
          })
      : Promise.resolve(demoCatalog as Catalog);
  }
  return cache;
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);
  return catalog;
}

export async function submitOrder(order: OrderPayload): Promise<{ id: string }> {
  if (!API) {
    await new Promise((r) => setTimeout(r, 900));
    return { id: String(Math.floor(100000 + Math.random() * 900000)) };
  }
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...order, initData: tg?.initData }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
