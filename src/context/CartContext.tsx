// src/context/CartContext.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { InventoryItem } from "@/types/inventory";

/* ─── Types ───────────────────────────────────────────────────────────────── */

export type CartItem = {
  inventoryId: number;
  sku:         string;
  name:        string;
  unitPriceCents: number;
  thumbnailUrl: string | null;
};

type CartContextValue = {
  items:      CartItem[];
  count:      number;
  add:        (item: CartItem) => void;
  remove:     (inventoryId: number) => void;
  has:        (inventoryId: number) => boolean;
  clear:      () => void;
};

/* ─── Context ─────────────────────────────────────────────────────────────── */

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ll-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Load from localStorage once on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  /* Persist to localStorage on every change (after hydration) */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) =>
      prev.some((i) => i.inventoryId === item.inventoryId) ? prev : [...prev, item]
    );
  }, []);

  const remove = useCallback((inventoryId: number) => {
    setItems((prev) => prev.filter((i) => i.inventoryId !== inventoryId));
  }, []);

  const has = useCallback(
    (inventoryId: number) => items.some((i) => i.inventoryId === inventoryId),
    [items]
  );

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, count: items.length, add, remove, has, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}