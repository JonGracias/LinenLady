// src/components/storefront/Header.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useBasket } from "@/context/BasketContext";

const STORE_NAME    = process.env.NEXT_PUBLIC_STORE_NAME    ?? "The Linen Lady";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

const NAV_LINKS = [
  { href: "/shop",      label: "Collections" },
  { href: "/about",     label: "About Us"   },
  { href: "/#schedule", label: "Join Us at the Market"    },
  { href: "/contact",   label: "Contact"    },   // was "/#contact" — now points at the contact page
];

const HELP_LINKS = [
  { href: "/account?tab=orders",  label: "Order History",      desc: "View your past and active orders"          },
  { href: "/account?tab=orders",  label: "Where's My Order",   desc: "Check your order or payment status"        },
  { href: "/terms",               label: "Shipping & Returns", desc: "Policies on shipping and all sales final"  },
  { href: "/contact",             label: "Contact Noemi",      desc: "Send a question or inquiry"                },
];

function isExternalHref(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

const WORDMARK_CLASSES =
  "ll-display text-base font-normal italic tracking-wide";
const WORDMARK_STYLE: React.CSSProperties = {
  color: "var(--on-surface)",
  textDecoration: "none",
  letterSpacing: "0.04em",
};

// ─────────────────────────────────────────────────────────────────────────────
// BasketIcon
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
// HelpDropdown — desktop-only.
// ─────────────────────────────────────────────────────────────────────────────
function HelpDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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

            {/* Footer mailto stays as the escape hatch — for desktop users who'd
                rather skip the form and use their own mail app directly. */}
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
// AccountDropdown
// ─────────────────────────────────────────────────────────────────────────────
function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { isSignedIn, user } = useUser();

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
                    Basket, orders, addresses, messages
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

// ─────────────────────────────────────────────────────────────────────────────
// Main header
// ─────────────────────────────────────────────────────────────────────────────
export default function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { count } = useBasket();
  const drawerId = useId();

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

        <div className="flex items-center justify-end gap-4 min-w-0">
          <BasketIcon count={count} />
          <HelpDropdown />
          <AccountDropdown />
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
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