// src/app/admin/orders/page.tsx
//
// Admin orders list. Every order, newest first, with the buyer, total,
// payment status, and the derived fulfillment checkpoint. Rows link to
// /admin/orders/{id} where checkpoints are managed.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetJson, ApiError } from "@/lib/request";
import { fulfillmentLabel, type AdminOrderListItem } from "@/types/adminOrders";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PAYMENT_PILL: Record<string, string> = {
  PaymentPending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Paid:           "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Cancelled:      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  Failed:         "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const FULFILLMENT_PILL: Record<string, string> = {
  Received:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Shipped:   "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Returned:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<AdminOrderListItem[] | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetJson<AdminOrderListItem[]>("/admin/api/orders")
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? `Failed to load orders (${e.status}).` : "Failed to load orders.");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Orders</h1>
        {orders && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {!error && orders === null && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      )}

      {orders !== null && orders.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
          No orders yet.
        </p>
      )}

      {orders !== null && orders.length > 0 && (
        <ul className="space-y-2">
          {orders.map((o) => {
            const checkpoint = fulfillmentLabel(o);
            return (
              <li key={o.orderId}>
                <Link
                  href={`/admin/orders/${o.orderId}`}
                  className="block rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Order #{o.orderId}
                    </span>

                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${PAYMENT_PILL[o.status] ?? PAYMENT_PILL.Cancelled}`}>
                      {o.status === "PaymentPending" ? "Awaiting payment" : o.status}
                    </span>

                    {checkpoint && (
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${FULFILLMENT_PILL[checkpoint]}`}>
                        {checkpoint}
                      </span>
                    )}

                    <span className="ml-auto font-medium text-gray-800 dark:text-gray-100">
                      {money(o.amountCents)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{shortDate(o.createdAt)}</span>
                    <span>·</span>
                    <span>{o.itemCount} {o.itemCount === 1 ? "piece" : "pieces"}</span>
                    <span>·</span>
                    <span className="truncate">{o.customerName || o.customerEmail}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
