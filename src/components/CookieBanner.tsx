"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_KEY = "ll_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible]  = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY) as ConsentState;
    if (stored) {
      setConsent(stored);
    } else {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  }

  if (!visible || consent !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t"
      style={{
        background:   "var(--ink)",
        borderColor:  "rgba(255,255,255,0.08)",
        boxShadow:    "0 -4px 30px rgba(44,31,26,0.2)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-6 px-12 py-5">
        {/* Text */}
        <div className="flex-1" style={{ minWidth: 280 }}>
          <p
            className="ll-body text-sm font-light leading-relaxed"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            We use cookies to keep your session active and remember your
            preferences. We don&apos;t sell your data or run advertising.{" "}
            <Link
              href="/privacy"
              className="underline transition-colors hover:text-white"
              style={{ color: "var(--rose-light)" }}
            >
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="ll-label border px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              color:       "rgba(255,255,255,0.55)",
              background:  "transparent",
              cursor:      "pointer",
            }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="ll-label px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-all hover:-translate-y-px"
            style={{
              background: "var(--rose-deep)",
              color:      "#fff",
              border:     "none",
              cursor:     "pointer",
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}