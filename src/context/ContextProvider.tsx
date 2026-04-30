"use client";

import { CartProvider } from "./CartContext";
import { DraftJobsProvider } from "./DraftJobsContext";
import { ItemAiProvider } from "./ItemAiContext";
import { StorefrontProvider } from "./StorefrontContext";
import { ToastProvider } from "./ToastHost";
import { EnsureActiveOrg } from "@/components/EnsureActiveOrg";

interface ContextProviderTreeProps {
  children: React.ReactNode;
}

/**
 * If you want to mitigate Azure SQL cold-start latency by pre-warming the
 * backend, hit a dedicated /api/db-warmup route here on mount. Don't list
 * data routes — they'll cache the warm-up response and serve stale data.
 *
 * Example:
 *   useEffect(() => {
 *     fetch("/admin/api/db-warmup", { credentials: "include" }).catch(() => {});
 *   }, []);
 */
export default function ContextProviderTree({ children }: ContextProviderTreeProps) {
  return (
    <ToastProvider>
      <EnsureActiveOrg />
      <DraftJobsProvider>
        <ItemAiProvider>
          <StorefrontProvider>
            <CartProvider>{children}</CartProvider>
          </StorefrontProvider>
        </ItemAiProvider>
      </DraftJobsProvider>
    </ToastProvider>
  );
}
