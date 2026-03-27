// src/components/storefront/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/shop",     label: "Collection" },
  { href: "/about",     label: "Heritage"   },
  { href: "/#schedule", label: "Atelier"    },
  { href: "/#contact",  label: "Inquire"    },
];

const HELP_LINKS = [
  { href: "/account?tab=reservations", label: "Order History",     desc: "View your past and active reservations"   },
  { href: "/account?tab=reservations", label: "Where's My Order",  desc: "Check your reservation or payment status" },
  { href: "/terms",                    label: "Shipping & Returns", desc: "Policies on shipping and all sales final"  },
  { href: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`, label: "Email Us", desc: "Get in touch with Noemi directly" },
];

export default function StorefrontHeader() {
  const [helpOpen,   setHelpOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { count } = useCart();

  return (
    <header
      id="site-header"
      className="glass relative z-50 border-b"
      style={{ borderColor: "rgba(196,181,168,0.2)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6 md:px-12">

        {/* ── Mobile: hamburger ── */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className="block h-px w-5 transition-all duration-300" style={{ background: "var(--on-surface)", transform: mobileOpen ? "rotate(45deg) translate(3px, 7px)" : "none" }} />
          <span className="block h-px w-5 transition-all duration-300" style={{ background: "var(--on-surface)", opacity: mobileOpen ? 0 : 1 }} />
          <span className="block h-px w-5 transition-all duration-300" style={{ background: "var(--on-surface)", transform: mobileOpen ? "rotate(-45deg) translate(3px, -7px)" : "none" }} />
        </button>

        {/* ── Wordmark ── */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 ll-display text-base font-normal italic tracking-wide"
          style={{ color: "var(--on-surface)", textDecoration: "none", letterSpacing: "0.04em" }}
        >
          <span className="hidden md:inline">
            {process.env.NEXT_PUBLIC_STORE_NAME}{" "}
            <span className="not-italic ll-label text-[0.6rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
              · Since 1994
            </span>
          </span>
          <span className="md:hidden">{process.env.NEXT_PUBLIC_STORE_NAME}</span>
        </Link>

        {/* ── Desktop nav — centered ── */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="ll-label text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-all duration-400"
              style={{ color: "var(--on-surface-variant)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right side actions ── */}
        <div className="flex items-center gap-4">

          {/* Cart icon + badge */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center transition-opacity hover:opacity-70"
            aria-label={`Cart — ${count} ${count === 1 ? "item" : "items"}`}
          >
            {/* Bag icon */}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: "var(--on-surface)" }}
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>

            {/* Badge */}
            {count > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center ll-label text-[0.45rem] font-medium"
                style={{
                  background:   "var(--primary)",
                  color:        "var(--on-primary)",
                  borderRadius: "9999px",
                  lineHeight:   1,
                }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {/* Help dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setHelpOpen((o) => !o)}
              className="ll-label flex items-center gap-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-all duration-400"
              style={{ color: "var(--on-surface-variant)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
            >
              Help
              <span
                className="text-[0.5rem] transition-transform duration-300"
                style={{ display: "inline-block", transform: helpOpen ? "rotate(180deg)" : "none" }}
              >▼</span>
            </button>

            {helpOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setHelpOpen(false)} />
                <div
                  className="absolute right-0 top-full z-20 mt-3 w-72 shadow-ambient-md"
                  style={{ background: "var(--surface-bright)", outline: "1px solid rgba(196,181,168,0.2)" }}
                >
                  <div className="px-5 pt-5 pb-2">
                    <p className="ll-label text-[0.58rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--on-surface-variant)" }}>
                      Help &amp; Support
                    </p>
                  </div>
                  <div className="flex flex-col pb-3">
                    {HELP_LINKS.map(({ href, label, desc }) => {
                      const isExternal = href.startsWith("mailto:") || href.startsWith("http");
                      const inner = (
                        <>
                          <span className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>{label}</span>
                          <span className="ll-body text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>{desc}</span>
                        </>
                      );
                      const shared = {
                        onClick: () => setHelpOpen(false),
                        className: "flex flex-col gap-0.5 px-5 py-3 transition-colors duration-300",
                        style: { textDecoration: "none" } as React.CSSProperties,
                        onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "var(--surface-container-low)"),
                        onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "transparent"),
                      };
                      return isExternal
                        ? <a key={label} {...shared} href={href}>{inner}</a>
                        : <Link key={label} {...shared} href={href}>{inner}</Link>;
                    })}
                  </div>
                  <div className="border-t px-5 py-3" style={{ borderColor: "rgba(196,181,168,0.2)" }}>
                    <p className="ll-body text-xs font-light italic" style={{ color: "var(--on-surface-variant)" }}>
                      For urgent questions,{" "}
                      <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} style={{ color: "var(--primary)" }}>
                        email us directly
                      </a>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Auth */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="btn-secondary text-[0.65rem] px-5 py-2">Sign In</button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="ll-label hidden md:block text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-colors duration-400"
                style={{ color: "var(--on-surface-variant)", textDecoration: "none" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
              >
                Account
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile menu drawer ── */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 pb-6 pt-4"
          style={{ background: "var(--surface-bright)", borderColor: "rgba(196,181,168,0.2)" }}
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="ll-label py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] border-b"
                style={{ color: "var(--on-surface)", textDecoration: "none", borderColor: "rgba(196,181,168,0.15)" }}
              >
                {label}
              </Link>
            ))}
            {/* Cart link in mobile menu */}
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="ll-label py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] border-b flex items-center justify-between"
              style={{ color: "var(--on-surface)", textDecoration: "none", borderColor: "rgba(196,181,168,0.15)" }}
            >
              Reservation List
              {count > 0 && (
                <span
                  className="ll-label text-[0.52rem] px-2 py-0.5 font-medium"
                  style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "9999px" }}
                >
                  {count}
                </span>
              )}
            </Link>
            {HELP_LINKS.map(({ href, label }) => {
              const isExternal = href.startsWith("mailto:") || href.startsWith("http");
              return isExternal
                ? <a key={label} href={href} className="ll-label py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] border-b" style={{ color: "var(--on-surface-variant)", textDecoration: "none", borderColor: "rgba(196,181,168,0.15)" }}>{label}</a>
                : <Link key={label} href={href} onClick={() => setMobileOpen(false)} className="ll-label py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] border-b" style={{ color: "var(--on-surface-variant)", textDecoration: "none", borderColor: "rgba(196,181,168,0.15)" }}>{label}</Link>;
            })}
          </nav>
        </div>
      )}
    </header>
  );
}