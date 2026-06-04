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
