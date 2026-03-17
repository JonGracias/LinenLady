// src/middleware.ts
export const runtime = "nodejs";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

const isAdminRoute    = createRouteMatcher(["/admin(.*)"]);
const isAdminExcluded = createRouteMatcher([
  "/admin",
  "/admin/unauthorized",
  "/admin/api(.*)",
]);
const isAccountRoute  = createRouteMatcher(["/account(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAccountRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req) && !isAdminExcluded(req)) {
    await auth.protect();

    const { userId } = await auth();
    if (!userId) {
      return Response.redirect(new URL("/admin/unauthorized", req.url));
    }

    const adminOrgId = process.env.ADMIN_ORG_ID;
    if (!adminOrgId) throw new Error("ADMIN_ORG_ID is not configured.");

    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({ userId });
    const isMember = memberships.data.some((m) => m.organization.id === adminOrgId);

    if (!isMember) {
      return Response.redirect(new URL("/admin/unauthorized", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};