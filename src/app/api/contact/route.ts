// src/app/api/contact/route.ts
//
// Public BFF proxy for POST /api/contact → LinenLady.API.
// No Clerk auth (the underlying controller is [AllowAnonymous]).
//
// What this route DOES add over a direct browser fetch:
//   • Hides the C# API URL from the public internet
//   • Forwards the real client IP via X-Forwarded-For so the API's
//     rate-limit lookups key on the actual visitor, not the Vercel/App-Service
//     egress IP
//   • Centralizes error shape so the form component never has to know the
//     difference between "Next.js couldn't reach the API" and "the API
//     returned a domain error"

import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.LINENLADY_API_BASE_URL || "http://localhost:5152";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";   // never cache
export const revalidate = 0;

export async function POST(req: NextRequest) {
  // Read the body once; we'll re-serialize it for the upstream call.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { kind: "validation", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Resolve the original client IP. NextRequest exposes the immediate peer in
  // req.ip, but on Vercel/App Service the chain matters — prefer the leftmost
  // entry of x-forwarded-for if present, since that's the original client.
  const xff      = req.headers.get("x-forwarded-for");
  const clientIp = xff?.split(",")[0]?.trim() || "";
  const ua       = req.headers.get("user-agent") || "";

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      cache:  "no-store",
      headers: {
        "Content-Type":     "application/json",
        // Pass through so the API sees the *visitor's* IP, not ours.
        "X-Forwarded-For":  clientIp,
        "User-Agent":       ua,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure between Next.js and the API — treat as provider down.
    console.error("[contact] upstream fetch failed:", err);
    return NextResponse.json(
      {
        kind:    "provider_down",
        message: "We couldn't send your message right now. Please try again in a few minutes.",
      },
      { status: 502 }
    );
  }

  // Successful submission — pass through the API's response body.
  if (upstream.ok) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  }

  // Map upstream status to our public error contract.
  const text = await upstream.text();
  let upstreamMessage = text;
  try {
    // ASP.NET ProblemDetails has { title, detail }
    const parsed = JSON.parse(text);
    upstreamMessage = parsed.detail || parsed.title || text;
  } catch {
    // upstream returned plain text — keep as-is
  }

  const kind: "validation" | "rate_limited" | "provider_down" | "unknown" =
      upstream.status === 400 ? "validation"
    : upstream.status === 429 ? "rate_limited"
    : upstream.status === 502 ? "provider_down"
    : "unknown";

  return NextResponse.json(
    { kind, message: upstreamMessage || "Something went wrong." },
    { status: upstream.status }
  );
}
