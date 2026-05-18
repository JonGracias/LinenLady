// src/lib/contact/submitContact.ts
//
// Client-side helper. Calls the BFF proxy at /api/contact and returns either
// a ContactResponse on success or a typed ContactError. No throwing — callers
// pattern-match on the discriminated result.

import type {
  ContactRequest,
  ContactResponse,
  ContactError,
} from "@/lib/contracts/contact";

export type SubmitResult =
  | { ok: true;  data: ContactResponse }
  | { ok: false; error: ContactError };

export async function submitContact(
  req: ContactRequest,
  signal?: AbortSignal
): Promise<SubmitResult> {
  let resp: Response;
  try {
    resp = await fetch("/api/contact", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(req),
      signal,
    });
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      return { ok: false, error: { kind: "unknown", message: "Cancelled." } };
    }
    return {
      ok: false,
      error: {
        kind:    "provider_down",
        message: "Couldn't reach the server. Check your connection and try again.",
      },
    };
  }

  // 200 OK — happy path
  if (resp.ok) {
    const data = (await resp.json()) as ContactResponse;
    return { ok: true, data };
  }

  // The proxy normalized error shapes for us — read it directly.
  let error: ContactError;
  try {
    error = (await resp.json()) as ContactError;
  } catch {
    error = { kind: "unknown", message: "Something went wrong." };
  }
  return { ok: false, error };
}
