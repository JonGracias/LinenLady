// src/app/(store)/shop/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ShopSection from "@/components/storefront/ShopSection";
import { useStorefrontContext } from "@/context/StorefrontContext";
import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

const VALID_CATEGORIES = new Set(CATEGORY_OPTIONS.map((c) => c.value));

export default function ShopPage() {
  const searchParams = useSearchParams();
  const { setCategory } = useStorefrontContext();

  /* Sync ?category= URL param → context on mount */
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && VALID_CATEGORIES.has(cat as Category)) {
      setCategory(cat as Category);
    } else {
      setCategory(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div
      className="ll-texture-overlay min-h-screen"
      style={{ background: "var(--surface)", color: "var(--on-surface)" }}
    >
      {/* Page header */}
      <div
        className="px-6 md:px-10 pt-10 pb-6"
        style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
      >
        <p
          className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--primary)" }}
        >
          Browse
        </p>
        <h1
          className="ll-display font-normal leading-tight"
          style={{ fontSize: "clamp(1.8rem, 3vw, 3rem)", color: "var(--on-surface)", letterSpacing: "-0.01em" }}
        >
          The{" "}
          <em className="italic" style={{ color: "var(--primary)" }}>Collection</em>
        </h1>
        <p
          className="ll-body mt-2 max-w-lg text-sm font-light leading-relaxed"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Every piece is one of a kind. Browse the full archive — if something catches your eye,
          reach out to inquire about availability.
        </p>
      </div>
      <Suspense fallback={null}>
        <ShopSection />
      </Suspense>
    </div>
  );
}