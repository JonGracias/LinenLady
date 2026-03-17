"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="relative z-[1] w-full px-6 pb-8 pt-12 md:px-16 md:pt-16"
      style={{ background: "var(--ink)", color: "var(--cream-dark)" }}
    >
        {/* ── Columns ── */}
        <div
          className="mb-8 grid w-full gap-8 border-b pb-8 md:mb-6 md:gap-16 md:pb-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            borderColor: "rgba(255,255,255,0.08)",
          }}>
          {/* Wordmark + tagline */}
          <div className="mx-auto">
            <div
              className="ll-display mb-3 text-xl italic md:text-2xl"
              style={{ color: "var(--rose-light)" }}
            >
              Noemi · The Linen Lady
            </div>
            <p
              className="ll-body text-sm font-light leading-[1.7]"
              style={{ color: "rgba(255,255,255,0.5)" }}>
                Antique and vintage linens,
                <br/>
                textiles, and curiosities.
                <br/>
                A Georgetown institution since 1994.
            </p>
          </div>

          {/* Navigate */}
          {/* <div>
            <div
              className="ll-label mb-4 text-[0.62rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "var(--sage-light)" }}
            >
              Navigate
            </div>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/shop",      label: "Shop"      },
                { href: "/about",     label: "Our Story"  },
                { href: "/#schedule", label: "Find Us"    },
                { href: "/#contact",  label: "Inquire"    },
                { href: "/privacy",   label: "Privacy"    },
                { href: "/terms",     label: "Terms"      },
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
          </div> */}

          {/* Market info */}
          <div className="mx-auto">
            <div
              className="ll-label mb-4 text-[0.62rem] font-medium uppercase tracking-[0.2em]"
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

        {/* ── Bottom bar ── */}
        <div
          className="ll-label flex flex-col gap-2 text-[0.6rem] uppercase tracking-[0.1em] sm:flex-row sm:items-center sm:justify-between"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <span>© 2025 Noemi · The Linen Lady · Washington D.C.</span>
          <span>Handpicked since 1994</span>
        </div>
    </footer>
  );
}