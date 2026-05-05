// src/components/storefront/Header.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useBasket } from "@/context/BasketContext";

const STORE_NAME    = process.env.NEXT_PUBLIC_STORE_NAME    ?? "The Linen Lady";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

const NAV_LINKS = [
  { href: "/shop",      label: "Collection" },
  { href: "/about",     label: "Heritage"   },
  { href: "/#schedule", label: "Atelier"    },
  { href: "/#contact",  label: "Inquire"    },
];

const HELP_LINKS = [
  { href: "/account?tab=orders",   label: "Order History",      desc: "View your past and active orders"          },
  { href: "/account?tab=orders",   label: "Where's My Order",   desc: "Check your order or payment status"        },
  { href: "/terms",                label: "Shipping & Returns", desc: "Policies on shipping and all sales final"  },
  ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Email Us", desc: "Get in touch with Noemi directly" }] : []),
];

function isExternalHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

// Shared classes for the wordmark — defined once, used in both mobile and
// desktop slots. Keeps the two renders visually identical.
const WORDMARK_CLASSES =
  "ll-display text-base font-normal italic tracking-wide";
const WORDMARK_STYLE: React.CSSProperties = {
  color: "var(--on-surface)",
  textDecoration: "none",
  letterSpacing: "0.04em",
};

// ─────────────────────────────────────────────────────────────────────────────
// BasketIcon — extracted because it appears in two places and the SVG was
// noisy. (Was CartIcon — renamed alongside the cart→basket model migration;
// the bag/basket SVG was kept since it still reads as a shopping container.)
// ─────────────────────────────────────────────────────────────────────────────
function BasketIcon({ count }: { count: number }) {
  return (
    <Link
      href="/account?tab=basket"
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
// AccountDropdown — visible at all breakpoints, icon-only trigger. Mirrors
// HelpDropdown's open/close mechanics (outside-click backdrop, Escape
// dismissal, ARIA shape) but trades the text+chevron pattern for the same
// silent-icon affordance the basket uses. Contents switch on auth state:
//
//   Signed out → "Sign In" item, opens Clerk's modal sign-in flow.
//   Signed in  → "Account" link + "Sign Out" action, separated by a divider so
//                the destructive action reads as distinct from navigation.
//
// Why no visible label: this lives next to the basket icon at all breakpoints
// and needs to read as a peer of it, not as a nav item. Aria-label carries the
// accessibility load — sighted users get the icon; screen-reader users get
// "Account menu — {name}" when signed in so they know whose account it is
// before opening the menu.
// ─────────────────────────────────────────────────────────────────────────────
function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { isSignedIn, user } = useUser();

  // Close on Escape, restoring focus to the toggle. Identical to HelpDropdown.
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
        {isSignedIn ? (
          // Initial-in-circle, mirroring Clerk's UserButton avatar fallback.
          // 28px circle keeps the trigger's tap target close to the silhouette
          // version's visual weight. Initial sourced from firstName → username
          // → email, so something always renders even before Clerk hydrates a
          // full user object.
          <span
            className="ll-label inline-flex items-center justify-center text-[0.7rem] font-medium uppercase"
            style={{
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "9999px",
              background: "var(--primary)",
              color: "var(--on-primary)",
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
          // Person silhouette — same stroke weight (1.5) and 18×18 size as the
          // basket icon so the two read as a matched pair when anonymous.
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
              // ── Signed-out menu ─────────────────────────────────────────
              // SignInButton wraps a child it renders as the trigger. We give
              // it a div that visually matches a nav-dropdown-item so the
              // dropdown reads as a single coherent menu rather than a
              // dropdown-with-an-embedded-button. onClick on the wrapping div
              // closes the dropdown; SignInButton intercepts the underlying
              // click to open Clerk's modal.
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
              // ── Signed-in menu ──────────────────────────────────────────
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
                    Basket, orders, addresses, messages
                  </span>
                </Link>

                {/* Divider separates navigation from the destructive action.
                    Same border treatment as HelpDropdown's footer. */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main header
//
// Layout: a 3-column CSS grid (left | center | right). This replaces the
// previous absolute-positioning approach where the wordmark and the nav both
// targeted `left: 50%` and competed for the same horizontal slot. With the
// grid, each region owns its column and physically cannot overlap the others.
//
// Mobile  : [hamburger] [wordmark]  [actions]
// Desktop : [wordmark]  [nav]       [actions + help + account]
// ─────────────────────────────────────────────────────────────────────────────
export default function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { count } = useBasket();
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
      <div className="mx-auto grid h-16 max-w-[1800px] grid-cols-3 items-center gap-6 px-6 md:px-12">

        {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
        {/* Mobile: hamburger.  Desktop: wordmark.                            */}
        <div className="flex items-center justify-start min-w-0">
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

          <Link
            href="/"
            className={`hidden lg:block ${WORDMARK_CLASSES}`}
            style={WORDMARK_STYLE}
          >
            {STORE_NAME}
          </Link>
        </div>

        {/* ── CENTER COLUMN ──────────────────────────────────────────────── */}
        {/* Mobile: wordmark.  Desktop: primary nav.                          */}
        <div className="flex items-center justify-center min-w-0">
          <Link
            href="/"
            className={`lg:hidden truncate ${WORDMARK_CLASSES}`}
            style={WORDMARK_STYLE}
          >
            {STORE_NAME}
          </Link>

          <nav className="hidden lg:flex items-center gap-10" aria-label="Primary">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="nav-link">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────────────────── */}
        {/* BasketIcon and AccountDropdown stay visible at all breakpoints —
            both are icon-only and read as a matched pair. HelpDropdown is
            desktop-only (lg:); its mobile equivalents live inside the drawer
            below. The previous SignInButton / UserButton block was replaced
            by AccountDropdown — that menu now owns the sign-in trigger when
            anonymous and the account/sign-out actions when authenticated. */}
        <div className="flex items-center justify-end gap-4 min-w-0">
          <BasketIcon count={count} />
          <HelpDropdown />
          <AccountDropdown />
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

              <Link href="/account?tab=basket" onClick={closeMobile} className="nav-mobile-item">
                <span>Basket</span>
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

              {/* Mobile auth section — drawer-equivalent of AccountDropdown.
                  Kept simple here because the drawer is already a full menu;
                  no nested dropdown needed. */}
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="nav-mobile-item nav-mobile-item--secondary text-left"
                  >
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <>
                  <Link
                    href="/account"
                    onClick={closeMobile}
                    className="nav-mobile-item nav-mobile-item--secondary"
                  >
                    Account
                  </Link>
                  <SignOutButton>
                    <button
                      type="button"
                      onClick={closeMobile}
                      className="nav-mobile-item nav-mobile-item--secondary text-left"
                    >
                      Sign Out
                    </button>
                  </SignOutButton>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}