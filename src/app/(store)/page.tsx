// app/(store)/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStorefrontContext } from "@/context/StorefrontContext";
import ShopSection from "@/components/storefront/ShopSection";
import HeroBanner, { type BannerSlide } from "@/components/storefront/HeroBanner";
import { SitePhoto } from "@/components/shared/SitePhoto";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
      style={{ color: "var(--sage-deep)" }}
    >
      <span className="inline-block h-px w-8 shrink-0" style={{ background: "var(--sage-deep)" }} />
      {children}
    </div>
  );
}

function SectionTitle({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`ll-display font-normal leading-snug ${center ? "text-center" : ""}`}
      style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}
    >
      {children}
    </h2>
  );
}

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

export default function HomePage() {
  const { items: _items } = useStorefrontContext(); // keep context alive for ShopSection
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);

  useEffect(() => {
    fetch("/api/site/hero")
      .then((r) => r.ok ? r.json() : [])
      .then((data: HeroSlideDto[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const slides: BannerSlide[] = data.map((s) => ({
          photoUrl: s.Media?.ReadUrl ?? undefined,
          headline: s.Heading       ?? "Noemi · The Linen Lady",
          sub:      s.Subtext       ?? undefined,
          href:     s.LinkUrl       ?? undefined,
          cta:      s.LinkLabel     ?? undefined,
        }));
        setBannerSlides(slides);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/*
        Mobile snap container — wraps only hero + shop so the rest
        of the page scrolls freely after the shop section.
        Desktop: no snap, normal scroll.
      */}
      <div
        className="ll-texture-overlay md:contents"
        style={{
          backgroundColor: "var(--cream)",
          color: "var(--ink)",
        }}
      >
        {/* Mobile snap wrapper */}
        <div
          className="md:contents"
          style={{
            // Only apply snap on mobile
          }}
        >

          {/* ── 1. Hero (snap point 1, mobile) ── */}
          <div
            className="relative z-[1] w-full"
            style={{ scrollSnapAlign: "start" } as React.CSSProperties}
          >
            <HeroBanner slides={bannerSlides} interval={6000} />
          </div>

          {/* ── 2. Shop section (snap point 2, mobile) ── */}
          <div
            className="relative z-[1]"
            style={{ scrollSnapAlign: "start" } as React.CSSProperties}
          >
            <ShopSection />
          </div>

        </div>

        {/* ── 3. Market schedule — free scroll ── */}
        <section id="schedule" className="relative z-[1] px-6 md:px-16 py-24" style={{ background: "var(--cream-dark)" }}>
          <div className="md:grid md:items-center md:gap-24" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <SectionLabel>Find Noemi</SectionLabel>
              <SectionTitle>
                Visit Us at the <em className="italic" style={{ color: "var(--rose-deep)" }}>Market</em>
              </SectionTitle>
              <p className="ll-body mt-6 text-base font-light leading-[1.8]" style={{ color: "var(--ink-soft)" }}>
                Come find us rain or shine. Noemi&apos;s booth has been in the same spot for over thirty years — look for the linens. You can&apos;t miss it.
              </p>
              <p className="ll-body mt-4 text-base font-light leading-[1.8]" style={{ color: "var(--ink-soft)" }}>
                Every Sunday is different. New pieces arrive each week, and no two visits are ever quite the same.
              </p>
            </div>
            <div className="relative mt-10 md:mt-0 border p-8 md:p-12" style={{ borderColor: "var(--linen)", background: "var(--cream)" }}>
              <div className="absolute left-[-1px] top-[-1px] h-10 w-10 border-l-[3px] border-t-[3px]" style={{ borderColor: "var(--rose)" }} />
              <div className="absolute bottom-[-1px] right-[-1px] h-10 w-10 border-b-[3px] border-r-[3px]" style={{ borderColor: "var(--sage)" }} />
              <div className="ll-display mb-1 text-2xl font-normal" style={{ color: "var(--ink)" }}>Georgetown Flea Market</div>
              <div className="ll-label mb-8 text-[0.65rem] uppercase tracking-[0.15em]" style={{ color: "var(--sage-deep)" }}>1819 35th St NW · Washington, D.C.</div>
              {[
                { day: "Sunday", time: "8:00 am — 4:00 pm" },
                { day: "Season", time: "Year-round" },
                { day: "Booth",  time: "Ask for Noemi" },
              ].map(({ day, time }, i, arr) => (
                <div key={day} className="flex items-baseline justify-between py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px dashed var(--linen)" : "none" }}>
                  <span className="ll-label text-[0.7rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--ink-soft)" }}>{day}</span>
                  <span className="ll-body italic" style={{ color: "var(--rose-deep)" }}>{time}</span>
                </div>
              ))}
              <p className="ll-body mt-6 text-sm font-light italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Hours subject to market schedule.{" "}
                <a href="#contact" style={{ color: "var(--rose-deep)" }}>Send a message</a>{" "}
                before making a special trip.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Inquire CTA ── */}
        <section id="contact" className="relative z-[1] px-6 md:px-16 py-20" style={{ background: "var(--rose-deep)" }}>
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h2 className="ll-display font-normal leading-snug" style={{ fontSize: "clamp(1.6rem,3vw,2.5rem)", color: "var(--cream)" }}>
                Interested in a <em className="italic" style={{ color: "var(--rose-light)" }}>piece?</em>
              </h2>
              <p className="ll-body mt-2 text-base font-light" style={{ color: "var(--rose-light)" }}>
                Every item is one of a kind. Reach out to ask about availability, reserve something, or describe what you&apos;re looking for.
              </p>
            </div>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="ll-label mt-6 md:mt-0 inline-block whitespace-nowrap px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:bg-white"
              style={{ background: "var(--cream)", color: "var(--rose-deep)" }}
            >
              Get in Touch
            </a>
          </div>
        </section>

        {/* ── 5. Our story ── */}
        <section id="about" className="relative z-[1]" style={{ background: "var(--cream)" }}>
          <div className="md:grid md:min-h-[60vh]" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div
              className="ll-embroidery-bg relative overflow-hidden hidden md:block"
              style={{ background: "linear-gradient(160deg, var(--sage-light) 0%, var(--linen) 60%, var(--rose-light) 100%)" }}
            >
              <div className="absolute inset-8 flex flex-col gap-4">
                <SitePhoto siteKey="noemi-portrait"  alt="Noemi at her booth" className="flex-1 w-full" />
                <SitePhoto siteKey="noemi-portrait1" alt="Noemi at her booth" className="flex-1 w-full" />
              </div>
            </div>
            <div className="flex flex-col justify-center px-6 md:px-16 py-20">
              <SectionLabel>The Story</SectionLabel>
              <SectionTitle>
                Thirty Years of <em className="italic" style={{ color: "var(--rose-deep)" }}>Sunday Mornings</em>
              </SectionTitle>
              <p className="ll-body mt-6 text-[1.05rem] font-light leading-[1.85]" style={{ color: "var(--ink-soft)" }}>
                Since 1994, <strong style={{ fontWeight: 400, color: "var(--ink)" }}>Noemi</strong> has been a fixture at the Georgetown Flea Market — a destination for collectors, interior designers, and anyone who has ever stopped in front of a perfectly embroidered tablecloth and felt something.
              </p>
              <blockquote
                className="ll-display my-8 border-l-[3px] py-4 pl-6 pr-4 text-[1.15rem] italic leading-relaxed"
                style={{ borderColor: "var(--rose)", color: "var(--brown)", background: "linear-gradient(135deg, #fdf5f5, var(--cream))" }}
              >
                &ldquo;Every piece has been chosen with care. She shows up every Sunday morning because she loves what she does.&rdquo;
              </blockquote>
              <p className="ll-body text-[1.05rem] font-light leading-[1.85]" style={{ color: "var(--ink-soft)" }}>
                Over the decades, Noemi has been approached for television shows and retail investments. She has turned them all down. The market is where she belongs.
              </p>
              <Link
                href="/about"
                className="ll-label mt-8 inline-flex w-fit items-center gap-2 border px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200"
                style={{ color: "var(--sage-deep)", borderColor: "var(--sage)", textDecoration: "none" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sage-light)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                Read the Full Story →
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Mobile snap scroll — applied to html on mobile only */}
      <style>{`
        @media (max-width: 767px) {
          html {
            scroll-snap-type: y mandatory;
            overflow-y: scroll;
          }
        }
      `}</style>
    </>
  );
}