// src/components/storefront/ShopPageInner.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ShopSection from "@/components/storefront/ShopSection";
import { useStorefrontContext } from "@/context/StorefrontContext";
import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

const VALID_CATEGORIES = new Set(CATEGORY_OPTIONS.map((c) => c.value));

export default function ShopPageInner() {
  const searchParams = useSearchParams();
  const { setCategory } = useStorefrontContext();

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && VALID_CATEGORIES.has(cat as Category)) {
      setCategory(cat as Category);
    } else {
      setCategory(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return <ShopSection />;
}