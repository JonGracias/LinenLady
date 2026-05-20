"use client";

import { SitePhoto } from "@/components/shared/SitePhoto";
import Link from "next/link";
import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Timeline data
───────────────────────────────────────────────────────────── */

// const timeline = [
//   {
//     year: "1994",
//     headline: "The First Sunday",
//     body: "Noemi sets up her first booth at the Georgetown Flea Market with a folding table, a handful of pieces she'd collected over the years, and no particular plan to stay. She stays.",
//   },
//   {
//     year: "Late 90s",
//     headline: "Word Spreads",
//     body: "Interior designers start making the Sunday trip specifically for Noemi's booth. She develops a reputation for finding European linens that other dealers overlook — Provençal embroidery, Belgian damask, Irish linen monogrammed sets still in their original wrapping.",
//   },
//   {
//     year: "2000s",
//     headline: "A Regular Institution",
//     body: "Collectors, decorators, and eventually diplomats become regulars. She turns down a national television feature. Then another. The booth — and the Sunday ritual — is exactly where she wants to be.",
//   },
//   {
//     year: "2010s",
//     headline: "The Eye Sharpens",
//     body: "Decades of handling thousands of pieces develops something close to a sixth sense. She can date a tablecloth by its weave, identify a region by its embroidery style, and spot a genuine antique linen from across a crowded estate sale. Regulars learn to trust her completely.",
//   },
//   {
//     year: "Today",
//     headline: "Thirty Years On",
//     body: "The same booth. The same spot. New pieces every week. A community of collectors who've been coming since the beginning — and new ones who stumble in for the first time and immediately understand why they won't be leaving empty-handed.",
//   },
// ];

/* ─────────────────────────────────────────────────────────────
   About page
───────────────────────────────────────────────────────────── */

