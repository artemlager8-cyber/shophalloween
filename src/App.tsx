/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// TELEGRAM BOT CONFIGURATION CONSTANTS
// ==========================================
export const TOKEN = "9292524346:AAG8mnlIm5Mm1pn6at2My4aQ4FHXqYMfORE";
export const CHAT_ID = "5074390027 ";

import React, { useState, useEffect, useMemo } from 'react';
import { PRODUCTS } from './data/products';
import { Product, CartItem, CategoryId, OrderData } from './types';
import { sound } from './utils/sound';
import confetti from 'canvas-confetti';

import {
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  Star,
  ShieldCheck,
  Send,
  Loader2,
  MapPin,
  Phone,
  User,
  MessageSquare,
  Zap,
  Tag,
  ArrowRight
} from 'lucide-react';

const FREE_DELIVERY_THRESHOLD = 10000; // 10 000 ₸
const STANDARD_DELIVERY_COST = 1500; // 1 500 ₸

export default function App() {
  // Page routing: 'catalog' | 'product' | 'cart' | 'checkout' | 'thank-you'
  const [page, setPage] = useState<'catalog' | 'product' | 'cart' | 'checkout' | 'thank-you'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Cart state with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('midnight_confectionery_cart');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
    // Default initial cart demo items
    return [
      { product: PRODUCTS[0], quantity: 1 },
      { product: PRODUCTS[2], quantity: 2 }
    ];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('midnight_confectionery_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [cart]);

  // Catalog filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [glowOnly, setGlowOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [spookinessFilter, setSpookinessFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'spooky'>('popular');

  // Product page quantity selector
  const [productDetailQty, setProductDetailQty] = useState(1);

  // Promo code in cart
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Checkout form
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});

  // Telegram send status
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Last successful order details for thank-you page
  const [lastOrder, setLastOrder] = useState<OrderData | null>(null);

  // Floating notification toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  };

  // Scroll to top on page change
  const navigateTo = (newPage: typeof page, productId?: string) => {
    sound.playPop();
    if (productId) {
      setSelectedProductId(productId);
      setProductDetailQty(1);
    }
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (promoDiscountPercent > 0) {
      return Math.round((cartSubtotal * promoDiscountPercent) / 100);
    }
    return 0;
  }, [cartSubtotal, promoDiscountPercent]);

  const deliveryPrice = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_COST;
  }, [cartSubtotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + deliveryPrice);
  }, [cartSubtotal, discountAmount, deliveryPrice]);

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    sound.playPop();
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [...prev, { product, quantity }];
    });
    showToast(`«${product.name}» добавлен в корзину!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    sound.playPop();
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    sound.playPop();
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Товар удален из корзины');
  };

  const clearCart = () => {
    sound.playPop();
    setCart([]);
    localStorage.removeItem('midnight_confectionery_cart');
  };

  // Promo code handler
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SPOOKY' || code === 'HALLOWEEN') {
      sound.playVictory();
      setAppliedPromo(code);
      setPromoDiscountPercent(15);
      setPromoMessage({ text: 'Промокод активирован! Скидка 15%', isError: false });
    } else if (code === 'JACK10') {
      sound.playVictory();
      setAppliedPromo(code);
      setPromoDiscountPercent(10);
      setPromoMessage({ text: 'Промокод активирован! Скидка 10%', isError: false });
    } else {
      setPromoMessage({ text: 'Неверный или устаревший промокод', isError: true });
    }
  };

  // Filtered & sorted catalog products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (glowOnly) {
      result = result.filter((p) => p.glowInTheDark);
    }

    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    if (spookinessFilter !== null) {
      result = result.filter((p) => p.spookiness >= spookinessFilter);
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'spooky') {
      result.sort((a, b) => b.spookiness - a.spookiness);
    } else {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [searchQuery, selectedCategory, glowOnly, inStockOnly, spookinessFilter, sortBy]);

  // Selected product for product page
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return PRODUCTS[0];
    return PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];
  }, [selectedProductId]);

  // CHECKOUT: Handle Order Submission via Telegram Bot API
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Name and Phone are required
    const errors: { name?: string; phone?: string } = {};
    if (!formName.trim()) {
      errors.name = 'Пожалуйста, введите ваше имя';
    }
    if (!formPhone.trim()) {
      errors.phone = 'Пожалуйста, введите номер телефона';
    } else if (formPhone.trim().length < 6) {
      errors.phone = 'Введите корректный номер телефона';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTelegramError('Заполните обязательные поля (Имя и Телефон)');
      return;
    }

    if (cart.length === 0) {
      setTelegramError('Ваша корзина пуста');
      return;
    }

    setFormErrors({});
    setTelegramError(null);
    setTelegramSending(true);

    // Format current date and time in Russian format
    const now = new Date();
    const formattedDateTime = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const orderId = `HLW-${Math.floor(10000 + Math.random() * 90000)}`;

    // Build items text list
    const itemsText = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.product.name}\n   — ${item.quantity} шт. × ${item.product.price.toLocaleString('ru-RU')} ₸ = ${(
            item.product.price * item.quantity
          ).toLocaleString('ru-RU')} ₸`
      )
      .join('\n');

    // Message in Russian as requested
    const message = [
      `🛒 Новый заказ #${orderId}`,
      ``,
      `📅 Дата и время: ${formattedDateTime}`,
      ``,
      `👤 Имя: ${formName.trim()}`,
      `📞 Телефон: ${formPhone.trim()}`,
      `📍 Адрес: ${formAddress.trim() || 'Не указан (самовывоз/уточнить)'}`,
      `💬 Комментарий: ${formComment.trim() || 'Нет комментария'}`,
      ``,
      `📦 Состав заказа:`,
      itemsText,
      ``,
      appliedPromo ? `🏷️ Промокод: ${appliedPromo} (-${discountAmount.toLocaleString('ru-RU')} ₸)` : null,
      `🚚 Доставка: ${deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice.toLocaleString('ru-RU')} ₸`}`,
      `💰 Итого к оплате: ${finalTotal.toLocaleString('ru-RU')} ₸`
    ]
      .filter((line) => line !== null)
      .join('\n');

    try {
      // Send Telegram message via Bot API as explicitly instructed:
      // fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", { method: "POST", body: new URLSearchParams({ chat_id: CHAT_ID, text: message }) })
      // Do not add custom headers.
      const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        body: new URLSearchParams({
          chat_id: CHAT_ID.trim(),
          text: message
        })
      });

      const data = await response.json();

      // Show the thank-you page and clear the cart ONLY if Telegram returns ok: true; otherwise show an error
      if (data && data.ok === true) {
        sound.playVictory();

        // Save order data for thank-you screen
        setLastOrder({
          orderId,
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
          comment: formComment.trim(),
          items: [...cart],
          total: finalTotal,
          dateTime: formattedDateTime
        });

        // Clear cart and remove from localStorage
        clearCart();
        setPromoDiscountPercent(0);
        setAppliedPromo(null);

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF5500', '#00FF66', '#0494FC', '#FFFFFF']
          });
        } catch (e) {
          console.error(e);
        }

        // Navigate to thank-you page
        setPage('thank-you');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorDesc = data?.description || 'Ошибка при отправке в Telegram';
        setTelegramError(`Не удалось отправить заказ: ${errorDesc}. Попробуйте ещё раз.`);
      }
    } catch (err: unknown) {
      console.error('Telegram API error:', err);
      const errMessage = err instanceof Error ? err.message : 'Сетевая ошибка';
      setTelegramError(`Ошибка отправки заказа (${errMessage}). Проверьте подключение к интернету и повторите попытку.`);
    } finally {
      setTelegramSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E5E2E1] flex flex-col font-sans selection:bg-[#FF5500] selection:text-black pb-20 md:pb-0">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1F1F1F] border border-[#00FF66] text-[#00FF66] text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl glow-green-sm flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Free Delivery Banner (Tenge) */}
      <div className="bg-[#161616] border-b border-white/5 py-2 px-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            {cartSubtotal >= FREE_DELIVERY_THRESHOLD ? (
              <span className="flex items-center gap-1.5 text-[#00FF66] font-bold text-glow-green">
                <Sparkles className="w-4 h-4 animate-spin" />
                Бесплатная доставка летучей мышью разблокирована!
              </span>
            ) : (
              <span className="text-[#A3A3A3] flex items-center gap-1.5">
                <span>🦇</span>
                <span>До бесплатной доставки осталось:</span>
                <span className="text-[#FF5500] font-bold">
                  {(FREE_DELIVERY_THRESHOLD - cartSubtotal).toLocaleString('ru-RU')} ₸
                </span>
              </span>
            )}
          </div>

          <div className="w-full sm:w-60 flex items-center gap-2">
            <div className="flex-1 bg-[#262626] h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  cartSubtotal >= FREE_DELIVERY_THRESHOLD
                    ? 'bg-gradient-to-r from-[#00FF66] to-[#6BFF83] glow-green-sm'
                    : 'bg-gradient-to-r from-[#FF5500] to-[#FFA726]'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100))}%`
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-[#A3A3A3]">
              {Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100))}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="bg-[#111111] border-b border-white/8 sticky top-9 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigateTo('catalog')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#FF5500]/40 flex items-center justify-center text-xl shadow-md shadow-[#FF5500]/20 group-hover:scale-105 transition-transform">
              🎃
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-heading font-black text-lg tracking-tight text-white group-hover:text-[#FF5500] transition-colors">
                  Midnight
                </span>
                <span className="font-heading font-black text-lg tracking-tight text-[#00FF66] text-glow-green">
                  Candy
                </span>
              </div>
              <span className="text-[10px] text-[#8E8E8E] block -mt-0.5">
                Полночная Кондитерская
              </span>
            </div>
          </button>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => navigateTo('catalog')}
              className={`transition-colors cursor-pointer ${
                page === 'catalog' ? 'text-[#FF5500] font-bold' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Каталог
            </button>
            <button
              onClick={() => navigateTo('cart')}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                page === 'cart' ? 'text-[#FF5500] font-bold' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              <span>Корзина</span>
              {cartTotalCount > 0 && (
                <span className="bg-[#FF5500] text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {cartTotalCount}
                </span>
              )}
            </button>
          </nav>

          {/* Cart Button */}
          <button
            onClick={() => navigateTo('cart')}
            className="flex items-center gap-2 bg-[#201F1F] hover:bg-[#FF5500] hover:text-black text-white px-3.5 py-2 rounded-xl border border-white/10 hover:border-[#FF5500] transition-all cursor-pointer font-heading font-bold text-xs shadow-md"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#00FF66] text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center glow-green-sm">
                  {cartTotalCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cartSubtotal > 0 ? `${cartSubtotal.toLocaleString('ru-RU')} ₸` : 'Корзина'}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================
          PAGE 1: CATALOG PAGE
      ======================================================== */}
      {page === 'catalog' && (
        <div className="flex-1 pb-16">
          {/* Hero Banner */}
          <div className="bg-gradient-to-b from-[#1C1B1B] via-[#141414] to-[#0D0D0D] border-b border-white/5 py-10 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#262626] border border-[#FF5500]/30 rounded-full px-3 py-1 text-xs font-bold text-[#FFB59C]">
                <span>🎃</span>
                <span>Хэллоуин Дроп 2026</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              </div>

              <h1 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                Сладость или <span className="text-[#FF5500] text-glow-orange">Гадость?</span>{' '}
                <span className="text-[#00FF66] text-glow-green">100% Вкусно</span>
              </h1>

              <p className="text-sm text-[#A3A3A3] max-w-xl leading-relaxed">
                Шоколадные гробики с карамелью, сочные мармеладные глаза с лавой и ядерно-кислые черви. Доставка в Алматы и по всему Казахстану.
              </p>

              {/* Quick Perks */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-[#A3A3A3]">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Доставка 45 мин</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Свечение в УФ</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0494FC]" />
                  <span>Свежий крафт</span>
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            {/* Search Input */}
            <div className="relative w-full max-w-md mx-auto sm:mx-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск сладостей (глаза, клыки, шоколад)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#FF5500]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A3A3A3] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills (Mobile Scrollable) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Все сладости' },
                { id: 'gummies', label: 'Мармелад & Глаза' },
                { id: 'chocolate', label: 'Шоколадные гробики' },
                { id: 'sour', label: 'Кислотный взрыв' },
                { id: 'potions', label: 'Зелья & Газировки' },
                { id: 'gift_boxes', label: 'Подарочные наборы' }
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playPop();
                      setSelectedCategory(cat.id as CategoryId);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF5500] text-black font-extrabold shadow-md glow-orange-sm'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] hover:text-white border border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-filters Bar */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setGlowOnly(!glowOnly)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    glowOnly
                      ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]'
                      : 'bg-[#201F1F] border-white/5 text-[#A3A3A3]'
                  }`}
                >
                  ✨ Светятся в темноте
                </button>

                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    inStockOnly
                      ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]'
                      : 'bg-[#201F1F] border-white/5 text-[#A3A3A3]'
                  }`}
                >
                  ✓ В наличии
                </button>

                <select
                  value={spookinessFilter === null ? '' : spookinessFilter}
                  onChange={(e) =>
                    setSpookinessFilter(e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="bg-[#201F1F] border border-white/10 text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">🎃 Уровень ужаса: Любой</option>
                  <option value="3">🎃 3+ ужаса</option>
                  <option value="4">🎃 4+ ужаса</option>
                  <option value="5">🎃 5/5 кошмар</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-[#737373] hidden sm:inline">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-[#201F1F] border border-white/10 text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="popular">По популярности</option>
                  <option value="price_asc">Сначала дешевле</option>
                  <option value="price_desc">Сначала дороже</option>
                  <option value="spooky">Самые жуткие</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
              {filteredProducts.map((prod) => {
                const inCart = cart.find((i) => i.product.id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className="bg-[#1A1A1A] rounded-2xl border border-white/8 hover:border-[#FF5500]/50 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                  >
                    {/* Image Area - click goes to product page */}
                    <div
                      onClick={() => navigateTo('product', prod.id)}
                      className="relative aspect-square w-full bg-[#121212] overflow-hidden cursor-pointer"
                    >
                      {/* Badges */}
                      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[90%]">
                        {prod.badges.includes('hit') && (
                          <span className="bg-[#FF5500] text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                            Хит
                          </span>
                        )}
                        {prod.badges.includes('new') && (
                          <span className="bg-[#0494FC] text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                            Новинка
                          </span>
                        )}
                        {prod.glowInTheDark && (
                          <span className="bg-purple-900/90 text-purple-200 border border-purple-400/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            УФ
                          </span>
                        )}
                      </div>

                      <img
                        src={prod.image}
                        alt={prod.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#A3A3A3]">
                          <span className="bg-[#242424] px-1.5 py-0.5 rounded text-[#E5E2E1]">
                            {prod.weight}
                          </span>
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            ★ {prod.rating}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h3
                          onClick={() => navigateTo('product', prod.id)}
                          className="font-heading font-bold text-xs sm:text-sm text-white group-hover:text-[#FF5500] transition-colors leading-snug cursor-pointer line-clamp-2"
                        >
                          {prod.name}
                        </h3>

                        <p className="text-[11px] text-[#8E8E8E] line-clamp-1">
                          {prod.subtitle}
                        </p>
                      </div>

                      {/* Pricing and Cart Stepper */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                        <div>
                          <div className="font-heading font-extrabold text-sm sm:text-base text-[#FF5500]">
                            {prod.price.toLocaleString('ru-RU')} ₸
                          </div>
                          {prod.oldPrice && (
                            <div className="text-[10px] text-[#737373] line-through font-mono">
                              {prod.oldPrice.toLocaleString('ru-RU')} ₸
                            </div>
                          )}
                        </div>

                        {inCart ? (
                          <div className="flex items-center bg-[#262626] border border-[#00FF66]/50 rounded-xl overflow-hidden p-0.5">
                            <button
                              onClick={() => updateQuantity(prod.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-white hover:text-red-400 rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-mono text-xs font-bold text-[#00FF66]">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(prod.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-white hover:text-[#00FF66] rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(prod, 1)}
                            className="bg-[#262626] hover:bg-[#FF5500] text-white hover:text-black font-heading font-bold text-xs px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-[#FF5500] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Купить</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE 2: PRODUCT DETAIL PAGE
      ======================================================== */}
      {page === 'product' && selectedProduct && (
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigateTo('catalog')}
            className="flex items-center gap-2 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад в каталог</span>
          </button>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
            {/* Left Media */}
            <div className="md:col-span-5 relative bg-[#121212] rounded-2xl overflow-hidden aspect-square sm:aspect-auto sm:min-h-[350px] flex items-center justify-center">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {selectedProduct.badges.map((b) => (
                  <span
                    key={b}
                    className="bg-[#FF5500] text-black font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow"
                  >
                    {b === 'hit' ? 'Хит продаж' : b === 'new' ? 'Новинка' : b === 'in_stock' ? 'В наличии' : 'Скидка'}
                  </span>
                ))}
                {selectedProduct.glowInTheDark && (
                  <span className="bg-[#00FF66] text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Светится в темноте
                  </span>
                )}
              </div>
            </div>

            {/* Right Information */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#A3A3A3]">
                  <span className="bg-[#242424] px-2.5 py-1 rounded-lg text-[#FFB59C] font-semibold">
                    {selectedProduct.weight}
                  </span>
                  <span className="text-[#00FF66] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                    В наличии: {selectedProduct.stockCount} шт.
                  </span>
                </div>

                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-snug">
                  {selectedProduct.name}
                </h1>

                <p className="text-xs sm:text-sm text-[#FF5500] font-semibold">
                  {selectedProduct.subtitle}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <span className="font-bold text-white">{selectedProduct.rating}</span>
                  <span>•</span>
                  <span>{selectedProduct.reviewCount} отзывов</span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed pt-1">
                  {selectedProduct.description}
                </p>

                {/* Sensory gauges */}
                <div className="bg-[#201F1F] rounded-2xl p-3.5 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-[#A3A3A3]">
                    <span>Сладость</span>
                    <div className="w-32 bg-[#2D2D2D] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${selectedProduct.sweetness * 10}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-white">{selectedProduct.sweetness}/10</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-[#A3A3A3]">
                    <span>Кислота</span>
                    <div className="w-32 bg-[#2D2D2D] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#00FF66] h-full rounded-full glow-green-sm"
                        style={{ width: `${selectedProduct.sourness * 10}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[#00FF66]">{selectedProduct.sourness}/10</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-[#A3A3A3]">
                    <span>Уровень жуткости</span>
                    <div className="w-32 bg-[#2D2D2D] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#FF5500] h-full rounded-full glow-orange-sm"
                        style={{ width: `${(selectedProduct.spookiness / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[#FF5500]">{selectedProduct.spookiness}/5</span>
                  </div>
                </div>

                {/* Magical lore */}
                <div className="p-3 bg-[#241A14] border border-[#FF5500]/25 rounded-xl text-xs text-[#E5BEB2] leading-relaxed">
                  <span className="font-bold text-[#FF5500] block mb-0.5">📜 Легенда рецепта:</span>
                  {selectedProduct.lore}
                </div>

                {/* Ingredients */}
                <div className="text-[11px] text-[#8E8E8E] leading-relaxed pt-1">
                  <span className="font-semibold text-white/70 block mb-0.5">Состав и красители:</span>
                  {selectedProduct.ingredients}
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-black text-2xl sm:text-3xl text-[#FF5500]">
                    {(selectedProduct.price * productDetailQty).toLocaleString('ru-RU')} ₸
                  </span>
                  {selectedProduct.oldPrice && (
                    <span className="text-xs text-[#737373] line-through font-mono">
                      {(selectedProduct.oldPrice * productDetailQty).toLocaleString('ru-RU')} ₸
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Quantity selector */}
                  <div className="flex items-center bg-[#262626] border border-white/10 rounded-xl overflow-hidden p-1">
                    <button
                      onClick={() => setProductDetailQty(Math.max(1, productDetailQty - 1))}
                      className="w-8 h-8 flex items-center justify-center text-white hover:text-[#FF5500] rounded cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono text-white">
                      {productDetailQty}
                    </span>
                    <button
                      onClick={() => setProductDetailQty(productDetailQty + 1)}
                      className="w-8 h-8 flex items-center justify-center text-white hover:text-[#00FF66] rounded cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, productDetailQty);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#FF6A1A] hover:to-[#FF5500] text-black font-heading font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-[#FF5500]/30 hover:glow-orange-sm transition-all cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Добавить в корзину</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE 3: CART PAGE
      ======================================================== */}
      {page === 'cart' && (
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button
              onClick={() => navigateTo('catalog')}
              className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Вернуться к покупкам</span>
            </button>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить корзину</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Ваш Колдовской Котёл
            </h1>
            <p className="text-xs text-[#A3A3A3]">
              {cartTotalCount} {cartTotalCount === 1 ? 'позиция' : 'позиций'} в заказе
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20 bg-[#161616] rounded-3xl border border-white/5 space-y-4">
              <span className="text-6xl block animate-spooky-float">🍲</span>
              <h3 className="font-heading font-bold text-xl text-white">
                В вашем котле пустота...
              </h3>
              <p className="text-xs text-[#8E8E8E] max-w-sm mx-auto">
                Добавьте пару мармеладных глаз зомби или шоколадных гробиков, чтобы разжечь магический огонь!
              </p>
              <button
                onClick={() => navigateTo('catalog')}
                className="px-6 py-3 rounded-xl bg-[#FF5500] text-black font-heading font-bold text-xs hover:glow-orange-sm cursor-pointer"
              >
                Перейти в каталог сладостей
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Items List */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Free gift banner */}
                <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#00FF66] shrink-0" />
                  <span>В ваш заказ автоматически добавлен набор светящихся стикеров в подарок!</span>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-[#1A1A1A] border border-white/8 rounded-2xl p-4 flex gap-4 items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-black/40"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-white truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-[#A3A3A3]">
                        {item.product.weight} • {item.product.price.toLocaleString('ru-RU')} ₸ / шт.
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Stepper */}
                        <div className="flex items-center bg-[#262626] border border-white/10 rounded-xl overflow-hidden p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-red-400 rounded cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-[#00FF66] rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="font-heading font-extrabold text-sm sm:text-base text-[#FF5500]">
                          {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₸
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-white/30 hover:text-rose-400 p-2 transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary & Checkout Action */}
              <div className="lg:col-span-5 bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
                <h3 className="font-heading font-extrabold text-lg text-white">
                  Итог заказа
                </h3>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3A3A3]" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="Промокод (SPOOKY)"
                        className="w-full pl-9 pr-3 py-2 bg-[#242424] border border-white/10 rounded-xl text-xs text-white placeholder-[#737373] uppercase focus:outline-none focus:border-[#FF5500]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#2A2A2A] hover:bg-[#383838] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Применить
                    </button>
                  </div>
                  {promoMessage && (
                    <p
                      className={`text-[11px] ${
                        promoMessage.isError ? 'text-rose-400' : 'text-[#00FF66]'
                      }`}
                    >
                      {promoMessage.text}
                    </p>
                  )}
                </form>

                {/* Price Rows */}
                <div className="space-y-2 text-xs border-t border-white/8 pt-3">
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Стоимость товаров</span>
                    <span className="font-mono text-white">
                      {cartSubtotal.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>

                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Доставка</span>
                    <span className={`font-mono ${deliveryPrice === 0 ? 'text-[#00FF66] font-bold' : 'text-white'}`}>
                      {deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice.toLocaleString('ru-RU')} ₸`}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#00FF66] font-bold">
                      <span>Скидка по промокоду ({promoDiscountPercent}%)</span>
                      <span className="font-mono">-{discountAmount.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-heading font-black pt-3 border-t border-white/10 text-white">
                    <span>К оплате</span>
                    <span className="text-[#FF5500] text-xl">
                      {finalTotal.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>

                {/* Go to Checkout Button */}
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#FF6A1A] hover:to-[#FF5500] text-black font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#FF5500]/30 hover:glow-orange transition-all cursor-pointer active:scale-95"
                >
                  <span>Перейти к оформлению</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PAGE 4: CHECKOUT PAGE
      ======================================================== */}
      {page === 'checkout' && (
        <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <button
            onClick={() => navigateTo('cart')}
            className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться в корзину</span>
          </button>

          <div className="space-y-1">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Оформление Заказа
            </h1>
            <p className="text-xs text-[#A3A3A3]">
              Заполните данные для доставки, и заказ мгновенно отправится в наш Telegram-бот
            </p>
          </div>

          {/* Error Message Box */}
          {telegramError && (
            <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Ошибка отправки</span>
                {telegramError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <form onSubmit={handlePlaceOrder} className="md:col-span-7 space-y-4 bg-[#1A1A1A] p-6 rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="font-heading font-bold text-base text-white border-b border-white/8 pb-3">
                Контакты и адрес доставки
              </h2>

              {/* Name field (required) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A3A3A3] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Ваше имя <span className="text-[#FF5500]">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  placeholder="Иван Иванов"
                  className={`w-full px-3.5 py-2.5 bg-[#242424] border rounded-xl text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF5500] ${
                    formErrors.name ? 'border-rose-500' : 'border-white/10'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400">{formErrors.name}</p>
                )}
              </div>

              {/* Phone field (required) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A3A3A3] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Номер телефона <span className="text-[#FF5500]">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => {
                    setFormPhone(e.target.value);
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                  }}
                  placeholder="+7 (777) 123-45-67"
                  className={`w-full px-3.5 py-2.5 bg-[#242424] border rounded-xl text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF5500] ${
                    formErrors.phone ? 'border-rose-500' : 'border-white/10'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-400">{formErrors.phone}</p>
                )}
              </div>

              {/* Address field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A3A3A3] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0494FC]" />
                  <span>Адрес доставки</span>
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="г. Алматы, ул. Абая 10, кв. 5"
                  className="w-full px-3.5 py-2.5 bg-[#242424] border border-white/10 rounded-xl text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Comment field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A3A3A3] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span>Комментарий к заказу</span>
                </label>
                <textarea
                  rows={2}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Оставить у двери, код домофона 42..."
                  className="w-full px-3.5 py-2 bg-[#242424] border border-white/10 rounded-xl text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={telegramSending}
                  className={`w-full py-4 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                    telegramSending
                      ? 'bg-[#262626] text-white/40 cursor-wait'
                      : 'bg-gradient-to-r from-[#00FF66] to-[#00CC52] hover:from-[#26FF7D] hover:to-[#00FF66] text-black hover:glow-green active:scale-95'
                  }`}
                >
                  {telegramSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Отправка в Telegram...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-black" />
                      <span>Оформить заказ</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-[#737373] text-center block mt-2">
                  Без онлайн-оплаты • Оплата при получении заказа
                </span>
              </div>
            </form>

            {/* Right Mini Summary */}
            <div className="md:col-span-5 bg-[#161616] p-5 rounded-3xl border border-white/8 space-y-4">
              <h3 className="font-heading font-bold text-sm text-white">
                Товары в заказе
              </h3>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-black/40"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-[#8E8E8E]">
                        {item.quantity} шт. × {item.product.price.toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                    <span className="font-mono text-[#FF5500] font-bold">
                      {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs border-t border-white/5 pt-3">
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Сумма:</span>
                  <span className="font-mono text-white">{cartSubtotal.toLocaleString('ru-RU')} ₸</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#00FF66] font-bold">
                    <span>Скидка:</span>
                    <span className="font-mono">-{discountAmount.toLocaleString('ru-RU')} ₸</span>
                  </div>
                )}
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Доставка:</span>
                  <span className="font-mono text-[#00FF66]">
                    {deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice.toLocaleString('ru-RU')} ₸`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-heading font-black pt-2 border-t border-white/10 text-white">
                  <span>Итого:</span>
                  <span className="text-[#FF5500] text-lg">
                    {finalTotal.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE 5: THANK-YOU PAGE
      ======================================================== */}
      {page === 'thank-you' && lastOrder && (
        <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center mx-auto glow-green">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#00FF66] uppercase tracking-wider">
              Заказ успешно отправлен в Telegram
            </span>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white">
              Спасибо за заказ!
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3]">
              Номер вашего заказа: <span className="font-mono font-bold text-[#FF5500] text-base">#{lastOrder.orderId}</span>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 text-left space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-sm text-white border-b border-white/8 pb-2">
              Детали доставки
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#737373] block">Имя клиента:</span>
                <span className="text-white font-medium">{lastOrder.name}</span>
              </div>
              <div>
                <span className="text-[#737373] block">Телефон:</span>
                <span className="text-white font-medium">{lastOrder.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#737373] block">Адрес:</span>
                <span className="text-white font-medium">{lastOrder.address || 'Самовывоз / Уточняется'}</span>
              </div>
              {lastOrder.comment && (
                <div className="sm:col-span-2">
                  <span className="text-[#737373] block">Комментарий:</span>
                  <span className="text-white font-medium">{lastOrder.comment}</span>
                </div>
              )}
              <div>
                <span className="text-[#737373] block">Дата и время:</span>
                <span className="text-white font-mono">{lastOrder.dateTime}</span>
              </div>
              <div>
                <span className="text-[#737373] block">Итоговая сумма:</span>
                <span className="text-[#FF5500] font-heading font-black text-sm">
                  {lastOrder.total.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            </div>

            <h4 className="font-heading font-bold text-xs text-white pt-3 border-t border-white/8">
              Заказанные сладости:
            </h4>
            <div className="space-y-1.5 text-xs">
              {lastOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[#CCCCCC]">
                  <span>{idx + 1}. {item.product.name} ({item.quantity} шт.)</span>
                  <span className="font-mono text-white">
                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-[#201F1F] rounded-2xl border border-white/5 text-xs text-[#A3A3A3]">
            🦇 Наш курьер на метле уже собирает ваш заказ. Мы свяжемся с вами по телефону <span className="text-white font-bold">{lastOrder.phone}</span> перед доставкой.
          </div>

          <button
            onClick={() => navigateTo('catalog')}
            className="px-8 py-3.5 rounded-2xl bg-[#FF5500] hover:bg-[#FF661A] text-black font-heading font-bold text-xs hover:glow-orange-sm transition-all cursor-pointer"
          >
            Вернуться в каталог сладостей
          </button>
        </div>
      )}

      {/* ========================================================
          MOBILE-FIRST FIXED BOTTOM NAVIGATION BAR
      ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414] border-t border-white/10 px-4 py-2 flex items-center justify-around backdrop-blur-md">
        <button
          onClick={() => navigateTo('catalog')}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${
            page === 'catalog' ? 'text-[#FF5500]' : 'text-[#8E8E8E]'
          }`}
        >
          <span className="text-lg">🎃</span>
          <span className="text-[10px] font-bold">Каталог</span>
        </button>

        <button
          onClick={() => navigateTo('cart')}
          className={`flex flex-col items-center gap-1 py-1 relative cursor-pointer ${
            page === 'cart' || page === 'checkout' ? 'text-[#00FF66]' : 'text-[#8E8E8E]'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartTotalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#FF5500] text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {cartTotalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">
            {cartSubtotal > 0 ? `${cartSubtotal.toLocaleString('ru-RU')} ₸` : 'Корзина'}
          </span>
        </button>
      </div>

      {/* Atmospheric Footer */}
      <footer className="bg-[#0E0E0E] border-t border-white/8 py-8 px-4 text-center text-xs text-[#737373] mt-auto">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-heading font-bold text-white text-sm">
            Midnight <span className="text-[#00FF66]">Candy</span> — Полночная Кондитерская
          </p>
          <p>Цены указаны в казахстанских тенге (₸) • Доставка по всему Казахстану</p>
          <p className="text-[10px] text-white/30">© 2026 Midnight Confectionery. Все права защищены тёмными силами.</p>
        </div>
      </footer>
    </div>
  );
}
