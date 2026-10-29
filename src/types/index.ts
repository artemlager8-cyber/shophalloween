export type Language = 'ru' | 'en';

export type ProductBadge = 'hit' | 'new' | 'in_stock' | 'discount';

export type CategoryId = 'all' | 'gummies' | 'chocolate' | 'sour' | 'potions' | 'gift_boxes';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number; // in tenge ₸
  oldPrice?: number;
  weight: string;
  category: CategoryId;
  badges: ProductBadge[];
  spookiness: number; // 1 to 5
  sourness: number; // 1 to 10
  sweetness: number; // 1 to 10
  glowInTheDark: boolean;
  image: string;
  inStock: boolean;
  stockCount: number;
  ingredients: string;
  lore: string;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CauldronBox {
  id: string;
  name: {
    ru: string;
    en: string;
  };
  icon: string;
  description: {
    ru: string;
    en: string;
  };
  capacity: number;
  basePrice: number;
  color: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  authorRole: string;
  avatar: string;
  rating: number;
  date: string;
  comment: {
    ru: string;
    en: string;
  };
  verified: boolean;
}

export interface OrderData {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  comment: string;
  items: CartItem[];
  total: number;
  dateTime: string;
}
