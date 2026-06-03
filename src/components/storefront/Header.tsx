// src/components/storefront/Header.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useCustomerSession } from "@/context/CustomerSessionContext";

/* ─── Env-driven identity ────────────────────────────────────────────────
   Two names so the header can compress on narrow viewports. Short name
   falls back to the full name if no short is configured, so the swap
   is a no-op until NEXT_PUBLIC_SHORT_NAME is set. */
const STORE_NAME    = process.env.NEXT_PUBLIC_STORE_NAME    ?? "The Linen Lady";
const SHORT_NAME    = process.env.NEXT_PUBLIC_SHORT_NAME    ?? STORE_NAME;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/* ─── Nav data ───────────────────────────────────────────────────────────
   Two groups: primary (collections/about/market/contact) and help
   (orders/policies/inquiries). Both live inside the hamburger drawer; the
   visual separator between them is a thin border the drawer renders. */

const NAV_LINKS = [
  { href: "/shop",      label: "Collections" },
  { href: "/about",     label: "About Us" },
  { href: "/#schedule", label: "Join Us at the Market" },
  { href: "/contact",   label: "Contact" },
];

const HELP_LINKS = [
  { href: "/basket?tab=orders", label: "Order History" },
  { href: "/basket?tab=orders", label: "Where's My Order" },
  { href: "/terms",             label: "Shipping & Returns" },
  { href: "/contact",           label: "Contact Noemi" },
];

function isExternalHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

