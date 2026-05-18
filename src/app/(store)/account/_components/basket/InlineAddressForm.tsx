// src/app/(store)/account/_components/basket/InlineAddressForm.tsx
//
// Inline address-creation form used by CheckoutPanel. Lives alongside the
// other basket subcomponents because the only consumer is CheckoutPanel
// and the styling is checkout-specific (denser than the /account address
// management form, fits inside the sticky right rail).
//
// Scope: NEW addresses only. Editing existing addresses still happens at
// /account → Addresses. That's a deliberate split — managing the address
// book is a settings concern; using/adding-at-checkout-time is a basket
// concern. Trying to do both inline would inflate the panel into a full
// management UI and turn the basket page into /account by stealth.
//
// On successful save the form fires onSaved with the new address. The
// parent (CheckoutPanel) is expected to refresh its address list, select
// the new one as the shipping address, and collapse the form.
//
// ── Field state lives in the context (changed) ───────────────────────
// The form's field values used to be local useState. They now live in
// CustomerSessionContext as `addressDraft`, because BasketTab — and with
// it CheckoutPanel and this form — remounts "every so often" when Clerk
// auth-refresh events invalidate the RSC cache. Local state was wiped on
// every such remount, forcing the customer to re-type a half-finished
// address. The context survives those remounts, so reading/writing the
// draft there keeps the customer's work intact.
//
// `submitting` and `error` stay local: they're transient request state,
// meaningless across a remount (a remount mid-request abandons the
// request anyway), so there's nothing to preserve.

"use client";

import { useState } from "react";
import type { CustomerAddressDto } from "@/types/customer";
import { useCustomerSession } from "@/context/CustomerSessionContext";

type Props = {
  /** True if the customer currently has zero saved addresses. Determines
      the default value of the "set as default" checkbox — the first
      address auto-defaults to true (so future checkouts pre-pick it);
      subsequent ones default to false (don't disrupt existing default). */
  isFirstAddress: boolean;

  /** Fires after the server confirms the new address. Parent collapses
      the form and switches the dropdown to the new address. */
  onSaved:   (newAddress: CustomerAddressDto) => void;

  /** Fires when the customer clicks Cancel. Parent collapses the form
      without saving anything. */
  onCancel:  () => void;
};

