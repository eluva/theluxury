export type Lang = 'ru' | 'uz';

export interface Category {
  id: string;
  name: Record<Lang, string>;
  image: string;
}

export interface SizeStock {
  size: string;
  qty: number;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  category: string;
  collection?: string;
  gender: 'men' | 'women' | 'unisex';
  price: number;
  oldPrice?: number;
  images: string[];
  sizes: SizeStock[];
  color?: string;
  material?: string;
  description?: string;
  isNew?: boolean;
}

export interface Catalog {
  categories: Category[];
  products: Product[];
}

export interface CartItem {
  productId: string;
  size: string;
  qty: number;
}

export interface OrderPayload {
  customer: { name: string; phone: string };
  delivery: { method: 'pickup' | 'courier'; address?: string };
  comment?: string;
  items: { productId: string; sku?: string; name: string; size: string; qty: number; price: number }[];
  total: number;
  initData?: string;
}
