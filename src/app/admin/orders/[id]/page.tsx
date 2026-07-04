// src/app/admin/orders/[id]/page.tsx
//
// Admin order detail: buyer, items (with primary photos), shipping snapshot,
// and the fulfillment checkpoint timeline. Checkpoints are timestamps on the
// order row — Received comes free with payment (paidAt); Shipped / Delivered
// are marked here in sequence; Returned is the exceptional path. Each set
// checkpoint can be undone, which just clears its timestamp.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGetJson, apiSendJson, ApiError } from "@/lib/request";
import type { AdminOrderDetail, OrderCheckpoint } from "@/types/adminOrders";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function longDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

type Step = {
  key:       "received" | OrderCheckpoint;
  label:     string;
  at:        string | null;
  /** Checkpoint the button sets; null = not settable (received is automatic). */
  action:    OrderCheckpoint | null;
  danger?:   boolean;
};

export default function AdminOrderDetailPage() {
  const params  = useParams();
  const orderId = Number(params?.id);

  const [detail, setDetail]   = useState<AdminOrderDetail | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [busy, setBusy]       = useState<OrderCheckpoint | null>(null);

  const load = useCallback(() => {
    apiGetJson<AdminOrderDetail>(`/admin/api/orders/${orderId}`)
      .then(setDetail)
      .catch((e: unknown) => {
        setError(
          e instanceof ApiError && e.status === 404
            ? "Order not found."
            : "Failed to load the order."
        );
      });
  }, [orderId]);

  useEffect(() => {
    if (Number.isFinite(orderId) && orderId > 0) load();
    else setError("Invalid order id.");
  }, [orderId, load]);

  const setCheckpoint = async (checkpoint: OrderCheckpoint, clear: boolean) => {
    if (busy) return;
    setBusy(checkpoint);
    setError(null);
    try {
      const updated = await apiSendJson<AdminOrderDetail, { checkpoint: string; clear: boolean }>(
        `/admin/api/orders/${orderId}/checkpoint`,
        "POST",
        { checkpoint, clear }
      );
      setDetail(updated);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.bodyText || "Update failed." : "Update failed.");
    } finally {
      setBusy(null);
    }
  };

  if (error && !detail) {
    return (
      <div className="mt-6">
        <BackLink />
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mt-6 space-y-3">
        <BackLink />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const { order, customerName, customerEmail } = detail;
  const isPaid = order.status === "Paid";

  const steps: Step[] = [
    { key: "received",  label: "Order received", at: order.paidAt,      action: null },
    { key: "shipped",   label: "Shipped",        at: order.shippedAt,   action: "shipped" },
    { key: "delivered", label: "Delivered",      at: order.deliveredAt, action: "delivered" },
    { key: "returned",  label: "Returned",       at: order.returnedAt,  action: "returned", danger: true },
  ];

  // The next linear step is the first unset one among shipped → delivered.
  const nextAction: OrderCheckpoint | null =
    !order.shippedAt ? "shipped" : !order.deliveredAt ? "delivered" : null;

  return (
    <div className="mt-6 space-y-4">
      <BackLink />

      {/* ── Header card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Order #{order.orderId}
          </h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {order.status === "PaymentPending" ? "Awaiting payment" : order.status}
          </span>
          <span className="ml-auto text-lg font-semibold text-gray-800 dark:text-gray-100">
            {money(order.amountCents)}
          </span>
        </div>

        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Placed {longDate(order.createdAt)} ·{" "}
          <span className="text-gray-700 dark:text-gray-300">{customerName}</span>{" "}
          &lt;<a href={`mailto:${customerEmail}`} className="underline hover:opacity-70">{customerEmail}</a>&gt;
        </div>

        {order.customerNotes && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">
            <span className="mr-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Note</span>
            {order.customerNotes}
          </p>
        )}
      </div>

      {/* ── Checkpoints ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Fulfillment</h2>

        {!isPaid && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Checkpoints become available once the order is paid.
          </p>
        )}

        {isPaid && (
          <ol className="space-y-0">
            {steps.map((step, idx) => {
              const done      = !!step.at;
              const isNext    = step.action !== null && step.action === nextAction && !step.danger;
              const isLast    = idx === steps.length - 1;
              const dotColor  = done
                ? (step.danger ? "bg-red-500" : "bg-emerald-500")
                : "bg-gray-300 dark:bg-gray-600";

              return (
                <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {/* Rail */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-gray-700"
                    />
                  )}
                  <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${dotColor}`} />

                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`text-sm font-medium ${done ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                      {step.label}
                    </span>

                    {done && step.at && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{longDate(step.at)}</span>
                    )}

                    <span className="ml-auto flex items-center gap-2">
                      {/* Mark button — the next linear step, or Returned any time after payment */}
                      {!done && step.action && (isNext || step.danger) && (
                        <button
                          onClick={() => void setCheckpoint(step.action!, false)}
                          disabled={busy !== null}
                          className={[
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                            step.danger
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
                          ].join(" ")}
                        >
                          {busy === step.action ? "Saving…" : `Mark ${step.label.toLowerCase().replace("order ", "")}`}
                        </button>
                      )}

                      {/* Undo — clears the timestamp */}
                      {done && step.action && (
                        <button
                          onClick={() => void setCheckpoint(step.action!, true)}
                          disabled={busy !== null}
                          className="text-xs text-gray-400 underline transition-colors hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          {busy === step.action ? "…" : "Undo"}
                        </button>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* ── Items ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
          Pieces ({order.items.length})
        </h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {order.items.map((item) => (
            <li key={item.orderItemId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt={item.itemName}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                  —
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-gray-800 dark:text-gray-100">{item.itemName}</span>
                {item.itemSku && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">SKU {item.itemSku}</span>
                )}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {money(item.unitPriceCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Ship to ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Ship to</h2>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {order.shipStreet1}<br />
          {order.shipStreet2 && <>{order.shipStreet2}<br /></>}
          {order.shipCity}, {order.shipState} {order.shipZip}
          {order.shipCountry && order.shipCountry !== "US" && <><br />{order.shipCountry}</>}
        </p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/orders"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
    >
      ← Orders
    </Link>
  );
}