export default function InlineAddressForm({
  isFirstAddress,
  onSaved,
  onCancel,
}: Props) {
  // Field values come from the context draft so they survive remounts.
  // apiCall / refreshAddresses are the same as before.
  const { apiCall, refreshAddresses, addressDraft, setAddressDraft } =
    useCustomerSession();

  // Transient request state — stays local. A remount mid-request abandons
  // the request, so there's nothing here worth carrying across one.
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Update one draft field. Mirrors the old `setField` signature so the
  // input handlers below didn't have to change shape — the only
  // difference is the write target is the context draft, not local state.
  //
  // Note: the draft's `formOpen` flag is owned by CheckoutPanel's
  // open/close handlers; this form only ever touches the value fields,
  // so spreading `prev` preserves whatever `formOpen` currently is.
  const setField = <K extends keyof typeof addressDraft>(
    key: K,
    value: (typeof addressDraft)[K],
  ) => {
    setAddressDraft(prev => ({ ...prev, [key]: value }));
    if (error) setError(null); // clear stale errors on edit
  };

  // The "set as default" checkbox defaults differ by whether this is the
  // customer's first address. The draft starts out with isDefault:false
  // (EMPTY_ADDRESS_DRAFT), so for a first address we want the checkbox to
  // *read* as checked even though the draft hasn't been touched. We derive
  // the effective value rather than mutating the draft on mount — mutating
  // on mount would fight the remount-survival behavior (every remount
  // would re-apply the default and clobber a customer who unchecked it).
  //
  // For a first address the checkbox isn't even rendered (see below), and
  // we always send isDefault:true for it. For subsequent addresses the
  // draft value is authoritative.
  const effectiveIsDefault = isFirstAddress ? true : addressDraft.isDefault;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // Server validates required fields (street1/city/state/zip) and
      // returns the saved row with its new addressId. We mirror that
      // back to the parent so it can auto-select the new address for
      // checkout without an extra fetch race.
      const res = await apiCall("/customers/me/addresses", {
        method: "POST",
        body:   JSON.stringify({
          // Label: pre-fill "Home" for a first address if the customer
          // left it blank; otherwise fall back to "Address" so the
          // server never gets an empty string.
          label:
            addressDraft.label.trim() ||
            (isFirstAddress ? "Home" : "Address"),
          street1:   addressDraft.street1.trim(),
          street2:   addressDraft.street2.trim() || null,
          city:      addressDraft.city.trim(),
          state:     addressDraft.state.trim(),
          zip:       addressDraft.zip.trim(),
          country:   "US",
          isDefault: effectiveIsDefault,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Couldn't save the address (HTTP ${res.status}).`);
      }

      const saved = await res.json() as CustomerAddressDto;

      // Pull the latest list into the session context so other consumers
      // (eg. the /account address tab if it's open in another tab) see
      // the new row. Then hand control back to CheckoutPanel — which is
      // responsible for clearing the draft (the address now exists;
      // reopening the form means "add another", so it should start fresh).
      await refreshAddresses();
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the address.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit-on-enter for the last field (Zip). Convenient on mobile where
  // the keyboard's Go/Done key is the natural completion gesture. Other
  // fields advance focus to next input via tab; Zip is the natural end.
  const onZipKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="flex flex-col gap-2"
      style={{
        // Subtle elevation against the panel background so the form
        // reads as a distinct surface rather than blending into the
        // sticky rail.
        background:   "var(--cream)",
        padding:      "0.75rem",
        border:       "1px solid var(--linen)",
        borderRadius: "0.2rem",
      }}
    >
      <p className="ll-label text-[0.58rem] uppercase tracking-[0.15em]" style={{ color: "var(--ink-soft)" }}>
        {isFirstAddress ? "Add shipping address" : "New address"}
      </p>

      {/* Label — single line, optional-feeling. Placeholder nudges "Home"
          for first-time customers; the actual "Home" default is applied
          at submit time (see submit()) rather than seeded into the draft,
          so it doesn't fight remount-survival. */}
      <input
        type="text"
        placeholder={isFirstAddress ? "Label (e.g. Home)" : "Label (e.g. Home)"}
        value={addressDraft.label}
        onChange={(e) => setField("label", e.target.value)}
        disabled={submitting}
        className="ll-body w-full px-2 py-1.5 text-xs"
        style={{
          background:   "var(--surface)",
          border:       "1px solid var(--linen)",
          color:        "var(--ink)",
          borderRadius: "0.15rem",
        }}
      />

      {/* Street1 — required. Browser autofill will populate from saved
          shipping addresses; the autoComplete attribute is the trigger. */}
      <input
        type="text"
        placeholder="Street address"
        autoComplete="address-line1"
        value={addressDraft.street1}
        onChange={(e) => setField("street1", e.target.value)}
        disabled={submitting}
        className="ll-body w-full px-2 py-1.5 text-xs"
        style={{
          background:   "var(--surface)",
          border:       "1px solid var(--linen)",
          color:        "var(--ink)",
          borderRadius: "0.15rem",
        }}
      />

      {/* Street2 — optional. Apt/unit/etc. */}
      <input
        type="text"
        placeholder="Apt, suite, etc. (optional)"
        autoComplete="address-line2"
        value={addressDraft.street2}
        onChange={(e) => setField("street2", e.target.value)}
        disabled={submitting}
        className="ll-body w-full px-2 py-1.5 text-xs"
        style={{
          background:   "var(--surface)",
          border:       "1px solid var(--linen)",
          color:        "var(--ink)",
          borderRadius: "0.15rem",
        }}
      />

      {/* City + State + Zip on one row. Three-column grid; State is
          short so it gets less width. Mobile collapses to single-column
          via the responsive style — tight enough that wrapping looks fine. */}
      <div className="grid gap-2" style={{ gridTemplateColumns: "2fr 1fr 1.2fr" }}>
        <input
          type="text"
          placeholder="City"
          autoComplete="address-level2"
          value={addressDraft.city}
          onChange={(e) => setField("city", e.target.value)}
          disabled={submitting}
          className="ll-body w-full px-2 py-1.5 text-xs"
          style={{
            background:   "var(--surface)",
            border:       "1px solid var(--linen)",
            color:        "var(--ink)",
            borderRadius: "0.15rem",
          }}
        />
        <input
          type="text"
          placeholder="State"
          autoComplete="address-level1"
          maxLength={2}
          value={addressDraft.state}
          onChange={(e) => setField("state", e.target.value.toUpperCase())}
          disabled={submitting}
          className="ll-body w-full px-2 py-1.5 text-xs uppercase"
          style={{
            background:   "var(--surface)",
            border:       "1px solid var(--linen)",
            color:        "var(--ink)",
            borderRadius: "0.15rem",
          }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="ZIP"
          autoComplete="postal-code"
          value={addressDraft.zip}
          onChange={(e) => setField("zip", e.target.value)}
          onKeyDown={onZipKeyDown}
          disabled={submitting}
          className="ll-body w-full px-2 py-1.5 text-xs"
          style={{
            background:   "var(--surface)",
            border:       "1px solid var(--linen)",
            color:        "var(--ink)",
            borderRadius: "0.15rem",
          }}
        />
      </div>

      {/* "Set as default" — checkbox row. We hide this for the first
          address (it's redundant — the first address IS the default by
          necessity; nothing to compare against). For subsequent addresses
          it's a meaningful toggle, and its value lives in the draft so it
          survives remounts like every other field. */}
      {!isFirstAddress && (
        <label className="ll-body flex cursor-pointer items-center gap-2 text-[0.65rem]" style={{ color: "var(--ink-soft)" }}>
          <input
            type="checkbox"
            checked={addressDraft.isDefault}
            onChange={(e) => setField("isDefault", e.target.checked)}
            disabled={submitting}
          />
          <span>Make this my default shipping address</span>
        </label>
      )}

      {error && (
        <p role="alert" className="ll-body text-[0.65rem] italic" style={{ color: "#991b1b" }}>
          {error}
        </p>
      )}

      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="ll-label flex-1 py-2 text-[0.6rem] uppercase tracking-[0.12em] text-white disabled:opacity-60"
          style={{
            background:   "var(--rose-deep)",
            border:       "none",
            borderRadius: "0.15rem",
            cursor:       submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Saving…" : "Save Address"}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="ll-label py-2 px-3 text-[0.6rem] uppercase tracking-[0.12em]"
          style={{
            background:   "transparent",
            border:       "1px solid var(--linen)",
            color:        "var(--ink-soft)",
            borderRadius: "0.15rem",
            cursor:       "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