/* ─────────────────────────────────────────────────────────────────────────
   BasketIcon — links to /basket (Phase 1).
───────────────────────────────────────────────────────────────────────── */
function BasketIcon({ count }: { count: number }) {
  return (
    <Link
      href="/basket"
      className="nav-icon-button"
      aria-label={`Basket — ${count} ${count === 1 ? "piece" : "pieces"}`}
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

/* ─────────────────────────────────────────────────────────────────────────
   AccountDropdown — sits to the right of the basket. Shows the user's
   first initial in a circle when signed-in; a person icon when signed-out.
   Click opens a small panel anchored to the button: Sign In option when
   anonymous; Account + Sign Out when authenticated.

   This component renders at all viewport widths. The hamburger drawer also
   contains account rows — duplicate paths are intentional. The dropdown is
   the "I want to do something account-y" affordance; the drawer is the
   "I'm scanning everything" affordance. They serve different mental
   models and cost ~nothing to keep both.
───────────────────────────────────────────────────────────────────────── */
function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { isSignedIn, user } = useUser();

  // Escape closes; return focus to the trigger button so keyboard
  // navigation stays sensible.
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

  const accessibleName = isSignedIn
    ? `Account menu — ${user?.firstName ?? user?.username ?? "signed in"}`
    : "Account menu";

  return (
    <div className="relative">

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="nav-icon-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={accessibleName}
      >
        {/*but this one does not whyt?*/}
        {isSignedIn ? (
          <span
            className="ll-label inline-flex items-center justify-center text-[0.7rem] font-medium uppercase"
            style={{
              width:        "1.75rem",
              height:       "1.75rem",
              borderRadius: "9999px",
              background:   "var(--primary)",
              color:        "var(--on-primary)",
              letterSpacing: 0,
            }}
            aria-hidden="true"
          >
            {(user?.firstName?.[0]
              ?? user?.username?.[0]
              ?? user?.primaryEmailAddress?.emailAddress?.[0]
              ?? "?").toUpperCase()}
          </span>
        ) : (
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div
            className="nav-dropdown-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div id={menuId} className="nav-dropdown" role="menu">
            <div className="px-5 pt-5 pb-2">
              <p className="ll-label text-[0.58rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--on-surface-variant)" }}>
                {isSignedIn ? "Your Account" : "Welcome"}
              </p>
            </div>

            {!isSignedIn ? (
              <div className="flex flex-col pb-3">
                <SignInButton mode="modal">
                  <div
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => setOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setOpen(false);
                    }}
                    className="nav-dropdown-item cursor-pointer"
                  >
                    <span className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                      Sign In
                    </span>
                    <span className="ll-body text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
                      Access your basket, orders, and messages
                    </span>
                  </div>
                </SignInButton>
              </div>
            ) : (
              <div className="flex flex-col pb-3">
                <Link
                  href="/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="nav-dropdown-item"
                >
                  <span className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                    Account
                  </span>
                  <span className="ll-body text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
                    Orders, addresses, messages
                  </span>
                </Link>

                <div
                  className="border-t mx-5 my-2"
                  style={{ borderColor: "rgba(196,181,168,0.2)" }}
                  aria-hidden="true"
                />

                <SignOutButton>
                  <div
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => setOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setOpen(false);
                    }}
                    className="nav-dropdown-item cursor-pointer"
                  >
                    <span className="ll-label text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                      Sign Out
                    </span>
                    <span className="ll-body text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
                      End your session on this device
                    </span>
                  </div>
                </SignOutButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   StorefrontHeader — the always-hamburger layout.

   Layout, every viewport:
     left:   [☰] [wordmark]      — hamburger + store name (wordmark links to /)
     right:  [basket]  [account]  — basket icon, account dropdown

   The hamburger opens a compact dropdown panel anchored under the button,
   styled to match AccountDropdown's panel but on the left side. Contains
   primary nav, basket shortcut, help links, and account actions. No
   inline desktop nav at any size.

   Two CSS changes in globals.css are required (see
   phase1d-globals.css.patch.txt):
     1. Strip the @media (min-width: 1024px) rule that hides .nav-hamburger.
     2. Add a .nav-drawer class mirroring .nav-dropdown but left-anchored.

   Without those edits the hamburger is invisible past lg and the drawer
   markup has no styling.
───────────────────────────────────────────────────────────────────────── */
export default function StorefrontHeader() {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const { isSignedIn } = useUser();
  const { count } = useCustomerSession();

  // Body-scroll lock while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      id="site-header"
      className="glass relative z-50 border-b"
      style={{ borderColor: "rgba(196,181,168,0.2)" }}
    >
      {/* Top bar — flex with justify-between gives us the two-group layout
          without a middle column. */}
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-4 px-6 md:px-12">

        {/* ── Left: hamburger + wordmark ── */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={drawerId}
          >
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
          </button>

          <Link
            href="/"
            className="ll-display text-base font-normal italic tracking-wide truncate"
            style={{
              color:          "var(--on-surface)",
              textDecoration: "none",
              letterSpacing:  "0.04em",
            }}
          >
            {/* Viewport-driven name swap using only CSS — no JS, no
                hydration mismatch. Full name at >=sm (640px), short name
                below. When SHORT_NAME === STORE_NAME (env unset), both
                spans render the same string and the swap is invisible. */}
            <span className="hidden sm:inline">{STORE_NAME}</span>
            <span className="inline sm:hidden">{SHORT_NAME}</span>
          </Link>
        </div>

        {/* ── Right: basket + account ── */}
        <div className="flex items-center gap-2">
          <BasketIcon count={count} />
          <AccountDropdown />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          Drawer — compact panel anchored under the hamburger button, left-
          aligned. Sized to its content (~20rem). Mirrors AccountDropdown's
          shape but on the opposite side of the header.
      ────────────────────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop — transparent full-viewport click-catcher, identical
              to the one AccountDropdown uses. Closes the drawer on any
              outside click without dimming the page; the menu is small
              enough that a dim overlay would feel disproportionate. */}
          <div
            className="nav-dropdown-backdrop"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer panel — uses the .nav-drawer class which mirrors
              .nav-dropdown but anchored left instead of right. Sits just
              below the header, sized to its content (capped at 20rem),
              with a scroll fallback for tall content on short viewports. */}
          <div
            id={drawerId}
            className="nav-drawer"
            role="menu"
          >
            <div className="px-5 py-3">

              {/* ── Primary nav ── */}
              <nav className="flex flex-col" aria-label="Primary">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className="nav-mobile-item"
                  >
                    {label}
                  </Link>
                ))}

                {/* Basket row — duplicates the header icon for customers who
                    scan the drawer rather than the header bar. Includes the
                    count badge inline. Phase 1: /basket, not /account?tab=basket.
                    nav-mobile-item is already flex+space-between, no need to
                    re-apply Tailwind utilities here. */}
                <Link
                  href="/basket"
                  onClick={close}
                  className="nav-mobile-item"
                >
                  <span>Basket</span>
                  {count > 0 && (
                    <span
                      className="ll-label text-[0.52rem] px-2 py-0.5 font-medium"
                      style={{
                        background:   "var(--primary)",
                        color:        "var(--on-primary)",
                        borderRadius: "9999px",
                      }}
                      aria-hidden="true"
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </nav>

              <div
                className="my-3 border-t"
                style={{ borderColor: "rgba(196,181,168,0.2)" }}
                aria-hidden="true"
              />

              {/* ── Help links (secondary visual weight) ── */}
              <nav className="flex flex-col" aria-label="Help">
                {HELP_LINKS.map(({ href, label }) =>
                  isExternalHref(href) ? (
                    <a
                      key={label}
                      href={href}
                      onClick={close}
                      className="nav-mobile-item nav-mobile-item--secondary"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={label}
                      href={href}
                      onClick={close}
                      className="nav-mobile-item nav-mobile-item--secondary"
                    >
                      {label}
                    </Link>
                  )
                )}
              </nav>

              {/* ── Account row ── */}
              <div
                className="my-3 border-t"
                style={{ borderColor: "rgba(196,181,168,0.2)" }}
                aria-hidden="true"
              />

              <nav className="flex flex-col" aria-label="Account">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      onClick={close}
                      className="nav-mobile-item nav-mobile-item--secondary text-left"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                ) : (
                  <>
                    <Link
                      href="/account"
                      onClick={close}
                      className="nav-mobile-item"
                    >
                      Account
                    </Link>
                    <SignOutButton>
                      <button
                        type="button"
                        onClick={close}
                        className="nav-mobile-item nav-mobile-item--secondary text-left"
                      >
                        Sign Out
                      </button>
                    </SignOutButton>
                  </>
                )}
              </nav>

              {/* Mailto escape hatch — bottom of drawer. */}
              {CONTACT_EMAIL && (
                <p
                  className="ll-body mt-4 text-xs font-light italic"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  For urgent questions,{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    onClick={close}
                    style={{ color: "var(--primary)" }}
                  >
                    email us directly
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
