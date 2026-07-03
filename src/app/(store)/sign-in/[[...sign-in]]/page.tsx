"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

// Guards against a redirect loop: if we bounced back here within this window,
// stop auto-redirecting so the user isn't ping-ponged.
const BOUNCE_KEY    = "ll_signin_bounce_at";
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

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // The middleware bounced an already-authenticated user here — usually a
    // stale server-side session cookie (the JWT aged out while clerk-js still
    // holds a live session). Rather than sit on an empty SignIn widget, send
    // them back where they were going. A full-document navigation (not the
    // client router) forces Clerk's handshake to refresh the __session cookie,
    // which clears the expired-cookie state that caused the bounce.
    const now  = Date.now();
    const last = Number(sessionStorage.getItem(BOUNCE_KEY) ?? 0);

    // If we just did this, we're likely in a loop (handshake isn't refreshing);
    // don't redirect again — leave the user here to retry manually.
    if (now - last < BOUNCE_WINDOW) {
      sessionStorage.removeItem(BOUNCE_KEY);
      return;
    }

    sessionStorage.setItem(BOUNCE_KEY, String(now));
    window.location.replace(safeRedirectTarget());
  }, [isLoaded, isSignedIn]);

  // Don't render an empty <SignIn/> at an already-authenticated user: either
  // the effect is redirecting them, or (loop-guard) they can refresh to retry.
  if (isLoaded && isSignedIn) return null;

  return (
    <div
      className="flex min-h-[70vh] items-center justify-center py-12"
      style={{ background: "var(--cream)" }}
    >
      <SignIn />
    </div>
  );
}
