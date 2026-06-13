// src/app/(store)/account/_components/basket/ExpiredReservations.tsx
//
// The "Recently expired" view — historical reservations the customer no
// longer holds. Each row reads in one of FOUR states:
//
//   1. reAddable:           the item is purchasable and nobody else holds
//                           it. Render at full opacity with TRY AGAIN.
//
//   2. reAdded:             the customer already has an Active reservation
//                           on the same inventory item — clicked Try Again
//                           already, or re-added through another route.
//                           Render grayed with "Back in your basket".
//
//   3. inPendingPayment:    the customer has this item tied up in a
//                           PaymentPending order — they started checkout
//                           but didn't finish. Render grayed with "Awaiting
//                           your payment" and a direct link to the orders
//                           sub-view so they can resume. This is the case
//                           that previously showed "Still available" and
//                           silently 409'd on TRY AGAIN — the row truthfully
//                           told the customer the piece was available, but
//                           the server couldn't issue a new reservation
//                           because the customer's own order already held
//                           the inventory hostage.
//
//   4. !any of the above:   someone else has it, or it sold. Grayed with
//                           "No longer available", no action.
//
// The classification is computed client-side from data already loaded into
// the session context (reservations + orders), no extra round-trip and
// no DTO changes.

"use client";

import Link from "next/link";
import type { ReservationDto } from "@/types/customer";
import { formatPrice } from "@/lib/utils"
import { cfImage, cfSrcSet } from "@/lib/images";

type Props = {
  expired:           ReservationDto[];
  /** Inventory ids this customer currently has an Active reservation on. */
  inActiveBasket:    Set<number>;
  /** Inventory ids this customer has in a PaymentPending order — they
      started checkout but haven't completed payment. The server WILL
      refuse a re-add because the existing order row already holds the
      inventory; surfacing this state instead of letting the customer
      click TRY AGAIN avoids the silent 409. */
  inPendingPayment:  Set<number>;
  busyId:            number | null;
  onReAdd:           (reservationId: number) => void;
  /** Resolves a live thumbnail by inventory id from the shared cache.
      Returns null until the parent's ensureThumbnail() has fetched it. */
  getThumbnailUrl:   (inventoryId: number) => string | null;
};

export default function ExpiredReservations({
  expired,
  inActiveBasket,
  inPendingPayment,
  busyId,
  onReAdd,
  getThumbnailUrl,
}: Props) {
  if (expired.length === 0) {
    return (
      <p className="ll-body py-8 text-sm italic" style={{ color: "var(--ink-soft)" }}>
        Nothing recently expired.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
          Recently <em className="italic" style={{ color: "var(--rose-deep)" }}>expired</em>
        </h2>
        <p className="ll-label text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
          {expired.length} {expired.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <ul className="flex flex-col" style={{ borderTop: "1px solid var(--linen)" }}>
        {expired.map(r => {
          // Four-state classification in priority order. Each state is
          // exclusive — the cascade returns the first match.
          //
          //   reAdded         — customer holds an Active reservation on
          //                     this inventory id. Wins over canReAdd
          //                     because canReAdd is a snapshot from fetch
          //                     time and the customer just got it back.
          //   pendingPayment  — customer has it locked in their own
          //                     PaymentPending order. Wins over canReAdd
          //                     for the same reason: canReAdd is stale,
          //                     and the server WILL 409 the re-add
          //                     because the customer's existing order
          //                     row holds the inventory. Surface the
          //                     state honestly with a path back to
          //                     completing the payment.
          //   reAddable       — canReAdd is true AND customer doesn't
          //                     hold it in either form. Show TRY AGAIN.
          //   (else)          — gone. Sold or someone else has it.
          const reAdded         = inActiveBasket.has(r.inventoryId);
          const pendingPayment  = !reAdded && inPendingPayment.has(r.inventoryId);
          const reAddable       = !reAdded && !pendingPayment && r.canReAdd;

          // Visual: grayed for every state except the actionable
          // "still available" case. Pending-payment stays grayed (the
          // customer can't act on the row HERE — they have to act on
          // the orders sub-view) but gets a sage-tinted opacity rather
          // than the dull no-longer-available shade. The hue difference
          // is subtle but communicates "this is a path forward, not
          // a dead end."
          const opacity = reAddable ? 1
                        : pendingPayment ? 0.85
                        : 0.55;

          return (
            <li
              key={r.reservationId}
              className="flex items-center gap-4 py-4"
              style={{
                borderBottom: "1px solid var(--linen)",
                opacity,
              }}
            >
              {/* Thumb — live-resolved from the shared cache, with the
                  (always-null) DTO field only as a last-resort fallback. */}
              {(() => {
                const thumb = getThumbnailUrl(r.inventoryId) ?? r.thumbnailUrl;
                return (
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{ width: 48, height: 48, borderRadius: "0.2rem", background: "var(--cream-dark)" }}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cfImage(thumb, { width: 96 })}
                        srcSet={cfSrcSet(thumb, [48, 96, 144])}
                        sizes="48px"
                        alt={r.itemName ?? ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                );
              })()}

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="ll-display text-sm font-normal" style={{ color: "var(--ink)" }}>
                  {r.itemName ?? "Linen Lady piece"}
                </p>
                <p
                  className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]"
                  style={{
                    color: pendingPayment ? "var(--rose-deep)" : "var(--ink-soft)",
                  }}
                >
                  {reAddable        ? "Still available"
                    : reAdded         ? "Back in your basket"
                    : pendingPayment  ? "Awaiting your payment"
                    :                   "No longer available"}
                </p>
              </div>

              {/* Price */}
              <span className="ll-display text-xs" style={{ color: "var(--ink-soft)" }}>
                {formatPrice(r.unitPriceCents)}
              </span>

              {/* Action slot — depends on state.
                  reAddable        → TRY AGAIN button (the existing path)
                  pendingPayment   → COMPLETE PAYMENT link to /basket?tab=orders
                                     (anchor, not button — it's pure navigation)
                  others           → invisible spacer to keep row alignment */}
              {reAddable ? (
                <button
                  onClick={() => onReAdd(r.reservationId)}
                  disabled={busyId === r.reservationId}
                  className="ll-label text-[0.6rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                  style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Try Again
                </button>
              ) : pendingPayment ? (
                <Link
                  href="/basket?tab=orders"
                  className="ll-label text-[0.6rem] uppercase tracking-[0.1em] hover:opacity-60"
                  style={{
                    color:           "var(--rose-deep)",
                    textDecoration:  "none",
                    width:           "5rem",
                    textAlign:       "right",
                  }}
                >
                  Complete →
                </Link>
              ) : (
                // Reserve the same horizontal slot so the rows align.
                <span aria-hidden className="block" style={{ width: "5rem" }} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}