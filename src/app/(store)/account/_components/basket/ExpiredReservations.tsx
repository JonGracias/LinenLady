// src/app/(store)/account/_components/basket/ExpiredReservations.tsx
//
// The "Recently expired" view — historical reservations the customer no
// longer holds. Each row reads in one of three states:
//
//   1. canReAdd: the item is purchasable and nobody else holds it.
//      Render at full opacity with an enabled TRY AGAIN button.
//
//   2. !canReAdd, but the customer already has an Active reservation on
//      the same inventory item — meaning they already clicked Try Again
//      and got it back, OR they re-added the same piece some other way.
//      Render grayed with a "Back in your basket" label, no button.
//      This is the post-Try-Again state without filtering the row out:
//      the customer can still see what they almost lost.
//
//   3. !canReAdd, and no active reservation: someone else has it, or it
//      sold. Render grayed with "No longer available," no button.
//
// The distinction between 2 and 3 is computed client-side from the
// already-loaded basket payload — no extra round-trip, no DTO change.

"use client";

import type { ReservationDto } from "@/types/customer";
import { formatPrice } from "./_utils";

type Props = {
  expired:           ReservationDto[];
  /** Inventory ids this customer currently has an Active reservation on. */
  inActiveBasket:    Set<number>;
  busyId:            number | null;
  onReAdd:           (reservationId: number) => void;
};

export default function ExpiredReservations({
  expired,
  inActiveBasket,
  busyId,
  onReAdd,
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
          // Three-state classification — the only computed bit we need.
          // Three states in priority order:
          //   reAdded     — customer currently holds an Active reservation
          //                 on this inventory id (most likely from a just-
          //                 completed Try Again on this very row). Wins
          //                 over canReAdd because canReAdd is a snapshot
          //                 from fetch time and is now stale; without this
          //                 precedence the row would still offer a Try
          //                 Again button that the server would 409.
          //   reAddable   — canReAdd is true and the customer doesn't hold
          //                 it. Show TRY AGAIN.
          //   (else)      — neither. Someone else has it, or it sold.
          const reAdded   = inActiveBasket.has(r.inventoryId);
          const reAddable = !reAdded && r.canReAdd;

          return (
            <li
              key={r.reservationId}
              className="flex items-center gap-4 py-4"
              style={{
                borderBottom: "1px solid var(--linen)",
                opacity:      reAddable ? 1 : 0.55,
              }}
            >
              {/* Thumb */}
              <div
                className="shrink-0 overflow-hidden"
                style={{ width: 48, height: 48, borderRadius: "0.2rem", background: "var(--cream-dark)" }}
              >
                {r.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumbnailUrl} alt={r.itemName ?? ""} className="h-full w-full object-cover" />
                ) : null}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="ll-display text-sm font-normal" style={{ color: "var(--ink)" }}>
                  {r.itemName ?? "Linen Lady piece"}
                </p>
                <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
                  {reAddable
                    ? "Still available"
                    : reAdded
                    ? "Back in your basket"
                    : "No longer available"}
                </p>
              </div>

              {/* Price */}
              <span className="ll-display text-xs" style={{ color: "var(--ink-soft)" }}>
                {formatPrice(r.unitPriceCents)}
              </span>

              {/* Action — only shown when re-add is genuinely possible.
                  reAddable already excludes the case where the customer
                  already holds the item; the grayed states deliberately
                  have no button since the label explains why. */}
              {reAddable ? (
                <button
                  onClick={() => onReAdd(r.reservationId)}
                  disabled={busyId === r.reservationId}
                  className="ll-label text-[0.6rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                  style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Try Again
                </button>
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
