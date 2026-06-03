// src/app/(store)/account/_components/basket/ActiveReservations.tsx
//
// The "in your basket" view — items currently held with checkboxes, time
// remaining, and remove buttons. Pure presentation: all state, network,
// and provider sync stays in BasketTab. The component just renders the
// rows and fires the callbacks it's given.
//
// Recently-expired items live in ExpiredReservations.tsx — the parent
// switches between the two via a tab control. Earlier versions of this
// file rendered both lists stacked; that grew confusing once expired
// rows took on multiple states (still available / back in basket /
// unavailable), so the views were split.
//
// Does not include the Ask Noemi button — that affordance was removed
// for the basket-migration launch (B2 in the plan); the AskNoemi backend
// remains in place for a future re-introduction.

"use client";

import Link from "next/link";
import type { ReservationDto } from "@/types/customer";
import { formatPrice, timeLeft } from "@/lib/utils";


type Props = {
  active:        ReservationDto[];
  checked:       Record<number, boolean>;
  busyId:        number | null;
  submitting:    boolean;
  onCheckChange: (reservationId: number, checked: boolean) => void;
  onRemove:      (reservationId: number) => void;
  getThumbnailUrl: (inventoryId: number) => string | null;
};

export default function ActiveReservations({
  active,
  checked,
  busyId,
  submitting,
  onCheckChange,
  onRemove,
  getThumbnailUrl,
}: Props) {
  return (
    <div>
      {/* ── Heading ──────────────────────────────────────────── */}
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
          In your <em className="italic" style={{ color: "var(--rose-deep)" }}>basket</em>
        </h2>
        <p className="ll-label text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
          {active.length} {active.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {/* ── Active list ──────────────────────────────────────── */}
      {active.length === 0 ? (
        <p className="ll-body py-8 text-sm italic" style={{ color: "var(--ink-soft)" }}>
          Nothing currently held — see the EXPIRED tab if you recently lost something.
        </p>
      ) : (
        <ul className="flex flex-col" style={{ borderTop: "1px solid var(--linen)" }}>
          {active.map(r => (
            <li
              key={r.reservationId}
              className="flex items-center gap-4 py-5"
              style={{ borderBottom: "1px solid var(--linen)" }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={checked[r.reservationId] ?? false}
                onChange={(e) => onCheckChange(r.reservationId, e.target.checked)}
                disabled={submitting}
                className="h-5 w-5 shrink-0 cursor-pointer accent-[color:var(--rose-deep)]"
                aria-label={`Include ${r.itemName ?? "item"} in checkout`}
              />

              {/* Thumb */}
              {(() => {
                const thumb = getThumbnailUrl(r.inventoryId) ?? r.thumbnailUrl;
                return thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={r.itemName ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center ll-display text-[0.5rem] italic"
                      style={{ color: "var(--ink-soft)" }}>LL</div>
                );
              })()}

              {/* Body */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${r.itemSku ?? ""}`}
                  className="ll-display text-sm font-normal leading-snug line-clamp-2 hover:opacity-60"
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  {r.itemName ?? "Linen Lady piece"}
                </Link>
                <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
                  {timeLeft(r.expiresAt)}
                </p>
              </div>

              {/* Price + actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="ll-display text-sm font-normal" style={{ color: "var(--rose-deep)" }}>
                  {formatPrice(r.unitPriceCents)}
                </span>
                <button
                  onClick={() => onRemove(r.reservationId)}
                  disabled={busyId === r.reservationId || submitting}
                  className="ll-label text-[0.55rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                  style={{ color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer" }}
                  aria-label={`Remove ${r.itemName ?? "item"}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}