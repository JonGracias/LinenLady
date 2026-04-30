// src/components/storefront/Header.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import { useCart } from "@/context/CartContext";

const STORE_NAME    = process.env.NEXT_PUBLIC_STORE_NAME    ?? "The Linen Lady";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

const NAV_LINKS = [
  { href: "/shop",      label: "Collection" },
  { href: "/about",     label: "Heritage"   },
  { href: "/#schedule", label: "Atelier"    },
  { href: "/#contact",  label: "Inquire"    },
];

const HELP_LINKS = [
  { href: "/account?tab=reservations", label: "Order History",     desc: "View your past and active reservations"   },
  { href: "/account?tab=reservations", label: "Where's My Order",  desc: "Check your reservation or payment status" },
  { href: "/terms",                    label: "Shipping & Returns", desc: "Policies on shipping and all sales final"  },
  ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Email Us", desc: "Get in touch with Noemi directly" }] : []),
];

function isExternalHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

// ─────────────────────────────────────────────────────────────────────────────
// CartIcon — extracted because it appears in two places and the SVG was noisy.
// ─────────────────────────────────────────────────────────────────────────────
function CartIcon({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="nav-icon-button"
      aria-label={`Cart — ${count} ${count === 1 ? "item" : "items"}`}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="nav-cart-badge" aria-hidden="true">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpDropdown — desktop-only. Encapsulates the open/close state, outside-click
// dismissal, and Escape-key dismissal.
// ─────────────────────────────────────────────────────────────────────────────
function HelpDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on Escape, restoring focus to the toggle.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative hidden lg:block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="nav-link inline-flex items-center gap-1"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        Help
        <span
          className={`inline-block text-[0.5rem] transition-transform duration-300 ease-in-out ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop catches outside clicks. z-index puts it under the
              dropdown panel but over the rest of the header — fixes the
              previous bug where clicks on the cart/wordmark fired through. */}
          <div
            className="nav-dropdown-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div id={menuId} className="nav-dropdown" role="menu">
            <div className="px-5 pt-5 pb-2">
              <p className="ll-label text-[0.58rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--on-surface-variant)" }}>
                Help &amp; Support
              </p>
            </div>

            <div className="flex flex-col pb-3">
              {HELP_LINKS.map(({ href, label, desc }) => {
                const content = (
                  <>
                    <span className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                      {label}
                    </span>
                    <span className="ll-body text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
                      {desc}
                    </span>
                  </>
                );

                return isExternalHref(href) ? (
                  <a
                    key={label}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="nav-dropdown-item"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="nav-dropdown-item"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>

            {CONTACT_EMAIL && (
              <div className="border-t px-5 py-3" style={{ borderColor: "rgba(196,181,168,0.2)" }}>
                <p className="ll-body text-xs font-light italic" style={{ color: "var(--on-surface-variant)" }}>
                  For urgent questions,{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--primary)" }}>
                    email us directly
                  </a>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main header
// ─────────────────────────────────────────────────────────────────────────────
export default function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { count } = useCart();
  const drawerId = useId();

  // Lock body scroll while mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      id="site-header"
      className="glass relative z-50 border-b"
      style={{ borderColor: "rgba(196,181,168,0.2)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6 md:px-12">

        {/* ── Mobile: hamburger ───────────────────────────────────────────── */}
        <button
          type="button"
          className="nav-hamburger lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls={drawerId}
        >
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
        </button>

        {/* ── Wordmark ────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 ll-display text-base font-normal italic tracking-wide"
          style={{ color: "var(--on-surface)", textDecoration: "none", letterSpacing: "0.04em" }}
        >
          {STORE_NAME}
        </Link>

        {/* ── Desktop nav (centered) ──────────────────────────────────────── */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-10" aria-label="Primary">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right side actions ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <CartIcon count={count} />
          <HelpDropdown />

          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button type="button" className="btn-secondary text-[0.65rem] px-5 py-2">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/account" className="nav-link hidden lg:block">
                Account
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop dims page and catches outside clicks. */}
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-16 z-40 bg-black/20"
            onClick={closeMobile}
            aria-hidden="true"
          />

          <div
            id={drawerId}
            className="lg:hidden absolute left-0 right-0 top-full z-50 border-t px-6 pb-6 pt-4 shadow-ambient-md"
            style={{ background: "var(--surface-bright)", borderColor: "rgba(196,181,168,0.2)" }}
          >
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className="nav-mobile-item"
                >
                  {label}
                </Link>
              ))}

              <Link href="/cart" onClick={closeMobile} className="nav-mobile-item">
                <span>Reservation List</span>
                {count > 0 && (
                  <span
                    className="ll-label text-[0.52rem] px-2 py-0.5 font-medium"
                    style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "9999px" }}
                    aria-hidden="true"
                  >
                    {count}
                  </span>
                )}
              </Link>

              {HELP_LINKS.map(({ href, label }) =>
                isExternalHref(href) ? (
                  <a
                    key={label}
                    href={href}
                    onClick={closeMobile}
                    className="nav-mobile-item nav-mobile-item--secondary"
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeMobile}
                    className="nav-mobile-item nav-mobile-item--secondary"
                  >
                    {label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}