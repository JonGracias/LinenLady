"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useInventoryContext } from "@/context/InventoryContext";
import FeaturedItemCard from "@/components/storefront/FeaturedItemCard";
import HeroBanner, { buildSlidesFromItems } from "@/components/storefront/HeroBanner";
import { CATEGORY_OPTIONS } from "@/types/inventory";



function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
      style={{ color: "var(--sage-deep)" }}
    >
      <span
        className="inline-block h-px w-8 shrink-0"
        style={{ background: "var(--sage-deep)" }}
      />
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <h2
      className={`ll-display font-normal leading-snug ${center ? "text-center" : ""}`}
      style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}
    >
      {children}
    </h2>
  );
}

/* ─────────────────────────────────────────────────────────────
   Homepage
───────────────────────────────────────────────────────────── */

export default function HomePage() {
  const {
    sorted,
    loading,
    ensureThumbnail,
    getThumbnailUrl,
    setFilter,
  } = useInventoryContext();

  // Always show published items on the public homepage
  useEffect(() => {
    setFilter("published");
  }, [setFilter]);

  // Featured items for the card grid (IsFeatured first, fall back to newest 4)
  const featuredItems = sorted.filter((i) => i.IsFeatured).slice(0, 4);
  const displayItems  = featuredItems.length >= 2 ? featuredItems : sorted.slice(0, 4);

  // Recently added — newest items not already in displayItems
  const displayIds    = new Set(displayItems.map((i) => i.InventoryId));
  const recentItems   = sorted
    .filter((i) => !displayIds.has(i.InventoryId))
    .slice(0, 3);

  // Pre-fetch thumbnails
  useEffect(() => {
    [...displayItems, ...recentItems].forEach((item) =>
      ensureThumbnail(item.InventoryId)
    );
  }, [displayItems, recentItems, ensureThumbnail]);

  // Build banner slides from featured/active inventory
  const bannerSlides = buildSlidesFromItems(
    sorted.filter((i) => i.IsFeatured || i.IsActive).slice(0, 6),
    getThumbnailUrl
  );

  return (
    <div
      className="ll-texture-overlay relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
    >
      {/* Texture layer */}
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      {/* ══════════════════════════════════════════════════════
          1. HERO GALLERY BANNER
      ══════════════════════════════════════════════════════ */}
      <div className="relative z-[1]">
        <HeroBanner slides={bannerSlides} interval={6000} />
      </div>

      {/* ── Trust strip ── */}
      <div
        className="relative z-[2] flex items-center justify-center overflow-hidden"
        style={{ background: "var(--ink)" }}
      >
        <div className="flex flex-wrap items-center justify-center">
          {[
            "Georgetown Flea Market",
            "Since 1994",
            "Washington D.C.",
            "Antique & Vintage Linens",
          ].map((item, i, arr) => (
            <React.Fragment key={item}>
              <span
                className="ll-label px-10 py-[1.1rem] text-[0.65rem] uppercase tracking-[0.2em] whitespace-nowrap"
                style={{ color: "var(--rose-light)" }}
              >
                {item}
              </span>
              {i < arr.length - 1 && (
                <span className="text-[0.5rem] opacity-60" style={{ color: "var(--rose-deep)" }}>
                  ◆
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. FEATURED PIECES
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] px-16 py-24"
        style={{ background: "var(--cream-dark)" }}
      >
        <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Handpicked This Week</SectionLabel>
            <SectionTitle>
              Featured{" "}
              <em className="italic" style={{ color: "var(--rose-deep)" }}>
                Pieces
              </em>
            </SectionTitle>
          </div>
        </div>

        {loading ? (
          <div
            className="ll-label py-20 text-center text-[0.75rem] uppercase tracking-[0.2em]"
            style={{ color: "var(--ink-soft)" }}
          >
            Loading collection…
          </div>
        ) : displayItems.length === 0 ? (
          <div
            className="ll-body py-20 text-center text-lg italic"
            style={{ color: "var(--brown-light)" }}
          >
            New pieces arriving soon.
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {displayItems.map((item) => (
              <FeaturedItemCard
                key={item.InventoryId}
                item={item}
                thumbnailUrl={getThumbnailUrl(item.InventoryId)}
              />
            ))}
          </div>
        )}

        {/* ── Big "All Items" button ── */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/shop"
            className="ll-label group relative inline-flex items-center gap-4 border-2 px-14 py-5 text-[0.8rem] font-medium uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(176,120,120,0.25)]"
            style={{
              borderColor: "var(--rose-deep)",
              color: "var(--rose-deep)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--rose-deep)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--rose-deep)";
            }}
          >
            <span>Browse All Items</span>
            <span className="text-lg leading-none">→</span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. SHOP BY CATEGORY
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] px-16 py-20"
        style={{
          background: "linear-gradient(135deg, var(--sage-light) 0%, var(--cream-dark) 100%)",
        }}
      >
        <div className="mb-12 text-center">
          <div
            className="ll-label mb-3 inline-flex items-center justify-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
            style={{ color: "var(--sage-deep)" }}
          >
            What You&apos;ll Find
          </div>
          <SectionTitle center>
            Shop{" "}
            <em className="italic" style={{ color: "var(--rose-deep)" }}>
              by Category
            </em>
          </SectionTitle>
        </div>

        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            background: "var(--linen)",
          }}
        >
          {[
            { icon: "🪡", name: "Antique Linens",  sub: "Tablecloths · Napkins · Runners", cat: "tablecloth" },
            { icon: "🧵", name: "Lace & Embroidery", sub: "Needle lace · Broderie",         cat: "lace"       },
            { icon: "🛏️", name: "Bed Linens",       sub: "Sheets · Shams · Coverlets",      cat: "bed linen"  },
            { icon: "🏺", name: "Table & Home",     sub: "Placemats · Runners · Doilies",    cat: "runner"     },
            { icon: "🧣", name: "Quilts & Blankets", sub: "Quilts · Throws · Blankets",      cat: "quilt"      },
            { icon: "🔮", name: "All Pieces",       sub: "Browse everything",                cat: null         },
          ].map(({ icon, name, sub, cat }) => (
            <Link
              key={name}
              href={cat ? `/shop?category=${cat}` : "/shop"}
              className="block cursor-pointer px-6 py-10 text-center transition-colors duration-200"
              style={{ background: "var(--cream)", textDecoration: "none" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--rose-light)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--cream)")
              }
            >
              <span className="mb-3 block text-3xl">{icon}</span>
              <div
                className="ll-display text-sm italic"
                style={{ color: "var(--ink)" }}
              >
                {name}
              </div>
              <div
                className="ll-label mt-1 text-[0.58rem] uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-soft)" }}
              >
                {sub}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. JUST ARRIVED
      ══════════════════════════════════════════════════════ */}
      {recentItems.length > 0 && (
        <section
          className="relative z-[1] px-16 py-20"
          style={{ background: "var(--cream)" }}
        >
          <div className="mb-12 flex items-end justify-between">
            <div>
              <SectionLabel>Fresh to the Booth</SectionLabel>
              <SectionTitle>
                Just{" "}
                <em className="italic" style={{ color: "var(--rose-deep)" }}>
                  Arrived
                </em>
              </SectionTitle>
            </div>
            <Link
              href="/shop"
              className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors"
              style={{
                color: "var(--sage-deep)",
                textDecoration: "none",
                borderBottom: "1px solid var(--sage)",
                paddingBottom: 2,
              }}
            >
              See all →
            </Link>
          </div>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {recentItems.map((item) => (
              <FeaturedItemCard
                key={item.InventoryId}
                item={item}
                thumbnailUrl={getThumbnailUrl(item.InventoryId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          5. MARKET SCHEDULE
      ══════════════════════════════════════════════════════ */}
      <section
        id="schedule"
        className="relative z-[1] grid items-center gap-24 px-16 py-24"
        style={{ gridTemplateColumns: "1fr 1fr", background: "var(--cream-dark)" }}
      >
        <div>
          <SectionLabel>Find Noemi</SectionLabel>
          <SectionTitle>
            Visit Us at the{" "}
            <em className="italic" style={{ color: "var(--rose-deep)" }}>
              Market
            </em>
          </SectionTitle>
          <p
            className="ll-body mt-6 text-base font-light leading-[1.8]"
            style={{ color: "var(--ink-soft)" }}
          >
            Come find us rain or shine. Noemi&apos;s booth has been in the same
            spot for over thirty years — look for the linens. You can&apos;t
            miss it.
          </p>
          <p
            className="ll-body mt-4 text-base font-light leading-[1.8]"
            style={{ color: "var(--ink-soft)" }}
          >
            Every Sunday is different. New pieces arrive each week, and no two
            visits are ever quite the same.
          </p>
        </div>

        {/* Card */}
        <div
          className="relative border p-12"
          style={{ borderColor: "var(--linen)", background: "var(--cream)" }}
        >
          <div
            className="absolute left-[-1px] top-[-1px] h-10 w-10 border-l-[3px] border-t-[3px]"
            style={{ borderColor: "var(--rose)" }}
          />
          <div
            className="absolute bottom-[-1px] right-[-1px] h-10 w-10 border-b-[3px] border-r-[3px]"
            style={{ borderColor: "var(--sage)" }}
          />

          <div
            className="ll-display mb-1 text-2xl font-normal"
            style={{ color: "var(--ink)" }}
          >
            Georgetown Flea Market
          </div>
          <div
            className="ll-label mb-8 text-[0.65rem] uppercase tracking-[0.15em]"
            style={{ color: "var(--sage-deep)" }}
          >
            1819 35th St NW · Washington, D.C.
          </div>

          {[
            { day: "Sunday",  time: "8:00 am — 4:00 pm" },
            { day: "Season",  time: "Year-round"         },
            { day: "Booth",   time: "Ask for Noemi"      },
          ].map(({ day, time }, i, arr) => (
            <div
              key={day}
              className="flex items-baseline justify-between py-2.5"
              style={{
                borderBottom: i < arr.length - 1 ? "1px dashed var(--linen)" : "none",
              }}
            >
              <span
                className="ll-label text-[0.7rem] font-medium uppercase tracking-[0.1em]"
                style={{ color: "var(--ink-soft)" }}
              >
                {day}
              </span>
              <span className="ll-body italic" style={{ color: "var(--rose-deep)" }}>
                {time}
              </span>
            </div>
          ))}

          <p
            className="ll-body mt-6 text-sm font-light italic leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Hours subject to market schedule.{" "}
            <a href="#contact" style={{ color: "var(--rose-deep)" }}>
              Send a message
            </a>{" "}
            before making a special trip.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. INQUIRE CTA
      ══════════════════════════════════════════════════════ */}
      <section
        id="contact"
        className="relative z-[1] grid items-center gap-12 px-16 py-20"
        style={{ background: "var(--rose-deep)", gridTemplateColumns: "1fr auto" }}
      >
        <div>
          <h2
            className="ll-display font-normal leading-snug"
            style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "var(--cream)" }}
          >
            Interested in a{" "}
            <em className="italic" style={{ color: "var(--rose-light)" }}>
              piece?
            </em>
          </h2>
          <p
            className="ll-body mt-2 text-base font-light"
            style={{ color: "var(--rose-light)" }}
          >
            Every item is one of a kind. Reach out to ask about availability,
            reserve something, or describe what you&apos;re looking for.
          </p>
        </div>
        <a
          href="mailto:noemi@linenlady.com"
          className="ll-label inline-block whitespace-nowrap px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:bg-white"
          style={{ background: "var(--cream)", color: "var(--rose-deep)" }}
        >
          Get in Touch
        </a>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. OUR STORY (teaser — full story at /about)
      ══════════════════════════════════════════════════════ */}
      <section
        id="about"
        className="relative z-[1] grid min-h-[60vh]"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Image side */}
        <div
          className="ll-embroidery-bg relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, var(--sage-light) 0%, var(--linen) 60%, var(--rose-light) 100%)",
          }}
        >
          {/* Swap this div for an <img> when a photo is available */}
          <div
            className="absolute inset-8 flex items-center justify-center ll-display text-base italic"
            style={{
              background: "var(--cream-dark)",
              color: "var(--brown-light)",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            Photo of Noemi at her booth
          </div>
        </div>

        {/* Text side */}
        <div
          className="flex flex-col justify-center px-16 py-20"
          style={{ background: "var(--cream)" }}
        >
          <SectionLabel>The Story</SectionLabel>
          <SectionTitle>
            Thirty Years of{" "}
            <em className="italic" style={{ color: "var(--rose-deep)" }}>
              Sunday Mornings
            </em>
          </SectionTitle>

          <p
            className="ll-body mt-6 text-[1.05rem] font-light leading-[1.85]"
            style={{ color: "var(--ink-soft)" }}
          >
            Since 1994, <strong style={{ fontWeight: 400, color: "var(--ink)" }}>Noemi</strong> has
            been a fixture at the Georgetown Flea Market — a destination for collectors,
            interior designers, and anyone who has ever stopped in front of a perfectly
            embroidered tablecloth and felt something.
          </p>

          <blockquote
            className="ll-display my-8 border-l-[3px] py-4 pl-6 pr-4 text-[1.15rem] italic leading-relaxed"
            style={{
              borderColor: "var(--rose)",
              color: "var(--brown)",
              background: "linear-gradient(135deg, #fdf5f5, var(--cream))",
            }}
          >
            &ldquo;Every piece has been chosen with care. She shows up every
            Sunday morning because she loves what she does.&rdquo;
          </blockquote>

          <p
            className="ll-body text-[1.05rem] font-light leading-[1.85]"
            style={{ color: "var(--ink-soft)" }}
          >
            Over the decades, Noemi has been approached for television shows and retail
            investments. She has turned them all down. The market is where she belongs.
          </p>

          <Link
            href="/about"
            className="ll-label mt-8 inline-flex w-fit items-center gap-2 border px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200"
            style={{
              color: "var(--sage-deep)",
              borderColor: "var(--sage)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--sage-light)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            Read the Full Story →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      
    </div>
  );
}