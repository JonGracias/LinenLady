// src/components/storefront/DesktopItemCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { InventoryItem } from "@/types/inventory";
import { useBasket } from "@/context/BasketContext";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  item:         InventoryItem;
  thumbnailUrl: string | null;
};

export default function DesktopItemCard({ item, thumbnailUrl }: Props) {
  const { add, remove, has } = useBasket();
  const { isSignedIn }       = useUser();
  const router               = useRouter();
  const [busy, setBusy]      = useState(false);
  const [hint, setHint]      = useState<string | null>(null);

  const inBasket = has(item.inventoryId);

  // Add or remove. Async because the signed-in path round-trips the API.
  // We optimistically suppress double-clicks via `busy` rather than locally
  // toggling the UI — `has(...)` is the source of truth, and the basket
  // context updates it as soon as the API call resolves.
  const toggleBasket = async (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate via the wrapping <Link>
    if (busy) return;
    setBusy(true);
    setHint(null);
    try {
      if (inBasket) {
        await remove(item.inventoryId);
      } else {
        const result = await add({
          inventoryId:    item.inventoryId,
          sku:            item.sku,
          name:           item.name,
          unitPriceCents: item.unitPriceCents,
          thumbnailUrl,
        });

        // Reasoned error surfacing — distinct messages for distinct UX
        // outcomes. "already_in_basket" is a no-op (state will reflect it).
        if (!result.ok) {
          if (result.reason === "needs_email_verify") {
            setHint("Verify your email before adding pieces.");
          } else if (result.reason === "held_by_other") {
            setHint("Another customer just grabbed this piece.");
          } else if (result.reason === "needs_signin") {
            // Currently impossible (anonymous adds use localStorage), kept
            // for completeness if we ever decide to gate behind sign-in.
            const here = window.location.pathname + window.location.search;
            router.push(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
          } else if (result.reason !== "already_in_basket") {
            setHint(result.message || "Couldn't add that piece.");
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/shop/${item.sku}`}
      className="group relative block overflow-hidden transition-all duration-400"
      style={{ textDecoration: "none", background: "var(--surface-bright)", borderRadius: "0.25rem" }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4", background: "var(--surface-container-highest)" }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
            style={{ transitionTimingFunction: "ease-in-out" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center ll-display text-2xl italic" style={{ color: "var(--outline-variant)" }}>
            {process.env.NEXT_PUBLIC_STORE_NAME}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-5 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: "linear-gradient(to top, rgba(30,27,26,0.55) 0%, transparent 55%)" }}
        >
          <span className="btn-primary text-[0.6rem] px-5 py-2.5">
            View Piece
          </span>
          <button
            onClick={toggleBasket}
            disabled={busy}
            className="ll-label text-[0.55rem] uppercase tracking-[0.12em] px-4 py-1.5 transition-all duration-300 disabled:opacity-50"
            style={{
              background:   inBasket ? "var(--primary)" : "rgba(253,250,246,0.15)",
              color:        inBasket ? "var(--on-primary)" : "rgba(253,250,246,0.9)",
              border:       inBasket ? "1px solid var(--primary)" : "1px solid rgba(253,250,246,0.35)",
              borderRadius: "0.2rem",
              backdropFilter: "blur(4px)",
              cursor:         busy ? "wait" : "pointer",
            }}
          >
            {busy
              ? (inBasket ? "Removing…" : "Adding…")
              : inBasket ? "✓ In Basket" : "+ Add to Basket"}
          </button>
        </div>

        {/* Featured badge */}
        {item.isFeatured && (
          <div className="absolute left-0 top-4">
            <span
              className="ll-label px-3 py-1 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div
        className="px-4 pb-5 pt-3 transition-all duration-400 group-hover:shadow-ambient"
        style={{ background: "var(--surface-bright)" }}
      >
        <div
          className="ll-display mb-1 text-sm font-normal leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.005em" }}
        >
          {item.name}
        </div>

        {item.description && (
          <p className="ll-body mb-3 line-clamp-1 text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="ll-label text-sm font-medium" style={{ color: "var(--primary)" }}>
            {formatPrice(item.unitPriceCents)}
          </span>

          <button
            onClick={toggleBasket}
            disabled={busy}
            className="ll-label text-[0.52rem] uppercase tracking-[0.12em] px-2.5 py-1 transition-all duration-300 disabled:opacity-50"
            style={{
              background:   inBasket ? "var(--primary)" : "transparent",
              color:        inBasket ? "var(--on-primary)" : "var(--on-surface-variant)",
              border:       inBasket ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.3)",
              borderRadius: "0.2rem",
              cursor:       busy ? "wait" : "pointer",
            }}
          >
            {busy ? "…" : inBasket ? "✓ Added" : "+ Add"}
          </button>
        </div>

        {/* Inline error hint — clears on the next interaction. Kept short
            because the card is space-constrained. */}
        {hint && (
          <p className="ll-body mt-2 text-[0.65rem] italic" style={{ color: "#991b1b" }}>
            {hint}
          </p>
        )}
      </div>
    </Link>
  );
}
