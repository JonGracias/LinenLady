// In a client component that runs after sign-in, e.g. a ClerkProvider child
"use client";
import { useEffect } from "react";
import { useOrganizationList, useAuth } from "@clerk/nextjs";

export function EnsureActiveOrg() {
  const { isLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: false },
  });
  const { orgId } = useAuth();

  useEffect(() => {
    if (!isLoaded || orgId) return; // already active, nothing to do
    const first = userMemberships.data?.[0];
    if (first) setActive({ organization: first.organization.id });
  }, [isLoaded, orgId, userMemberships.data, setActive]);
  
  return null;
}