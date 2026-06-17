// src/lib/contracts/contact.ts
//
// Mirrors the C# contracts in LinenLady.Api/Features/Contact/Contracts/ContactContracts.cs.
// Keep these in sync — the API validates with DataAnnotations, this validates client-side
// for fast feedback, and the request body shape must match.

export type ContactRequest = {
  fromName:    string;
  fromEmail:   string;
  body:        string;
  subject?:    string;
  productSku?: string;
  /** Honeypot. Must be empty string. Real users never see the input. */
  website?:    string;
  /** Cloudflare Turnstile token. Verified server-side before send. */
  turnstileToken: string;
};

export type ContactResponse = {
  submissionId: number;
  message:      string;
};

/** Server error shapes we know about (DomainException → ProblemDetails). */
export type ContactErrorKind =
  | "validation"      // 400 — bad input
  | "rate_limited"    // 429 — too many submissions
  | "provider_down"   // 502 — Resend unreachable
  | "unknown";

export type ContactError = {
  kind:    ContactErrorKind;
  message: string;
};
