import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────
   Route matchers
   ───────────────────────────────────────────────────────────── */
const isAdminRoute   = createRouteMatcher(["/admin(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);

// Reachable by ANYONE before launch. Auth routes must be open to logged-out
// visitors or they could never register; the API is needed for sign-up sync
// and for address saves from /welcome.
const alwaysAllowed = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
  "/api(.*)",
]);

// Reachable only by a SIGNED-IN customer before launch.
const customerAllowed = createRouteMatcher(["/welcome(.*)"]);

/* ─────────────────────────────────────────────────────────────
   Launch flag
   ───────────────────────────────────────────────────────────
   Before LAUNCH_DATE: public → holding page, customers → /welcome,
   admins → full site. On/after it the gate is skipped entirely.
   To open early or delay, change this one constant and redeploy.
───────────────────────────────────────────────────────────── */
const LAUNCH_DATE = new Date("2026-07-04T00:00:00-04:00");
const isLaunched  = () => new Date() >= LAUNCH_DATE;

// The static holding page. Target index.html explicitly — the bare
// /coming-soon directory path doesn't reliably resolve on Azure SWA.
// This path ends in .html, which the matcher below excludes, so the
// redirect target is served statically and never re-enters the proxy.
const COMING_SOON = "/coming-soon/index.html";

type V2OrgClaim = { id?: string; rol?: string; slg?: string };

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  const adminOrgId  = process.env.ADMIN_ORG_ID;
  const activeOrgId = (sessionClaims as { o?: V2OrgClaim } | null)?.o?.id;
  const isAdmin     = !!userId && !!adminOrgId && activeOrgId === adminOrgId;

  /* ── Pre-launch gate ──────────────────────────────────────── */
  if (!isLaunched() && !isAdmin) {
    const path = req.nextUrl.pathname;

    // Normalize the bare directory path to the actual file.
    if (path === "/coming-soon") {
      return NextResponse.redirect(new URL(COMING_SOON, req.url));
    }

    const isComingSoon = path.startsWith("/coming-soon/");

    if (isComingSoon || alwaysAllowed(req)) {
      // Reachable by anyone pre-launch — let through untouched.
      // (holding page + assets, auth routes, API)
    } else if (userId && customerAllowed(req)) {
      // Signed-in customer on their pre-launch page — let through.
    } else if (userId) {
      // Signed-in customer reaching for the sealed store → /welcome.
      return NextResponse.redirect(new URL("/welcome", req.url));
    } else {
      // Anonymous visitor anywhere else → holding page.
      return NextResponse.redirect(new URL(COMING_SOON, req.url));
    }
  }

  /* ── Account protection (unchanged) ───────────────────────── */
  if (isAccountRoute(req)) {
    await auth.protect();
  }

  /* ── Admin protection (unchanged) ─────────────────────────── */
  if (isAdminRoute(req)) {
    await auth.protect();
    if (!adminOrgId) throw new Error("ADMIN_ORG_ID is not configured.");
    if (!userId || activeOrgId !== adminOrgId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};