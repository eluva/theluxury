import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tgUser } from '../lib/telegram';
import type { CartItem, Lang } from '../types';

interface ShopState {
  lang: Lang;
  cart: CartItem[];
  favorites: string[];
  customer: { name: string; phone: string; address: string };
  setLang(lang: Lang): void;
  addToCart(productId: string, size: string): void;
  setQty(productId: string, size: string, qty: number): void;
  clearCart(): void;
  toggleFavorite(productId: string): void;
  saveCustomer(c: ShopState['customer']): void;
}

const defaultLang: Lang = tgUser?.language_code === 'uz' ? 'uz' : 'ru';

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      lang: defaultLang,
      cart: [],
      favorites: [],
      customer: { name: [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' '), phone: '', address: '' },
      setLang: (lang) => set({ lang }),
      addToCart: (productId, size) =>
        set((s) => {
          const existing = s.cart.find((i) => i.productId === productId && i.size === size);
          if (existing) {
            return { cart: s.cart.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i)) };
          }
          return { cart: [...s.cart, { productId, size, qty: 1 }] };
        }),
      setQty: (productId, size, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((i) => !(i.productId === productId && i.size === size))
              : s.cart.map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i)),
        })),
      clearCart: () => set({ cart: [] }),
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((id) => id !== productId)
            : [...s.favorites, productId],
        })),
      saveCustomer: (customer) => set({ customer }),
    }),
    { name: 'luxury-shop', version: 1 },
  ),
);

export const cartCount = (cart: CartItem[]) => cart.reduce((n, i) => n + i.qty, 0);
