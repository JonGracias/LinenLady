// src/lib/contact/mailUrl.ts
//
// Builds a URL to compose an email in the user's preferred mail app.
// Used for the SECONDARY "Open in your mail app" button — the primary path
// is always our backend submit. This is the escape hatch for users who'd
// rather type in their own client.

import type { MailProvider } from "./mailProvider";

export type MailUrlInput = {
  to:       string;
  subject?: string;
  body?:    string;
};

/**
 * Build a compose URL for the given provider on the given device.
 * Mobile always falls through to mailto (handed off to native mail app).
 * Desktop uses the provider's webmail compose link where available.
 */
export function buildMailUrl(
  provider: MailProvider,
  isMobile: boolean,
  { to, subject = "", body = "" }: MailUrlInput
): string {
  const enc = encodeURIComponent;
  const mailto = `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`;

  // Mobile: native handler is always better than a browser tab to webmail.
  if (isMobile) return mailto;

  // Providers that don't expose reliable compose deeplinks — degrade gracefully.
  if (provider === "icloud" || provider === "proton" || provider === "default") {
    return mailto;
  }

  switch (provider) {
    case "gmail":
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;

    case "outlook":
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;

    case "yahoo":
      return `https://compose.mail.yahoo.com/?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;

    case "aol":
      return `https://mail.aol.com/webmail-std/en-us/suite?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;

    default:
      return mailto;
  }
}

/** Coarse mobile detection. SSR-safe — returns false on the server. */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  if ("ontouchstart" in window) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}
