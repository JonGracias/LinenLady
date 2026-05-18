// src/app/(store)/account/_components/basket/CheckoutPanel.tsx
//
// The sticky right rail of the basket tab — summary of selected items,
// total, ship-to picker, and the CHECK OUT button. Parent owns checkout
// state (selected items, current address id, submitting flag, error);
// this component renders them.
//
// ── Address-form state lives in the context (changed) ────────────────
// This component used to own `formOpen` in local useState, and
// InlineAddressForm owned its field values the same way. Both are now in
// CustomerSessionContext as `addressDraft` — because BasketTab (and with
// it this panel and the form) remounts "every so often" when Clerk
// auth-refresh events invalidate the RSC cache. Local state was wiped on
// every such remount, forcing the customer to re-type a half-finished
// address. The context survives those remounts.
//
// `formOpen` is read from `addressDraft.formOpen`; opening/closing the
// form writes that flag. The value fields are InlineAddressForm's concern.
// The draft is cleared on two intentional actions: a successful save and
// Cancel. It is NOT cleared on remount — that's the whole point.
//
// State machine for the address row (unchanged behavior):
//
//   addresses=0, form closed  →  big "+ Add a shipping address" button
//                                that opens the form when clicked
//   addresses=0, form open    →  inline form, no dropdown
//   addresses≥1, form closed  →  dropdown + small "+ Add a new address" link
//   addresses≥1, form open    →  inline form replaces dropdown; cancel
//                                returns to dropdown with the previous
//                                selection intact
//
// Editing existing addresses still happens at /account → Addresses. The
// inline form is creation-only; we expose a small "Manage addresses →"
// link at the bottom of the dropdown for that case. See the discussion
// in InlineAddressForm.tsx for the design rationale.

"use client";

import Link from "next/link";
import type { ReservationDto, CustomerAddressDto } from "@/types/customer";
import { useCustomerSession } from "@/context/CustomerSessionContext";
import { formatPrice } from "./_utils";
import InlineAddressForm from "./InlineAddressForm";

