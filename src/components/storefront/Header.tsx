"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/#shop",      label: "Shop"      },
  { href: "/about",     label: "Our Story"  },
  { href: "/#schedule", label: "Find Us"    },
  { href: "/#contact",  label: "Inquire"    },
];

const HELP_LINKS = [
  { href: "/account?tab=reservations", label: "Order History",    desc: "View your past and active reservations" },
  { href: "/account?tab=reservations", label: "Where's My Order", desc: "Check your reservation or payment status" },
  { href: "/terms",                    label: "Shipping & Returns", desc: "Policies on shipping and all sales final" },
  { href: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`, label: "Email Us",         desc: "Get in touch with Noemi directly" },
];

export default function StorefrontHeader() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <header
      id="site-header"
      className="relative z-10 flex items-center justify-between border-b px-6 py-4 md:px-12 md:py-5"
      style={{ borderColor: "var(--linen)", backgroundColor: "var(--cream)" }}
    >
      {/* ── Wordmark ── */}
      <Link
        href="/"
        className="ll-display text-lg italic shrink-0"
        style={{ color: "var(--brown)", letterSpacing: "0.02em", textDecoration: "none" }}
      >
        {/* Full name on md+, just "Noemi" on mobile */}
        <span className="hidden md:inline">
          Noemi{" "}
          <span style={{ fontStyle: "normal", color: "var(--rose-deep)" }}>
            · The Linen Lady
          </span>
        </span>
        <span className="md:hidden">Noemi</span>
      </Link>

      {/* ── Right side ── */}
      <div className="flex items-center gap-6 md:gap-10">

        {/* ── Nav links — hidden on mobile ── */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="ll-label text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:text-[#b07878]"
              style={{ color: "var(--ink-soft)", textDecoration: "none" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Help dropdown ── */}
        <div className="relative">
          <button
            onClick={() => setHelpOpen((o) => !o)}
            className="ll-label flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:text-[#b07878]"
            style={{ color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer" }}
          >
            Help
            <span
              className="text-[0.55rem] transition-transform duration-200"
              style={{ display: "inline-block", transform: helpOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
          </button>

          {helpOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setHelpOpen(false)}
              />
              {/* Dropdown */}
              <div
                className="absolute right-0 top-full z-20 mt-2 w-72 border"
                style={{ background: "var(--cream)", borderColor: "var(--linen)", boxShadow: "0 8px 30px rgba(44,31,26,0.12)" }}
              >
                {/* Corner accents */}
                <div className="absolute left-[-1px] top-[-1px] h-6 w-6 border-l-2 border-t-2" style={{ borderColor: "var(--rose)" }} />
                <div className="absolute bottom-[-1px] right-[-1px] h-6 w-6 border-b-2 border-r-2" style={{ borderColor: "var(--sage)" }} />

                <div className="px-5 pb-2 pt-5">
                  <div
                    className="ll-label mb-3 text-[0.58rem] font-medium uppercase tracking-[0.2em]"
                    style={{ color: "var(--sage-deep)" }}
                  >
                    Help &amp; Support
                  </div>
                </div>

                <div className="flex flex-col pb-3">
                    {HELP_LINKS.map(({ href, label, desc }) => {
                      const isExternal = href.startsWith("mailto:") || href.startsWith("http");
                      const inner = (
                        <>
                          <span
                            className="ll-label text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-colors group-hover:text-[#b07878]"
                            style={{ color: "var(--ink)" }}
                          >
                            {label}
                          </span>
                          <span
                            className="ll-body text-xs font-light"
                            style={{ color: "var(--ink-soft)" }}
                          >
                            {desc}
                          </span>
                        </>
                      );

                      const sharedProps = {
                        onClick: () => setHelpOpen(false),
                        className: "group flex flex-col gap-0.5 px-5 py-3 transition-colors duration-150",
                        style: { textDecoration: "none" } as React.CSSProperties,
                        onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "var(--cream-dark)"),
                        onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "transparent"),
                      };

                      return isExternal ? (
                        <a key={label} {...sharedProps} href={href}>
                          {inner}
                        </a>
                      ) : (
                        <Link key={label} {...sharedProps} href={href}>
                          {inner}
                        </Link>
                      );
                    })}
                </div>

                <div
                  className="border-t px-5 py-3"
                  style={{ borderColor: "var(--linen)" }}
                >
                  <p
                    className="ll-body text-xs font-light italic"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    For urgent questions, email{" "}
                    <a
                      href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                      style={{ color: "var(--rose-deep)" }}
                    >
                      {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Auth ── */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button
                className="ll-label border px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.15em] transition-all duration-200 hover:-translate-y-px hover:shadow-sm"
                style={{
                  color: "var(--rose-deep)",
                  borderColor: "var(--rose-deep)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </SignInButton>
          ) : (
            <>
              <Link
                href="/account"
                className="ll-label hidden md:block text-[0.72rem] font-medium uppercase tracking-[0.15em] transition-colors duration-200 hover:text-[#b07878]"
                style={{ color: "var(--ink-soft)", textDecoration: "none" }}
              >
                My Account
              </Link>
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-7 h-7" },
                }}
              />
            </>
          )}
        </div>

      </div>
    </header>
  );
}