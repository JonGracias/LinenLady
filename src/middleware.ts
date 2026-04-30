// src/middleware.ts
//
// Why this changed:
//
// The previous version called clerkClient().users.getOrganizationMembershipList
// on every admin request and granted access if the user was a member of
// ADMIN_ORG_ID — REGARDLESS of which org was active in their session. That had
// two problems:
//
//   1. Privilege confusion. The forwarded JWT carries the user's *active* org
//      claim. If the C# API uses the org id for tenant scoping, a user could
//      be let in by middleware but operate against the wrong org's data.
//   2. Latency. Every /admin request paid for a Clerk API roundtrip.
//
// New behavior: require sessionClaims.o.id === ADMIN_ORG_ID. EnsureActiveOrg
// (client) handles switching the active org to the admin one if the user is a
// member; users who aren't members never get a matching active org and get
// bounced.
//
// Note on token shape: this codebase uses Clerk session tokens v2, where the
// active org info is nested under `o`:
//   { o: { id, rol, slg }, sub, sid, ... }
// In v1 it was flat (`org_id`, `org_role`, `org_slug`). If you ever roll back
// to v1 tokens, update this matcher.

export const runtime = "nodejs";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute   = createRouteMatcher(["/admin(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);

type V2OrgClaim = { id?: string; rol?: string; slg?: string };

export default clerkMiddleware(async (auth, req) => {
  if (isAccountRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    await auth.protect();

    const adminOrgId = process.env.ADMIN_ORG_ID;
    if (!adminOrgId) throw new Error("ADMIN_ORG_ID is not configured.");

    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return Response.redirect(new URL("/unauthorized", req.url));
    }

    const activeOrgId = (sessionClaims as { o?: V2OrgClaim } | null)?.o?.id;
    if (activeOrgId !== adminOrgId) {
      return Response.redirect(new URL("/unauthorized", req.url));
    }

    // Optional: also require the admin role within that org. Uncomment if you
    // want to lock /admin to org admins specifically (members alone wouldn't pass).
    //
    // const role = (sessionClaims as { o?: V2OrgClaim } | null)?.o?.rol;
    // if (role !== "admin") {
    //   return Response.redirect(new URL("/unauthorized", req.url));
    // }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
