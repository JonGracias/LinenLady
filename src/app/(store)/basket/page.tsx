// src/app/(store)/basket/page.tsx
//
// Standalone basket page — replaces the basket tab inside /account.
//
// Reachable signed-out: anonymous customers see their localStorage-held
// items, totals, and a "Sign in to Check Out" CTA. Reachable signed-in:
// they see their server-held reservations and can check out directly.
//
// The data and mutations all live in CustomerSessionContext; this page
// is just composition (layout chrome + delegates to BasketTab).
//
// Phase 1 design note: anonymous customers cannot complete checkout
// without signing in. Phase 2 will add guest checkout — at that point
// the "Sign in to Check Out" CTA gets a sibling "Continue as Guest"
// option. The BasketTab component already has the rendering shape for
// both modes; the gating lives in CheckoutPanel.

"use client";

import Link from "next/link";
import BasketTab from "../account/_components/BasketTab";
import { useCustomerSession } from "@/context/CustomerSessionContext";

export default function BasketPage() {
  // The session context owns all data. We only need loading state here
  // for the initial-render flash; everything else is pushed into BasketTab.
  const { loading } = useCustomerSession();

  // Loading state — match the /account page's spinner so the visual
  // transition from "click basket icon in header" to "see basket" is
  // calm. Once data arrives, BasketTab takes over and renders the right
  // surface for signed-in vs signed-out.
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div
          className="ll-label text-[0.72rem] uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-soft)" }}
        >
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div
      className="ll-texture-overlay min-h-screen"
      style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
    >
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      {/* Page header — narrower than the /account page since there's no
          tab strip below. Keeps the same visual language though: small
          eyebrow label, big italic accented heading. */}
      <div
        className="relative z-[1] border-b px-16 py-12"
        style={{
          borderColor: "var(--linen)",
          background: "linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)",
        }}
      >
        <div
          className="ll-label mb-2 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--sage-deep)" }}
        >
          Your Basket
        </div>
        <h1
          className="ll-display font-normal"
          style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}
        >
          Pieces You&apos;re{" "}
          <em className="italic" style={{ color: "var(--rose-deep)" }}>Considering</em>
        </h1>
        <p
          className="ll-body mt-2 text-sm font-light"
          style={{ color: "var(--ink-soft)" }}
        >
          Heritage linens are one of a kind. Pieces held here are reserved while you decide.
        </p>
      </div>

      {/* Content area — same horizontal padding as /account so the basket
          UI lays out identically whether the customer lands here directly
          or used to land in /account?tab=basket. */}
      <div className="relative z-[1] px-16 py-12">
        <BasketTab />
      </div>

      <footer
        className="relative z-[1] px-16 pb-8 pt-12"
        style={{ background: "var(--ink)", color: "var(--cream-dark)" }}
      >
        <div
          className="ll-label flex flex-wrap items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <span>© 2025 Noemi · The Linen Lady · Washington D.C.</span>
          <Link
            href="/shop"
            className="ll-label"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            ← Browse the Collection
          </Link>
        </div>
      </footer>
    </div>
  );
}
