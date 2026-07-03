"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

// Guards against a redirect loop: if we bounced back here within this window,
// stop auto-redirecting so the user isn't ping-ponged.
const BOUNCE_KEY    = "ll_signup_bounce_at";
const BOUNCE_WINDOW = 6000; // ms

/**
 * Same-origin target extracted from ?redirect_url=. Clerk sends an absolute
 * URL; we only honor it if it points back at our own origin (no open redirect).
 */
function safeRedirectTarget(): string {
  const raw = new URLSearchParams(window.location.search).get("redirect_url");
  if (!raw) return "/";
  try {
    const u = new URL(raw, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Already-authenticated user landed here (e.g. a stale server-side session
    // bounce). Send them back where they were going rather than showing an
    // empty SignUp widget. A full-document navigation forces Clerk's handshake
    // to refresh the __session cookie that caused the bounce.
    const now  = Date.now();
    const last = Number(sessionStorage.getItem(BOUNCE_KEY) ?? 0);

    if (now - last < BOUNCE_WINDOW) {
      sessionStorage.removeItem(BOUNCE_KEY);
      return;
    }

    sessionStorage.setItem(BOUNCE_KEY, String(now));
    window.location.replace(safeRedirectTarget());
  }, [isLoaded, isSignedIn]);

  // Don't render an empty <SignUp/> at an already-authenticated user.
  if (isLoaded && isSignedIn) return null;

  return (
    <div
      className="flex min-h-[70vh] items-center justify-center py-12"
      style={{ background: "var(--cream)" }}
    >
      <SignUp />
    </div>
  );
}
