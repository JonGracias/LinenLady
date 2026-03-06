// src/contexts/ItemAiContext.tsx
"use client";

import { createContext, useCallback, useContext, useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

type ItemAiState = {
  keywordsGeneratedAt: string | null;
  seoGeneratedAt:      string | null;
};

type ItemAiContextValue = ItemAiState & {
  notifyKeywordsUpdated: (keywordsGeneratedAt: string, seoGeneratedAt?: string | null) => void;
};

/* ── Context ────────────────────────────────────────────────────────────── */

const ItemAiContext = createContext<ItemAiContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────────────────── */

export function ItemAiProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ItemAiState>({
    keywordsGeneratedAt: null,
    seoGeneratedAt:      null,
  });

  const notifyKeywordsUpdated = useCallback(
    (keywordsGeneratedAt: string, seoGeneratedAt?: string | null) => {
      setState({
        keywordsGeneratedAt,
        seoGeneratedAt: seoGeneratedAt ?? null,
      });
    },
    []
  );

  return (
    <ItemAiContext.Provider value={{ ...state, notifyKeywordsUpdated }}>
      {children}
    </ItemAiContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────────────────── */

export function useItemAi(): ItemAiContextValue {
  const ctx = useContext(ItemAiContext);
  if (!ctx) throw new Error("useItemAi must be used within an ItemAiProvider");
  return ctx;
}