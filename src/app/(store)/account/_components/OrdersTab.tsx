// src/app/(store)/account/_components/OrdersTab.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { OrderDto, OrderStatus } from "@/types/customer";
import { useCustomerSession } from "@/context/CustomerSessionContext";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  PaymentPending: { bg: "#fef3c7", color: "#92400e", label: "Awaiting payment" },
  Paid:           { bg: "#d1fae5", color: "#065f46", label: "Paid" },
  Cancelled:      { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
  Failed:         { bg: "#fee2e2", color: "#991b1b", label: "Payment failed" },
};

function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="ll-label inline-block px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em]"
      style={{ background: s.bg, color: s.color, borderRadius: "0.15rem" }}
    >
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   CancelOrderButton — two-step inline confirm.

   First click: button label changes to "Are you sure? Tap again to cancel"
   and the styling shifts to a warning treatment. A 5-second timer
   auto-reverts to the initial state if the customer doesn't tap again,
   which keeps the surface low-commitment (no modal, no scary dialog,
   just a brief pause for second thoughts).

   Second click within the window: fires the cancel via session.cancelOrder
   and feeds any error message into the parent's error state. The button
   disables and shows "Cancelling…" while the request is in flight.

   Rendered only for PaymentPending orders (and Failed, since the customer
   may want to clean those up too); see the caller's status check.
