import type { Lang } from '../types';

export function formatPrice(value: number, lang: Lang) {
  const n = new Intl.NumberFormat('ru-RU').format(value).replace(/,/g, ' ');
  return `${n} ${lang === 'uz' ? "so'm" : 'сум'}`;
}

/** Formats Uzbek phone as +998 XX XXX XX XX while typing. */
export function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (!d.startsWith('998')) d = '998' + d.replace(/^998?/, '');
  d = d.slice(0, 12);
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return '+' + p.join(' ');
}

export const isValidPhone = (v: string) => v.replace(/\D/g, '').length === 12;