type Props = {
  checkedItems: ReservationDto[];
  totalCents:   number;
  addresses:    CustomerAddressDto[];
  addressId:    number | null;
  onAddressChange: (addressId: number) => void;
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
  submitting,
  globalError,
  onCheckout,
}: Props) {
  // Whether the inline address form is currently expanded — now read from
  // the context draft so it survives remounts. setAddressDraft toggles the
  // flag; clearAddressDraft resets the whole draft (flag + all fields).
  const { addressDraft, setAddressDraft, clearAddressDraft,
          notesDraft, setNotesDraft } =
    useCustomerSession();
  const formOpen = addressDraft.formOpen;
  const notes    = notesDraft.notes;

  const NOTES_MAX = 1000;

  // Open/close helpers. Opening only flips the flag — it leaves any
  // existing draft fields intact, which is what makes a reopen after an
  // accidental close show the customer's work again. Closing-via-cancel
  // clears the whole draft (an explicit discard).
  const openForm = () => setAddressDraft(prev => ({ ...prev, formOpen: true }));
  const cancelForm = () => clearAddressDraft();

  // First-time customers see the form auto-prompted via the big button.
  // Returning customers with existing addresses see the dropdown by
  // default and have to click "Add new" to expand the form. Both paths
  // funnel into the same component below.
  const isFirstAddress = addresses.length === 0;

  // After successful save: select the new address for checkout, then
  // clear the draft (which also collapses the form). The address now
  // exists; if the customer reopens the form it should start fresh —
  // "add another", not "resume the one I just saved". The session context
  // already refreshed `addresses` from the server before calling onSaved,
  // so the parent will see the new row in its addresses prop on the next
  // render and the dropdown will show it.
  const handleSaved = (newAddress: CustomerAddressDto) => {
    onAddressChange(newAddress.addressId);
    clearAddressDraft();
  };

  return (
    <div
      className="sticky top-6 p-6"
      style={{
        background:   "var(--cream-dark)",
        borderRadius: "0.25rem",
        outline:      "1px solid var(--linen)",
        // Establish a stacking context. Note: the real fix for the form
        // rendering "under the footer" was the parent grid track —
        // BasketTab's md:grid-rows-[1fr_auto] (was 1fr_360px, which
        // pinned this row's height and let the form overflow it). This
        // zIndex is kept as defence-in-depth.
        position:     "relative",
        zIndex:       10,
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

      {/* Note for Noemi — optional free-text. Survives BasketTab remounts
          via notesDraft in CustomerSessionContext (same rationale as
          addressDraft — see context file header). Trimmed and converted
          to null at the network boundary in BasketTab.checkout.

          Disabled while the address form is open: same UX rule as the
          Check Out button — no input ambiguity while a sub-form has focus. */}
      <div className="mb-5">
        <label
          htmlFor="checkout-notes"
          className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-soft)" }}
        >
          Note for Noemi (optional)
        </label>
        <textarea
          id="checkout-notes"
          value={notes}
          onChange={(e) =>
            setNotesDraft(prev => ({
              ...prev,
              notes: e.target.value.slice(0, NOTES_MAX),
            }))
          }
          disabled={submitting || formOpen}
          rows={3}
          maxLength={NOTES_MAX}
          placeholder="Any special instructions?"
          className="ll-body w-full p-2 text-xs"
          style={{
            background:   "var(--cream)",
            border:       "1px solid var(--linen)",
            color:        "var(--ink)",
            borderRadius: "0.15rem",
            resize:       "vertical",
            minHeight:    "4.5rem",
            fontFamily:   "inherit",
          }}
        />
        <div
          className="ll-label mt-1 text-right text-[0.55rem]"
          style={{ color: "var(--ink-soft)" }}
        >
          {notes.length} / {NOTES_MAX}
        </div>
      </div>

      {/* Address row — four-state machine. See file header for the table. */}
      <div className="mb-5">
        <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
          Ship to
        </label>

        {formOpen ? (
          // Form is open: render the form (it replaces whatever was here).
          // isFirstAddress drives the form's default-checkbox behavior and
          // its heading text. The form reads/writes its field values
          // through the context draft, so a remount while it's open
          // preserves both the open state and the typed values.
          <InlineAddressForm
            isFirstAddress={isFirstAddress}
            onSaved={handleSaved}
            onCancel={cancelForm}
          />
        ) : isFirstAddress ? (
          // No addresses, form closed: big "+ Add a shipping address"
          // button. Opens the form on click.
          <button
            onClick={openForm}
            className="ll-body w-full p-3 text-left text-xs italic"
            style={{
              background:   "var(--cream)",
              border:       "1px dashed var(--linen)",
              color:        "var(--rose-deep)",
              cursor:       "pointer",
              borderRadius: "0.15rem",
            }}
          >
            + Add a shipping address
          </button>
        ) : (
          // ≥1 addresses, form closed: dropdown + small "Add new" link
          // beneath it. Manage-addresses link routes to /account for
          // editing/deleting (deliberately not inline — see file header).
          <>
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

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                onClick={openForm}
                disabled={submitting}
                className="ll-label text-[0.58rem] uppercase tracking-[0.12em] underline"
                style={{
                  color:           "var(--rose-deep)",
                  background:      "transparent",
                  border:          "none",
                  cursor:          "pointer",
                  padding:         0,
                  textAlign:       "left",
                }}
              >
                + Add a new address
              </button>
              <Link
                href="/account?tab=address"
                className="ll-label text-[0.58rem] uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-soft)", textDecoration: "underline" }}
              >
                Manage →
              </Link>
            </div>
          </>
        )}
      </div>

      {globalError && (
        <p role="alert" className="ll-body mb-3 text-xs" style={{ color: "#991b1b" }}>
          {globalError}
        </p>
      )}

      <button
        onClick={onCheckout}
        // Disable not just on submitting/empty but ALSO when the address
        // form is open — submitting checkout with an in-progress address
        // edit would be confusing UX (which address would it use, the
        // currently-selected one or the one being entered?). Forcing the
        // customer to commit the form first removes the ambiguity.
        disabled={
          submitting
          || checkedItems.length === 0
          || addresses.length === 0
          || formOpen
        }
        className="btn-primary block w-full py-4 text-center text-[0.65rem] tracking-[0.15em] disabled:opacity-50"
        style={{ border: "none", cursor: submitting ? "wait" : "pointer" }}
      >
        {submitting
          ? "Sending to Square…"
          : checkedItems.length === 0
          ? "Select pieces to check out"
          : formOpen
          ? "Finish saving address first"
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
