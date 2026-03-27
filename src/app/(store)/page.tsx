// src/app/(store)/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStorefrontContext } from "@/context/StorefrontContext";
import ShopSection from "@/components/storefront/ShopSection";
import CategoryGrid from "@/components/storefront/CategoryGrid";
import HeroBanner, { type BannerSlide } from "@/components/storefront/HeroBanner";
import { SitePhoto } from "@/components/shared/SitePhoto";

type HeroSlideDto = {
  SlideId:   number;
  Heading:   string | null;
  Subtext:   string | null;
  LinkUrl:   string | null;
  LinkLabel: string | null;
  IsActive:  boolean;
  SortOrder: number;
  Media:     { ReadUrl: string | null } | null;
};

/* Reusable section title used by CategoryGrid and inline sections */
function SectionTitle({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <h2
      className="ll-display font-normal leading-tight"
      style={{
        fontSize:      "clamp(1.5rem, 2.5vw, 2.2rem)",
        color:         "var(--on-surface)",
        letterSpacing: "-0.01em",
        textAlign:     center ? "center" : "left",
      }}
    >
      {children}
    </h2>
  );
}

export default function HomePage() {
  const { items: _items } = useStorefrontContext();
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);

  useEffect(() => {
    fetch("/api/site/hero")
      .then((r) => r.ok ? r.json() : [])
      .then((data: HeroSlideDto[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const slides: BannerSlide[] = data.map((s) => ({
          photoUrl:      s.Media?.ReadUrl ?? undefined,
          headline:      s.Heading        ?? "Curators of Antique & Vintage Linens",
          sub:           s.Subtext        ?? undefined,
          href:          s.LinkUrl        ?? "/shop",
          cta:           s.LinkLabel      ?? "Explore the Collection",
          secondaryHref: "/#schedule",
          secondaryCta:  "View Archive",
        }));
        setBannerSlides(slides);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="ll-texture-overlay" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>

      {/* ── 1. Hero ── */}
      <HeroBanner slides={bannerSlides} interval={6000} />

      {/* ── 2. Category grid ── */}
      <CategoryGrid SectionTitle={SectionTitle} />

      {/* ── 3. Newest & Featured — 10 items, no filter bar, CTA to /shop ── */}
      <section style={{ background: "var(--surface)" }}>
        <div
          className="flex items-baseline justify-between px-6 md:px-10 pt-10 pb-4"
          style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
        >
          <div>
            <p
              className="ll-label mb-1 text-[0.6rem] font-medium uppercase tracking-[0.25em]"
              style={{ color: "var(--primary)" }}
            >
              Recently Added
            </p>
            <SectionTitle>
              New &amp; <em className="italic" style={{ color: "var(--primary)" }}>Featured</em>
            </SectionTitle>
          </div>
          <Link
            href="/shop"
            className="ll-label hidden md:inline text-[0.6rem] font-medium uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
          >
            View All →
          </Link>
        </div>

        <ShopSection maxItems={10} hideFilters />
      </section>

      {/* ── 4. Market schedule ── */}
      <section
        id="schedule"
        className="relative z-[1] px-6 md:px-16 py-24"
        style={{ background: "var(--surface-container-low)" }}
      >
        <div className="mx-auto max-w-5xl md:grid md:items-center md:gap-24" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <p className="ll-label mb-3 flex items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              <span className="inline-block h-px w-8 shrink-0" style={{ background: "var(--primary)" }} />
              Find Noemi
            </p>
            <h2
              className="ll-display font-normal leading-tight mb-6"
              style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--on-surface)", letterSpacing: "-0.01em" }}
            >
              Visit Us at the{" "}
              <em className="italic" style={{ color: "var(--primary)" }}>Market</em>
            </h2>
            <p className="ll-body text-base font-light leading-[1.8] mb-4" style={{ color: "var(--on-surface-variant)" }}>
              Come find us rain or shine. Noemi&apos;s booth has been in the same spot for over thirty years — look for the linens. You can&apos;t miss it.
            </p>
            <p className="ll-body text-base font-light leading-[1.8]" style={{ color: "var(--on-surface-variant)" }}>
              Every Sunday is different. New pieces arrive each week, and no two visits are ever quite the same.
            </p>
          </div>

          {/* Schedule card */}
          <div
            className="relative mt-10 md:mt-0 p-8 md:p-12 shadow-ambient-md"
            style={{ background: "var(--surface-bright)", borderRadius: "0.375rem" }}
          >
            <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2" style={{ borderColor: "var(--primary)", opacity: 0.4 }} />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2" style={{ borderColor: "var(--sage)", opacity: 0.4 }} />

            <p className="ll-display text-xl font-normal mb-1" style={{ color: "var(--on-surface)" }}>Georgetown Flea Market</p>
            <p className="ll-label mb-8 text-[0.62rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--primary)" }}>
              1819 35th St NW · Washington, D.C.
            </p>

            {[
              { day: "Sunday",  time: "8:00 am — 4:00 pm" },
              { day: "Season",  time: "Year-round" },
              { day: "Booth",   time: "Ask for Noemi" },
            ].map(({ day, time }, i, arr) => (
              <div
                key={day}
                className="flex items-baseline justify-between py-3"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(196,181,168,0.2)" : "none" }}
              >
                <span className="ll-label text-[0.68rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface-variant)" }}>{day}</span>
                <span className="ll-body italic" style={{ color: "var(--primary)" }}>{time}</span>
              </div>
            ))}

            <p className="ll-body mt-6 text-sm font-light italic" style={{ color: "var(--outline)" }}>
              Hours subject to market schedule.{" "}
              <a href="#contact" style={{ color: "var(--primary)" }}>Send a message</a>{" "}
              before making a special trip.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Inquire CTA ── */}
      <section
        id="contact"
        className="relative z-[1] px-6 md:px-16 py-20"
        style={{ background: "var(--primary)" }}
      >
        <div className="mx-auto max-w-5xl md:flex md:items-center md:justify-between gap-12">
          <div>
            <h2
              className="ll-display font-normal leading-tight mb-3"
              style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "var(--on-primary)", letterSpacing: "-0.01em" }}
            >
              Interested in a{" "}
              <em className="italic" style={{ color: "var(--primary-container)" }}>piece?</em>
            </h2>
            <p className="ll-body text-base font-light" style={{ color: "rgba(253,250,246,0.75)" }}>
              Every item is one of a kind. Reach out to ask about availability, reserve something, or describe what you&apos;re looking for.
            </p>
          </div>
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
            className="ll-label mt-8 md:mt-0 inline-block whitespace-nowrap px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-all duration-400"
            style={{ background: "var(--on-primary)", color: "var(--primary)", borderRadius: "0.375rem" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--primary-container)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--on-primary)")}
          >
            Get in Touch
          </a>
        </div>
      </section>

      {/* ── 6. Brand narrative ── */}
      <section
        id="about"
        className="relative z-[1]"
        style={{ background: "var(--surface)" }}
      >
        <div className="md:grid md:min-h-[65vh]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div
            className="ll-embroidery-bg relative overflow-hidden hidden md:block"
            style={{ background: "var(--surface-container-low)" }}
          >
            <div className="absolute inset-8 flex flex-col gap-4">
              <SitePhoto siteKey="noemi-portrait"  alt="Noemi at her booth" className="flex-1 w-full" />
              <SitePhoto siteKey="noemi-portrait1" alt="Noemi at her booth" className="flex-1 w-full" />
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 md:px-16 py-20">
            <p className="ll-label mb-3 flex items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              <span className="inline-block h-px w-8 shrink-0" style={{ background: "var(--primary)" }} />
              The Story
            </p>
            <h2
              className="ll-display font-normal leading-tight mb-6"
              style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--on-surface)", letterSpacing: "-0.01em" }}
            >
              Thirty Years of{" "}
              <em className="italic" style={{ color: "var(--primary)" }}>Sunday Mornings</em>
            </h2>

            <p className="ll-body text-[1.05rem] font-light leading-[1.85] mb-4" style={{ color: "var(--on-surface-variant)" }}>
              Since 1994, <strong style={{ fontWeight: 400, color: "var(--on-surface)" }}>Noemi</strong> has been a fixture at the Georgetown Flea Market — a destination for collectors, interior designers, and anyone who has ever stopped in front of a perfectly embroidered tablecloth and felt something.
            </p>

            <blockquote
              className="ll-display my-8 py-5 pl-6 pr-4 text-[1.1rem] italic leading-relaxed"
              style={{
                borderLeft: "2px solid var(--primary)",
                color: "var(--on-surface)",
                background: "var(--surface-container-low)",
                borderRadius: "0 0.25rem 0.25rem 0",
              }}
            >
              &ldquo;Every piece has been chosen with care. She shows up every Sunday morning because she loves what she does.&rdquo;
            </blockquote>

            <p className="ll-body text-[1.05rem] font-light leading-[1.85] mb-8" style={{ color: "var(--on-surface-variant)" }}>
              Over the decades, Noemi has been approached for television shows and retail investments. She has turned them all down. The market is where she belongs.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { value: "30+", label: "Years of Curation" },
                { value: "5k+", label: "Pieces Preserved" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="ll-display text-3xl font-normal mb-1" style={{ color: "var(--primary)" }}>{value}</p>
                  <p className="ll-label text-[0.6rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--on-surface-variant)" }}>{label}</p>
                </div>
              ))}
            </div>

            <Link href="/about" className="btn-secondary w-fit text-[0.68rem]">
              Read the Full Story →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}