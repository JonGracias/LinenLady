// src/app/(store)/account/_components/basket/CheckoutPanel.tsx
//
// The sticky right rail of the basket tab — summary of selected items,
// total, ship-to picker, and the CHECK OUT button. Parent owns all the
// state (which items are checked, the address id, the submitting flag,
// the error message); this component just renders them and fires the
// callbacks it's given.
//
// Hidden entirely when there are no active reservations — handled by the
// parent (the panel is only mounted when active.length > 0).

"use client";

import type { ReservationDto, CustomerAddressDto } from "@/types/customer";
import { formatPrice } from "./_utils";

type Props = {
  checkedItems: ReservationDto[];
  totalCents:   number;
  addresses:    CustomerAddressDto[];
  addressId:    number | null;
  onAddressChange: (addressId: number) => void;
  onAddressTab:    () => void;            // jump to addresses tab when none exist
  submitting:   boolean;
  globalError:  string | null;
  onCheckout:   () => void;
};

export default function CheckoutPanel({
  checkedItems,
  totalCents,
  addresses,
  addressId,
  onAddressChange,
  onAddressTab,
  submitting,
  globalError,
  onCheckout,
}: Props) {
  return (
    <div
      className="sticky top-6 p-6"
      style={{
        background:   "var(--cream-dark)",
        borderRadius: "0.25rem",
        outline:      "1px solid var(--linen)",
      }}
    >
      <p className="ll-label mb-4 text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
        Summary
      </p>

      {/* Selected items */}
      <div className="mb-5 flex flex-col gap-2">
        {checkedItems.length === 0 ? (
          <p className="ll-body text-xs italic" style={{ color: "var(--ink-soft)" }}>
            No pieces selected yet.
          </p>
        ) : checkedItems.map(r => (
          <div key={r.reservationId} className="flex items-baseline justify-between gap-4">
            <span className="ll-body truncate text-xs font-light" style={{ color: "var(--ink-soft)" }}>
              {r.itemName}
            </span>
            <span className="ll-label shrink-0 text-[0.62rem]" style={{ color: "var(--ink)" }}>
              {formatPrice(r.unitPriceCents)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mb-5 flex items-baseline justify-between pt-4" style={{ borderTop: "1px solid var(--linen)" }}>
        <span className="ll-label text-[0.62rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
          Total
        </span>
        <span className="ll-display text-lg" style={{ color: "var(--rose-deep)" }}>
          {formatPrice(totalCents)}
        </span>
      </div>

      {/* Address picker — falls back to a "set one" prompt when empty */}
      <div className="mb-5">
        <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
          Ship to
        </label>
        {addresses.length === 0 ? (
          <button
            onClick={onAddressTab}
            className="ll-body w-full p-3 text-left text-xs italic"
            style={{
              background:  "var(--cream)",
              border:      "1px dashed var(--linen)",
              color:       "var(--rose-deep)",
              cursor:      "pointer",
            }}
          >
            + Add a shipping address
          </button>
        ) : (
          <select
            value={addressId ?? ""}
            onChange={(e) => onAddressChange(Number(e.target.value))}
            disabled={submitting}
            className="ll-body w-full p-2 text-xs"
            style={{ background: "var(--cream)", border: "1px solid var(--linen)", color: "var(--ink)" }}
          >
            {addresses.map(a => (
              <option key={a.addressId} value={a.addressId}>
                {a.label} — {a.street1}, {a.city} {a.state}
              </option>
            ))}
          </select>
        )}
      </div>

      {globalError && (
        <p role="alert" className="ll-body mb-3 text-xs" style={{ color: "#991b1b" }}>
          {globalError}
        </p>
      )}

      <button
        onClick={onCheckout}
        disabled={submitting || checkedItems.length === 0 || addresses.length === 0}
        className="btn-primary block w-full py-4 text-center text-[0.65rem] tracking-[0.15em] disabled:opacity-50"
        style={{ border: "none", cursor: submitting ? "wait" : "pointer" }}
      >
        {submitting
          ? "Sending to Square…"
          : checkedItems.length === 0
          ? "Select pieces to check out"
          : checkedItems.length === 1
          ? `Check Out — ${formatPrice(totalCents)} →`
          : `Check Out ${checkedItems.length} Pieces — ${formatPrice(totalCents)} →`}
      </button>

      <p className="ll-body mt-3 text-[0.65rem] italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        You&apos;ll be sent to Square to complete payment. Items remain
        held until checkout completes; if you abandon the form, they&apos;ll
        return to your basket within a day.
      </p>
    </div>
  );
}