export default function AboutPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="ll-texture-overlay relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
    >
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      {/* ══════════════════════════════════════════════════════
          OPENING — full-width photo on top, text below
      ══════════════════════════════════════════════════════ */}
      <header
        className={`relative z-[1] overflow-hidden ${visible ? "ll-hero-visible" : ""}`}
        style={{
          background:
            "linear-gradient(160deg, var(--rose-light) 0%, var(--linen) 45%, var(--sage-light) 100%)",
        }}>
        {/* Decorative pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='36' fill='none' stroke='%238fad94' stroke-width='0.8' stroke-dasharray='5 4'/%3E%3Ccircle cx='40' cy='40' r='24' fill='none' stroke='%23d4a0a0' stroke-width='0.6'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%23d4a0a0'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <SitePhoto
          siteKey="About"
          alt="Noemi at her booth"
          className="absolute inset-0 h-full w-full"
        />
        {/* ── Photo — full width, reasonable height ── */}
          <div
            className="relative z-[1] w-full overflow-hidden"
          >

          {/* ── Text block — centered below photo ── */}
          <div className="relative z-[1] px-16 py-12">
            <div className="mx-auto max-w-3xl text-center">
              <div
                className="ll-label mb-4 flex items-center justify-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
                style={{ color: "var(--sage-deep)" }}
              >
                <span className="inline-block h-px w-8" style={{ background: "var(--sage-deep)" }} />
                Georgetown · Since 1994
                <span className="inline-block h-px w-8" style={{ background: "var(--sage-deep)" }} />
              </div>

              <h1
                className="ll-display font-normal leading-[1.08]"
                style={{ fontSize: "clamp(2.8rem, 4.5vw, 5rem)", color: "var(--ink)" }}
              >
                Welcome to {" "}
                <em className="italic" style={{ color: "var(--rose-deep)" }}>
                  Antique and Vintage Linens
                </em>
              </h1>

              <p
                className="ll-body mx-auto mt-6 max-w-xl text-[1.1rem] font-light leading-[1.85]"
                style={{ color: "var(--ink-soft)" }}>
                Your one-stop-shop for the finest linens from a bygone era. We specialize in sourcing, and selling antique and vintage linens, including bedding, tablecloths, napkins, lace, and more.
              Whether you're a collector, interior designer, or simply someone who appreciates the beauty of vintage linens, we invite you to explore our collection. Browse our online store.
              At Antique and Vintage Linens, we are dedicated to preserving the legacy of these timeless pieces and making them accessible to future generations. Thank you for choosing us as your source for antique and vintage linens.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          THE EYE
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] grid"
        style={{ gridTemplateColumns: "1fr 1fr", minHeight: 500 }}
      >
        <div
          className="flex flex-col justify-center px-16 py-10"
          style={{ background: "var(--ink)" }}
        >
          <div
            className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
            style={{ color: "var(--sage-light)" }}>
            <span className="inline-block h-px w-8" style={{ background: "var(--sage-light)" }} />
            The Eye
          </div>

          <h2
            className="ll-display mb-6 font-normal leading-snug"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--cream)" }}>
            What She{" "}
            <em className="italic" style={{ color: "var(--rose-light)" }}>
              Looks For
            </em>
          </h2>

          <p
            className="ll-body text-base font-light leading-[1.85]"
            style={{ color: "rgba(255,255,255,0.65)" }}>
            After thirty years of handling linens from across Europe and America,
            Noemi has developed an almost instinctive sense for quality. She can
            feel the difference between machine-made and hand-hemstitched. She
            knows what a proper linen weight should feel like, how a genuine
            damask weave catches the light, what distinguishes a factory monogram
            from one worked by hand.
          </p>
        </div>

        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: "1fr 1fr",
            background: "var(--linen)",
            alignContent: "start",
          }}
        >
          {[
            { icon: "🧵", title: "Hand Finishing",     body: "Hemstitching, hand-rolled hems, drawn-thread work — signs of a maker who cared." },
            { icon: "📅", title: "Honest Age",         body: "Each piece is dated as accurately as possible. If she's uncertain, she says so." },
            { icon: "🌍", title: "European Origin",    body: "A particular love for French, Belgian, Irish, and Italian linen traditions." },
            { icon: "✨", title: "Condition",          body: "Gently used or never used. Never sold with concealed damage." },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-10"
              style={{ background: "var(--cream)" }}
            >
              <span className="text-2xl">{icon}</span>
              <div
                className="ll-display text-base font-normal"
                style={{ color: "var(--ink)" }}
              >
                {title}
              </div>
              <p
                className="ll-body text-sm font-light leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          THE MARKET
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] px-16 py-24"
        style={{
          background:
            "linear-gradient(135deg, var(--sage-light) 0%, var(--cream-dark) 100%)",
        }}
      >
        <div
          className="mx-auto grid max-w-5xl gap-16 items-center"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div>
            <div
              className="ll-label mb-3 flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
              style={{ color: "var(--sage-deep)" }}
            >
              <span className="inline-block h-px w-8" style={{ background: "var(--sage-deep)" }} />
              The Market
            </div>
            <h2
              className="ll-display mb-6 font-normal leading-snug"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--ink)" }}
            >
              Georgetown on a{" "}
              <em className="italic" style={{ color: "var(--rose-deep)" }}>
                Sunday
              </em>
            </h2>
            <p
              className="ll-body text-base font-light leading-[1.85]"
              style={{ color: "var(--ink-soft)" }}
            >
              The Georgetown Flea Market has been running since 1994 in the parking
              lot of Hardy Middle School on 35th Street. On any given Sunday morning
              you&apos;ll find antique dealers, vintage clothing vendors, jewelry makers,
              and collectors from across the mid-Atlantic.
            </p>
            <p
              className="ll-body mt-4 text-base font-light leading-[1.85]"
              style={{ color: "var(--ink-soft)" }}
            >
              Noemi&apos;s booth has been in the same location for over thirty years.
              You&apos;ll know it when you see it — the linens are always beautifully
              laid out, the prices are written by hand, and there&apos;s usually a small
              crowd gathered around the table.
            </p>
          </div>

          <div
            className="relative border p-10"
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
              className="ll-display mb-1 text-xl font-normal"
              style={{ color: "var(--ink)" }}
            >
              Georgetown Flea Market
            </div>
            <div
              className="ll-label mb-8 text-[0.62rem] uppercase tracking-[0.15em]"
              style={{ color: "var(--sage-deep)" }}
            >
              1819 35th St NW · Washington, D.C.
            </div>

            {[
              { label: "When",   value: "Every Sunday"         },
              { label: "Hours",  value: "8:00 am — 4:00 pm"    },
              { label: "Season", value: "Year-round"            },
              { label: "Booth",  value: "Ask for Noemi"         },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className="flex items-baseline justify-between py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? "1px dashed var(--linen)" : "none",
                }}
              >
                <span
                  className="ll-label text-[0.68rem] font-medium uppercase tracking-[0.1em]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {label}
                </span>
                <span
                  className="ll-body italic"
                  style={{ color: "var(--rose-deep)" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — shop or inquire
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-[1] py-24 text-center"
        style={{ background: "var(--cream)" }}
      >
        <div
          className="ll-label mb-3 inline-flex items-center justify-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--sage-deep)" }}
        >
          Find something you love
        </div>
        <h2
          className="ll-display mx-auto mb-6 max-w-xl font-normal leading-snug"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", color: "var(--ink)" }}
        >
          Every piece is waiting for{" "}
          <em className="italic" style={{ color: "var(--rose-deep)" }}>
            the right home
          </em>
        </h2>
        <p
          className="ll-body mx-auto mb-12 max-w-md text-base font-light leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          Browse the collection online, or come find us on a Sunday morning.
          Either way — there&apos;s something here for you.
        </p>
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/shop"
            className="ll-label inline-block border-2 px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--rose-deep)",
              color: "var(--rose-deep)",
              textDecoration: "none",
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
            Browse the Collection
          </Link>
          {/* Get in Touch — now points at the contact page (was /account?tab=messages) */}
          <Link
            href="/contact"
            className="ll-label inline-block border px-10 py-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--sage)",
              color: "var(--sage-deep)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--sage-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Get in Touch
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-[1] px-16 pb-8 pt-16"
        style={{ background: "var(--ink)", color: "var(--cream-dark)" }}
      >
        <div
          className="mb-12 grid gap-16 border-b pb-12"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div
              className="ll-display mb-4 text-2xl italic"
              style={{ color: "var(--rose-light)" }}
            >
              Noemi · The Linen Lady
            </div>
            <p
              className="ll-body max-w-[280px] text-sm font-light leading-[1.7]"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Antique and vintage linens, textiles, and curiosities. A Georgetown
              institution since 1994.
            </p>
          </div>

          <div>
            <div
              className="ll-label mb-5 text-[0.62rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "var(--sage-light)" }}
            >
              Navigate
            </div>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/shop",      label: "Shop"       },
                { href: "/about",     label: "Our Story"  },
                { href: "/#schedule", label: "Find Us"    },
                { href: "/contact",   label: "Inquire"    },   // was "/#contact"
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="ll-body text-sm font-light transition-colors duration-200 hover:text-[#ecdcdc]"
                    style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div
              className="ll-label mb-5 text-[0.62rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "var(--sage-light)" }}
            >
              Georgetown Market
            </div>
            <address
              className="ll-body not-italic text-sm font-light leading-[1.8]"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              1819 35th St NW
              <br />
              Washington, D.C. 20007
              <br />
              Sundays · 8am–4pm
              <br />
              Year-round
            </address>
          </div>
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