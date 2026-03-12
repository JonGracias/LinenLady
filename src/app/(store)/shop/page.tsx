"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useInventoryContext } from "@/context/InventoryContext";
import { CATEGORY_OPTIONS, type Category } from "@/types/inventory";
import FeaturedItemCard from "@/components/storefront/FeaturedItemCard";

/* ─────────────────────────────────────────────────────────────
   Border motif (shared with homepage)
───────────────────────────────────────────────────────────── */

function BorderMotif() {
  return (
    <div
      className="h-3 w-full opacity-60"
      style={{
        background: `repeating-linear-gradient(
          90deg,
          #b07878 0px, #b07878 8px,
          transparent 8px, transparent 16px,
          #8fad94 16px, #8fad94 24px,
          transparent 24px, transparent 32px,
          #ecdcdc 32px, #ecdcdc 40px,
          transparent 40px, transparent 48px
        )`,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Shop page
───────────────────────────────────────────────────────────── */

export default function ShopPage() {
  const {
    sorted,
    loading,
    error,
    ensureThumbnail,
    getThumbnailUrl,
    category,
    setCategory,
    setFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
  } = useInventoryContext();

  // Force published-only view for the public shop
  useEffect(() => {
    setFilter("published");
  }, [setFilter]);

  // Pre-fetch thumbnails for visible items
  useEffect(() => {
    sorted.forEach((item) => ensureThumbnail(item.InventoryId));
  }, [sorted, ensureThumbnail]);

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (item) =>
        item.Name.toLowerCase().includes(q) ||
        item.Description?.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  return (
    <div
      className="ll-texture-overlay min-h-screen"
      style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
    >
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      <BorderMotif />

      {/* ── Nav ── */}
      <nav
        className="relative z-10 flex items-center justify-between border-b px-12 py-5"
        style={{ borderColor: "var(--linen)", backgroundColor: "var(--cream)" }}
      >
        <Link
          href="/"
          className="ll-display text-lg italic"
          style={{ color: "var(--brown)", letterSpacing: "0.02em", textDecoration: "none" }}
        >
          Noemi{" "}
          <span style={{ fontStyle: "normal", color: "var(--rose-deep)" }}>
            · The Linen Lady
          </span>
        </Link>
        <ul className="flex list-none gap-10">
          {[
            { href: "/shop",     label: "Shop"      },
            { href: "/about",    label: "Our Story"  },
            { href: "/#schedule", label: "Find Us"   },
            { href: "/#contact",  label: "Inquire"   },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="ll-label text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:text-[#b07878]"
                style={{ color: "var(--ink-soft)", textDecoration: "none" }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Page header ── */}
      <div
        className="relative z-[1] border-b px-16 py-16"
        style={{
          borderColor: "var(--linen)",
          background: "linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)",
        }}
      >
        <div
          className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--sage-deep)" }}
        >
          <span
            className="inline-block h-px w-8"
            style={{ background: "var(--sage-deep)" }}
          />
          The Collection
        </div>
        <h1
          className="ll-display mb-2 font-normal"
          style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", color: "var(--ink)" }}
        >
          All{" "}
          <em className="italic" style={{ color: "var(--rose-deep)" }}>
            Items
          </em>
        </h1>
        <p
          className="ll-body mt-3 max-w-xl text-base font-light leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          Every piece is one of a kind. Browse the full collection — if something catches
          your eye, reach out to inquire about availability.
        </p>

        {/* Search */}
        <div className="mt-8 flex max-w-sm items-center border" style={{ borderColor: "var(--linen)" }}>
          <input
            type="text"
            placeholder="Search pieces…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ll-body flex-1 bg-transparent px-4 py-3 text-sm font-light outline-none placeholder:italic"
            style={{ color: "var(--ink)", caretColor: "var(--rose-deep)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ll-label px-3 py-3 text-[0.7rem] transition-colors"
              style={{ color: "var(--ink-soft)" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter bar ── */}
      <div
        className="relative z-[1] flex items-center gap-0 overflow-x-auto border-b"
        style={{ borderColor: "var(--linen)", background: "var(--cream)" }}
      >
        <button
          onClick={() => setCategory(null)}
          className="ll-label shrink-0 border-b-2 px-6 py-4 text-[0.62rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200"
          style={{
            borderColor: category === null ? "var(--rose-deep)" : "transparent",
            color: category === null ? "var(--rose-deep)" : "var(--ink-soft)",
            background: "transparent",
          }}
        >
          All
        </button>
        {CATEGORY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className="ll-label shrink-0 border-b-2 px-6 py-4 text-[0.62rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200"
            style={{
              borderColor: category === value ? "var(--rose-deep)" : "transparent",
              color: category === value ? "var(--rose-deep)" : "var(--ink-soft)",
              background: "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="relative z-[1] px-16 py-12">
        {/* Result count */}
        <div
          className="ll-label mb-8 text-[0.65rem] uppercase tracking-[0.15em]"
          style={{ color: "var(--ink-soft)" }}
        >
          {loading
            ? "Loading…"
            : `${totalCount} ${totalCount === 1 ? "piece" : "pieces"}${
                category ? ` in ${CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category}` : ""
              }`}
        </div>

        {error ? (
          <div
            className="ll-body py-20 text-center text-lg italic"
            style={{ color: "var(--brown-light)" }}
          >
            Something went wrong loading the collection. Please try again.
          </div>
        ) : loading ? (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden border"
                style={{ borderColor: "var(--linen)" }}
              >
                <div
                  className="aspect-[4/3]"
                  style={{ background: "var(--linen)" }}
                />
                <div className="space-y-2 p-5">
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ background: "var(--linen)" }}
                  />
                  <div
                    className="h-3 w-full rounded"
                    style={{ background: "var(--linen)" }}
                  />
                  <div
                    className="h-3 w-1/2 rounded"
                    style={{ background: "var(--linen)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-4 text-4xl opacity-30">🪡</div>
            <p
              className="ll-display text-xl italic"
              style={{ color: "var(--brown-light)" }}
            >
              {searchQuery ? `No pieces matching "${searchQuery}"` : "No pieces in this category yet."}
            </p>
            {(searchQuery || category) && (
              <button
                onClick={() => { setSearchQuery(""); setCategory(null); }}
                className="ll-label mt-6 border px-6 py-2.5 text-[0.65rem] uppercase tracking-[0.15em] transition-colors hover:bg-[#ecdcdc]"
                style={{ color: "var(--sage-deep)", borderColor: "var(--sage)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {filtered.map((item) => (
              <FeaturedItemCard
                key={item.InventoryId}
                item={item}
                thumbnailUrl={getThumbnailUrl(item.InventoryId)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="ll-label border px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.15em] transition-colors disabled:opacity-30"
              style={{
                borderColor: "var(--linen)",
                color: "var(--ink-soft)",
                background: "transparent",
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="ll-label px-2 text-[0.65rem]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="ll-label h-9 w-9 border text-[0.65rem] transition-colors"
                    style={{
                      borderColor: p === page ? "var(--rose-deep)" : "var(--linen)",
                      background: p === page ? "var(--rose-deep)" : "transparent",
                      color: p === page ? "#fff" : "var(--ink-soft)",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="ll-label border px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.15em] transition-colors disabled:opacity-30"
              style={{
                borderColor: "var(--linen)",
                color: "var(--ink-soft)",
                background: "transparent",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <BorderMotif />

      {/* ── Footer ── */}
      <footer
        className="relative z-[1] px-16 pb-8 pt-12"
        style={{ background: "var(--ink)", color: "var(--cream-dark)" }}
      >
        <div
          className="mb-8 flex items-center justify-between border-b pb-8"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="ll-display text-xl italic"
            style={{ color: "var(--rose-light)" }}
          >
            Noemi · The Linen Lady
          </div>
          <address
            className="ll-body not-italic text-sm font-light"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Georgetown Flea Market · 1819 35th St NW · Sundays 8am–4pm
          </address>
        </div>
        <div
          className="ll-label flex flex-wrap items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <span>© 2025 Noemi · The Linen Lady · Washington D.C.</span>
          <span>Handpicked since 1994</span>
        </div>
      </footer>
    </div>
  );
}