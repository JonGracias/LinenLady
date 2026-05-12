// src/lib/contact/mailProvider.ts
//
// Parse the user's email address to infer their primary mail app, so the
// "Open in your mail app" affordance can label itself sensibly.
//
// IMPORTANT: this is COSMETIC ONLY. The actual send goes through our backend
// (POST /api/contact → Resend → Noemi). The provider info just lets us label
// the secondary fallback button accurately ("Open Gmail" vs "Open Mail").

export type MailProvider =
  | "gmail"
  | "outlook"
  | "yahoo"
  | "icloud"
  | "aol"
  | "proton"
  | "default";

export function getMailProvider(email: string | null | undefined): MailProvider {
  if (!email) return "default";

  // Pull domain, lowercase, trim trailing dots.
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return "default";
  const domain = email.slice(at + 1).toLowerCase().replace(/\.+$/, "");

  switch (domain) {
    case "gmail.com":
    case "googlemail.com":
      return "gmail";

    case "outlook.com":
    case "hotmail.com":
    case "live.com":
    case "msn.com":
      return "outlook";

    case "yahoo.com":
    case "ymail.com":
    case "rocketmail.com":
      return "yahoo";

    case "icloud.com":
    case "me.com":
    case "mac.com":
      return "icloud";

    case "aol.com":
      return "aol";

    case "proton.me":
    case "protonmail.com":
    case "pm.me":
      return "proton";

    default:
      return "default";
  }
}

/** Human-friendly label for the provider. */
export function providerLabel(p: MailProvider): string {
  switch (p) {
    case "gmail":   return "Gmail";
    case "outlook": return "Outlook";
    case "yahoo":   return "Yahoo Mail";
    case "icloud":  return "Mail";       // honest — iCloud has no web deeplink, falls to mailto
    case "aol":     return "AOL Mail";
    case "proton":  return "Mail";       // Proton blocks pre-filled bodies, mailto only
    default:        return "Mail";
  }
}
