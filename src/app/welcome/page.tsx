"use client";

/* ─────────────────────────────────────────────────────────────
   /welcome — Pre-launch account page
   ─────────────────────────────────────────────────────────────
   A deliberately sealed clone of /account used ONLY before launch.
   What's different from /account:
     - Lives OUTSIDE the (store) route group, so it gets no storefront
       Header/Footer (no nav into the sealed shop).
     - No "Basket & Orders" links.
     - A welcome banner explaining they're on the early-access list.
     - Address capture + arrival-alert preferences kept verbatim — these
       are the whole point: let early customers optionally tell us where
       to ship and what they like, before July 4.

   After launch the proxy stops gating, /account becomes reachable, and
   this page can simply be deleted (or left as a harmless alias).
───────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { CATEGORY_OPTIONS } from "@/types/inventory";
import { useCustomerSession } from "@/context/CustomerSessionContext";

type Tab = "address" | "preferences";

export default function WelcomePage() {
  return (
    <React.Suspense fallback={null}>
      <WelcomeInner />
    </React.Suspense>
  );
}

function WelcomeInner() {
  const { user, isLoaded } = useUser();
  const { addresses, apiCall, refreshAddresses } = useCustomerSession();

  const [tab,         setTab]         = useState<Tab>("address");
  const [loading,     setLoading]     = useState(true);
  const [preferences, setPreferences] = useState<string[]>([]);

  const [addrForm, setAddrForm] = useState<Partial<{
    addressId: number;
    label:     string;
    street1:   string;
    street2:   string;
    city:      string;
    state:     string;
    zip:       string;
    isDefault: boolean;
  }> | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const load = async () => {
      const profileRes = await apiCall("/customers/me");
      if (profileRes.ok) {
        const data = await profileRes.json();
        setPreferences((data.preferences ?? []).map((p: any) => p.Category ?? p.category));
      }
      setLoading(false);
    };
    load();
  }, [isLoaded, user, apiCall]);

  const savePreferences = async (cats: string[]) => {
    setPreferences(cats);
    await apiCall("/customers/me/preferences", {
      method: "PUT",
      body: JSON.stringify({ categories: cats }),
    });
  };

  const saveAddress = async () => {
    if (!addrForm) return;
    const res = await apiCall(
      addrForm.addressId ? `/customers/me/addresses/${addrForm.addressId}` : "/customers/me/addresses",
      { method: addrForm.addressId ? "PUT" : "POST", body: JSON.stringify(addrForm) }
    );
    if (res.ok) {
      await refreshAddresses();
      setAddrForm(null);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Remove this address?")) return;
    await apiCall(`/customers/me/addresses/${id}`, { method: "DELETE" });
    await refreshAddresses();
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="ll-label text-[0.72rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="ll-texture-overlay min-h-screen" style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}>
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      {/* Header — no nav, just identity + sign out */}
      <div className="relative z-[1] border-b px-8 py-12 sm:px-16" style={{ borderColor: "var(--linen)", background: "linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)" }}>
        <div className="ll-label mb-2 text-[0.62rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--sage-deep)" }}>
          The Linen Lady · Est. 1994
        </div>
        <h1 className="ll-display font-normal" style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}>
          You&apos;re on the list,{" "}
          <em className="italic" style={{ color: "var(--rose-deep)" }}>{user?.firstName ?? "friend"}</em>
        </h1>
        <p className="ll-body mt-3 max-w-xl text-sm font-light leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          We open <strong style={{ color: "var(--rose-deep)" }}>July 4</strong>. We&apos;ll email you the moment the doors
          open. While you wait, you can optionally save a shipping address and tell us which
          pieces you&apos;d like to hear about first — entirely up to you.
        </p>
        <div className="mt-5">
          <SignOutButton redirectUrl="/coming-soon/index.html">
            <button
              className="ll-label text-[0.62rem] uppercase tracking-[0.15em] underline"
              style={{ color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer" }}
            >
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Tab bar — address + preferences only; no basket/store links */}
      <div className="relative z-[1] flex items-center border-b" style={{ borderColor: "var(--linen)", background: "var(--cream)" }}>
        {([
          { id: "address",     label: "Shipping Address" },
          { id: "preferences", label: "Arrival Alerts"   },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="ll-label border-b-2 px-6 py-4 text-[0.68rem] font-medium uppercase tracking-[0.15em] transition-colors sm:px-8"
            style={{
              borderColor: tab === id ? "var(--rose-deep)" : "transparent",
              color:       tab === id ? "var(--rose-deep)" : "var(--ink-soft)",
              background: "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-[1] px-8 py-12 sm:px-16">

        {/* ── Addresses ── */}
        {tab === "address" && (
          <div className="max-w-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
                Shipping <em className="italic" style={{ color: "var(--rose-deep)" }}>Address</em>
                <span className="ll-label ml-3 text-[0.55rem] uppercase tracking-[0.12em]" style={{ color: "var(--brown-light)" }}>Optional</span>
              </h2>
              <button onClick={() => setAddrForm({})}
                className="ll-label border px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors hover:bg-[#c8daca]"
                style={{ borderColor: "var(--sage)", color: "var(--sage-deep)" }}>
                + Add Address
              </button>
            </div>

            {addresses.length === 0 && !addrForm && (
              <p className="ll-body italic text-base" style={{ color: "var(--brown-light)" }}>
                No address saved yet — add one now to make checkout faster on launch day, or skip it entirely.
              </p>
            )}

            <div className="flex flex-col gap-4">
              {addresses.map((a) => (
                <div key={a.addressId} className="border p-5" style={{ borderColor: "var(--linen)", background: "var(--cream-dark)" }}>
                  <div className="mb-1 flex items-center gap-3">
                    <span className="ll-label text-[0.6rem] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--sage-deep)" }}>{a.label}</span>
                    {a.isDefault && <span className="ll-label text-[0.55rem] px-2 py-0.5 uppercase tracking-[0.1em] text-white" style={{ background: "var(--rose-deep)" }}>Default</span>}
                  </div>
                  <address className="ll-body not-italic text-sm font-light leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {a.street1}{a.street2 && `, ${a.street2}`}<br />{a.city}, {a.state} {a.zip}
                  </address>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => setAddrForm({
                      addressId: a.addressId,
                      label:     a.label,
                      street1:   a.street1,
                      street2:   a.street2 ?? "",
                      city:      a.city,
                      state:     a.state,
                      zip:       a.zip,
                      isDefault: a.isDefault,
                    })} className="ll-label text-[0.6rem] uppercase tracking-[0.12em] underline" style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteAddress(a.addressId)} className="ll-label text-[0.6rem] uppercase tracking-[0.12em] underline" style={{ color: "var(--rose-deep)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {addrForm !== null && (
              <div className="mt-6 border p-6" style={{ borderColor: "var(--linen)", background: "var(--cream-dark)" }}>
                <h3 className="ll-display mb-5 text-lg font-normal italic" style={{ color: "var(--ink)" }}>
                  {addrForm.addressId ? "Edit Address" : "New Address"}
                </h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {[
                    { key: "label",   label: "Label",     full: false },
                    { key: "street1", label: "Street",    full: true  },
                    { key: "street2", label: "Apt/Suite", full: true  },
                    { key: "city",    label: "City",      full: false },
                    { key: "state",   label: "State",     full: false },
                    { key: "zip",     label: "ZIP",       full: false },
                  ].map(({ key, label, full }) => (
                    <div key={key} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
                      <label className="ll-label mb-1 block text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>{label}</label>
                      <input
                        value={(addrForm as any)[key] ?? ""}
                        onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="ll-body w-full border px-3 py-2.5 text-sm font-light outline-none"
                        style={{ borderColor: "var(--linen)", background: "var(--cream)", color: "var(--ink)" }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!addrForm.isDefault}
                        onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                      <span className="ll-label text-[0.62rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>Set as default address</span>
                    </label>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={saveAddress} className="ll-label px-8 py-3 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-white" style={{ background: "var(--rose-deep)", border: "none", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setAddrForm(null)} className="ll-label border px-8 py-3 text-[0.65rem] font-medium uppercase tracking-[0.15em]" style={{ borderColor: "var(--linen)", color: "var(--ink-soft)", background: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Preferences ── */}
        {tab === "preferences" && (
          <div className="max-w-lg">
            <h2 className="ll-display mb-3 text-xl font-normal" style={{ color: "var(--ink)" }}>
              New Arrival <em className="italic" style={{ color: "var(--rose-deep)" }}>Alerts</em>
            </h2>
            <p className="ll-body mb-8 text-base font-light leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Choose the categories you&apos;d like to be notified about when we open and as new pieces arrive.
            </p>
            <div className="flex flex-col gap-3">
              {CATEGORY_OPTIONS.map(({ value, label }) => {
                const checked = preferences.includes(value);
                return (
                  <label key={value} className="flex cursor-pointer items-center justify-between border p-4 transition-colors"
                    style={{ borderColor: checked ? "var(--rose-deep)" : "var(--linen)", background: checked ? "#fdf5f5" : "var(--cream-dark)" }}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          const next = checked
                            ? preferences.filter((c) => c !== value)
                            : [...preferences, value];
                          savePreferences(next);
                        }}
                      />
                      <span className="ll-display text-base font-normal italic" style={{ color: "var(--ink)" }}>{label}</span>
                    </div>
                    {checked && <span className="ll-label text-[0.55rem] px-2 py-0.5 uppercase tracking-[0.1em] text-white" style={{ background: "var(--rose-deep)" }}>Notify me</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-[1] px-8 pb-8 pt-12 sm:px-16" style={{ background: "var(--ink)", color: "var(--cream-dark)" }}>
        <div className="ll-label flex flex-wrap items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span>© 2026 Noemi · The Linen Lady · Washington D.C.</span>
          <span>Opening July 4</span>
        </div>
      </footer>
    </div>
  );
}
