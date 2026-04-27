"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { CartProvider } from "./CartContext";
import { DraftJobsProvider } from "./DraftJobsContext";
import { InventoryProvider } from "./InventoryContext";
import { ItemAiProvider } from "./ItemAiContext";
import { StorefrontProvider } from "./StorefrontContext";
import { ToastProvider } from "./ToastHost";
import { EnsureActiveOrg } from "@/components/EnsureActiveOrg";
import { useEffect } from "react";

interface ContextProviderTreeProps {
  children: React.ReactNode;
}
export function warmApiRoutes(routes: string[]) {
  for (const route of routes) {
    fetch(route, {
      method: "GET",
      credentials: "include",
    }).catch(() => {
      // swallow errors — warmup must never affect UI
    });
  }
}

/**
 * Global context provider order:
 * 1. RepoProvider – loads repos, extracts languages, star data, filters, etc.
 * 2. UIProvider – manages global UI state (hover, message shell, scrolling).
 * 3. LanguageIconProvider – uses RepoContext to load icons for languages.
*/
export default function ContextProviderTree({ children }: ContextProviderTreeProps) {
  
  
  useEffect(() => {
    warmApiRoutes([
      "",
      "",
    ]);
  }, []);
  return (
        <ToastProvider>
          <EnsureActiveOrg />
          <DraftJobsProvider>
              <ItemAiProvider>
                <StorefrontProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </StorefrontProvider>
              </ItemAiProvider>
          </DraftJobsProvider>
        </ToastProvider>
  );
}
