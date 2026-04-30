// src/components/EnsureActiveOrg.tsx
"use client";

import { useEffect } from "react";
import { useOrganizationList, useAuth } from "@clerk/nextjs";

const ADMIN_ORG_ID = process.env.NEXT_PUBLIC_ADMIN_ORG_ID;

export function EnsureActiveOrg() {
  const { isLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: false },
  });
  const { orgId } = useAuth();

  useEffect(() => {
    if (!isLoaded || orgId) return; // already active, nothing to do

    const memberships = userMemberships.data ?? [];
    if (memberships.length === 0) return;

    // Prefer the admin org when the user is a member; otherwise fall back to
    // the first one. This makes /admin work without the user having to
    // manually switch orgs in the Clerk UI.
    const preferred =
      (ADMIN_ORG_ID && memberships.find((m) => m.organization.id === ADMIN_ORG_ID))
      ?? memberships[0];

    setActive({ organization: preferred.organization.id });
  }, [isLoaded, orgId, userMemberships.data, setActive]);

  return null;
}