───────────────────────────────────────────────────────────── */
function CancelOrderButton({
  orderId,
  onResult,
}: {
  orderId:  number;
  onResult: (msg: string | null) => void;
}) {
  const { cancelOrder } = useCustomerSession();
  const [stage, setStage] = useState<"idle" | "confirm" | "busy">("idle");
  const revertTimer = useRef<number | null>(null);

  // Clear pending revert on unmount so we don't setState on an unmounted
  // component if the customer navigates away mid-confirm.
  useEffect(() => {
    return () => {
      if (revertTimer.current !== null) {
        window.clearTimeout(revertTimer.current);
      }
    };
  }, []);

  const click = async () => {
    // Block clicks while a request is in flight.
    if (stage === "busy") return;

    if (stage === "idle") {
      // First click — arm the confirm and start the 5s auto-revert.
      setStage("confirm");
      onResult(null);
      revertTimer.current = window.setTimeout(() => {
        setStage("idle");
        revertTimer.current = null;
      }, 5000);
      return;
    }

    // Second click within the window — fire the cancel.
    if (revertTimer.current !== null) {
      window.clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
    setStage("busy");
    const result = await cancelOrder(orderId);
    if (result.ok) {
      // Success: orders array was refreshed in the context, this row will
      // re-render with status=Cancelled and our component unmounts (since
      // it only renders for cancellable statuses). Nothing to do here.
      onResult(null);
    } else {
      // Surface the message verbatim to the parent. The parent decides
      // whether to route to the message-Noemi flow based on `reason`.
      onResult(result.message);
      setStage("idle");
    }
  };

  const label = stage === "busy"    ? "Cancelling…"
              : stage === "confirm" ? "Are you sure? Tap again to confirm"
              :                       "Cancel This Order";

  return (
    <button
      onClick={click}
      disabled={stage === "busy"}
      className="ll-label text-[0.6rem] uppercase tracking-[0.12em] px-4 py-2 transition-all disabled:opacity-60"
      style={{
        background:   stage === "confirm" ? "rgba(153,27,27,0.08)" : "transparent",
        color:        stage === "confirm" ? "#991b1b"               : "var(--ink-soft)",
        border:       "1px solid",
        borderColor:  stage === "confirm" ? "rgba(153,27,27,0.4)"  : "var(--linen)",
        borderRadius: "0.2rem",
        cursor:       stage === "busy"    ? "wait" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab body
───────────────────────────────────────────────────────────── */

type OrdersTabProps = {
  orders:     OrderDto[];
  highlight?: number | null;   // ?placed=N from checkout redirect
};

export default function OrdersTab({ orders, highlight }: OrdersTabProps) {

  // Expanded-row state — starts with the highlighted order open if present,
  // otherwise the most recent. Customers usually want to see the most recent
  // order's details without an extra click.
  const [openId, setOpenId] = useState<number | null>(() => {
    if (highlight && orders.some(o => o.orderId === highlight)) return highlight;
    return orders[0]?.orderId ?? null;
  });

  // Cancel error state, keyed by orderId so a failure on one order's
  // cancel doesn't taint the UI of another. Cleared on the next attempt
  // or when the customer collapses+reopens the row.
  const [cancelErrors, setCancelErrors] = useState<Record<number, string | null>>({});

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="ll-display text-2xl italic mb-3" style={{ color: "var(--ink-soft)" }}>
          No orders yet
        </p>
        <p className="ll-body mb-6 text-sm font-light" style={{ color: "var(--ink-soft)" }}>
          When you check out from your basket, your orders show up here.
        </p>
        <Link href="/shop" className="btn-primary">Browse the Collection →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
          Your <em className="italic" style={{ color: "var(--rose-deep)" }}>orders</em>
        </h2>
        <p className="ll-label text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
          {orders.length} total
        </p>
      </div>

      {/* "Order placed" success banner — shown once per ?placed= load */}
      {highlight && orders.some(o => o.orderId === highlight) && (
        <div
          className="mb-6 p-4"
          style={{
            background:   "var(--sage-deep)",
            color:        "var(--cream)",
            borderRadius: "0.2rem",
          }}
        >
          <p className="ll-label mb-1 text-[0.62rem] uppercase tracking-[0.18em]">Order received</p>
          <p className="ll-body text-sm font-light">
            Order #{highlight} is in. Noemi will follow up in your messages —
            you can also reply on her thread anytime.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {orders.map(order => {
          const isOpen = openId === order.orderId;
          const itemCount = order.items.length;
          const cancelError = cancelErrors[order.orderId] ?? null;

          // The cancel button shows on PaymentPending (the obvious case)
          // and on Failed (customer should be able to dismiss those so
          // they stop seeing the red banner on their orders list). Paid
          // and Cancelled rows don't show it.
          const canCancel = order.status === "PaymentPending"
                         || order.status === "Failed";

          return (
            <li
              key={order.orderId}
              style={{
                background:   "var(--cream-dark)",
                border:       "1px solid var(--linen)",
                borderRadius: "0.25rem",
              }}
            >
              {/* Header row — always visible, click to toggle */}
              <button
                onClick={() => setOpenId(isOpen ? null : order.orderId)}
                className="flex w-full items-center gap-4 p-5 text-left"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="ll-display text-base" style={{ color: "var(--ink)" }}>
                      Order #{order.orderId}
                    </span>
                    <StatusPill status={order.status} />
                  </div>
                  <p className="ll-body mt-1 text-xs font-light" style={{ color: "var(--ink-soft)" }}>
                    {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "piece" : "pieces"}
                  </p>
                </div>
                <span className="ll-display text-base shrink-0" style={{ color: "var(--rose-deep)" }}>
                  {formatPrice(order.amountCents)}
                </span>
                <span className="ll-label shrink-0 text-[0.6rem]" style={{ color: "var(--ink-soft)" }}>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {/* Detail panel — line items, address, payment link */}
              {isOpen && (
                <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--linen)" }}>

                  {/* Items */}
                  <div className="mt-4 mb-5">
                    <p className="ll-label mb-2 text-[0.58rem] uppercase tracking-[0.15em]" style={{ color: "var(--ink-soft)" }}>
                      Pieces
                    </p>
                    <ul className="flex flex-col gap-3">
                      {order.items.map(item => (
                        <li key={item.orderItemId} className="flex items-center gap-3">
                          <div
                            className="shrink-0 overflow-hidden"
                            style={{ width: 48, height: 48, borderRadius: "0.2rem", background: "var(--cream)" }}
                          >
                            {item.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumbnailUrl} alt={item.itemName} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="ll-body text-sm" style={{ color: "var(--ink)" }}>
                              {item.itemName}
                            </p>
                            {item.itemSku && (
                              <p className="ll-label text-[0.55rem] uppercase tracking-[0.1em]" style={{ color: "var(--ink-soft)" }}>
                                {item.itemSku}
                              </p>
                            )}
                          </div>
                          <span className="ll-display text-sm shrink-0" style={{ color: "var(--ink-soft)" }}>
                            {formatPrice(item.unitPriceCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Shipping snapshot */}
                  {order.shipStreet1 && (
                    <div className="mb-5">
                      <p className="ll-label mb-1 text-[0.58rem] uppercase tracking-[0.15em]" style={{ color: "var(--ink-soft)" }}>
                        Shipping to
                      </p>
                      <p className="ll-body text-xs font-light leading-relaxed" style={{ color: "var(--ink)" }}>
                        {order.shipStreet1}
                        {order.shipStreet2 ? <><br />{order.shipStreet2}</> : null}
                        <br />
                        {order.shipCity}, {order.shipState} {order.shipZip}
                        {order.shipCountry && order.shipCountry !== "US" ? <><br />{order.shipCountry}</> : null}
                      </p>
                    </div>
                  )}

                  {/* Action row — Pay button + Cancel button arranged so the
                      primary action (paying) gets the prominent treatment
                      and the secondary (cancelling) reads as a quieter
                      escape hatch. Cancel is a sibling, not a competitor. */}
                  {(order.status === "PaymentPending" && order.squarePaymentLinkUrl) || canCancel ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {order.status === "PaymentPending" && order.squarePaymentLinkUrl && (
                        <a
                          href={order.squarePaymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-block px-5 py-2.5 text-[0.62rem] tracking-[0.12em]"
                          style={{ textDecoration: "none" }}
                        >
                          Complete Payment in Square →
                        </a>
                      )}
                      {canCancel && (
                        <CancelOrderButton
                          orderId={order.orderId}
                          onResult={(msg) => setCancelErrors(prev => ({ ...prev, [order.orderId]: msg }))}
                        />
                      )}
                    </div>
                  ) : null}

                  {/* Inline cancel error — surfaced just below the action
                      row. For the most common failure mode ("the payment
                      went through, message Noemi") we render a contact
                      link inline rather than just dumping the error text. */}
                  {cancelError && (
                    <p className="ll-body mt-3 text-xs italic" style={{ color: "#991b1b" }}>
                      {cancelError}
                      {/* If the error message hints at a paid order, surface
                          a contact link. Cheap heuristic — matches the
                          backend's OrderNotCancellableException message
                          patterns. */}
                      {cancelError.toLowerCase().includes("paid") && (
                        <>
                          {" "}
                          <Link
                            href={`/account?tab=contact&order=${order.orderId}`}
                            style={{ color: "var(--rose-deep)", textDecoration: "underline" }}
                          >
                            Message Noemi about this order
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  )}

                  {/* Cancelled-by-timeout messaging — explain what happened.
                      "Cancelled" with no PaidAt always means either the
                      sweeper or a customer-initiated cancel hit it. */}
                  {order.status === "Cancelled" && !order.paidAt && (
                    <p className="ll-body text-xs italic mt-3" style={{ color: "var(--ink-soft)" }}>
                      Available pieces have been returned to your basket.
                    </p>
                  )}

                  {/* Failed — Square reported a payment failure.
                      Distinct from Cancelled — items aren't automatically
                      returned because the customer engaged with Square
                      but the charge bounced. They can re-add from the
                      basket's expired section, or cancel the order
                      outright via the button above. */}
                  {order.status === "Failed" && !cancelError && (
                    <p className="ll-body text-xs italic mt-3" style={{ color: "#991b1b" }}>
                      Square reported a payment failure. You can cancel this
                      order, or try the pieces again from your basket if
                      they&apos;re still available.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}