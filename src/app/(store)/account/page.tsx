"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser, useAuth, SignOutButton } from "@clerk/nextjs";
import type { ReservationDto, CustomerAddressDto, CustomerPreferenceDto, MessageDto } from "@/types/customer";
import { CATEGORY_OPTIONS } from "@/types/inventory";
import BasketTab from "./_components/BasketTab";
import OrdersTab from "./_components/OrdersTab";
import type { OrderDto } from "@/types/customer";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/* ─────────────────────────────────────────────────────────────
   Tab types
   ─────────────────────────────────────────────────────────────
   "messages" was renamed to "contact" alongside the new /contact
   page. The tab still shows the existing in-app message thread
   (cust.Message rows) — we just relabeled it so all customer→Noemi
   surfaces use a consistent verb. Old links / bookmarks pointing
   to ?tab=messages are aliased below in the URL parser.
───────────────────────────────────────────────────────────── */

type Tab = "basket" | "orders" | "address" | "preferences" | "contact";

/* ─────────────────────────────────────────────────────────────
   Account page
───────────────────────────────────────────────────────────── */

export default function AccountPage() {
  return (
    <React.Suspense fallback={null}>
      <AccountPageInner />
    </React.Suspense>
  );
}

function AccountPageInner() {
  const { user, isLoaded } = useUser();
  const { getToken }       = useAuth();
  const searchParams       = useSearchParams();

  // Seed tab from `?tab=` so deep-links from elsewhere land on the right pane.
  // Validated against the Tab union — anything else falls back to basket.
  // Aliases: ?tab=reservations → basket (legacy basket link),
  //          ?tab=messages     → contact (legacy messages link).
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams?.get("tab");
    if (t === "reservations" || t === "basket")          return "basket";
    if (t === "messages"     || t === "contact")         return "contact";
    if (t === "orders" || t === "address" || t === "preferences") return t;
    return "basket";
  });

  const placedOrderId = useMemo(() => {
    const r = searchParams?.get("placed");
    if (!r) return null;
    const n = Number.parseInt(r, 10);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [loading, setLoading]   = useState(true);

  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [orders, setOrders]             = useState<OrderDto[]>([]);
  const [addresses, setAddresses]       = useState<CustomerAddressDto[]>([]);
  const [preferences, setPreferences]   = useState<string[]>([]);
  const [messages, setMessages]         = useState<MessageDto[]>([]);
  const [msgDraft, setMsgDraft]         = useState("");
  const [msgSending, setMsgSending]     = useState(false);

  const [addrForm, setAddrForm] = useState<Partial<CustomerAddressDto> | null>(null);

  const apiCall = useCallback(async (path: string, opts?: RequestInit) => {
    const token = await getToken();
    const clerkId = user?.id ?? "";
    return fetch(`/api${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Clerk-User-Id": clerkId,
        ...(opts?.headers ?? {}),
      },
    });
  }, [getToken, user?.id]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const load = async () => {
      await apiCall("/customers/sync", {
        method: "POST",
        body: JSON.stringify({
          clerkUserId:     user.id,
          email:           user.primaryEmailAddress?.emailAddress ?? "",
          firstName:       user.firstName ?? "",
          lastName:        user.lastName  ?? "",
          isEmailVerified: user.primaryEmailAddress?.verification?.status === "verified",
        }),
      });

      const profileRes = await apiCall("/customers/me");
      if (profileRes.ok) {
        const data = await profileRes.json();
        setAddresses(data.addresses ?? []);
        setPreferences((data.preferences ?? []).map((p: any) => p.Category));
      }

      const basketRes = await apiCall("/customers/me/basket");
      if (basketRes.ok) setReservations(await basketRes.json());

      const ordersRes = await apiCall("/customers/me/orders");
      if (ordersRes.ok) setOrders(await ordersRes.json());

      const msgRes = await apiCall("/customers/me/messages");
      if (msgRes.ok) setMessages(await msgRes.json());

      setLoading(false);
    };

    load();
  }, [isLoaded, user]);

  const sendMessage = async () => {
    if (!msgDraft.trim()) return;
    setMsgSending(true);
    const res = await apiCall("/customers/me/messages", {
      method: "POST",
      body: JSON.stringify({ body: msgDraft }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((m) => [...m, msg]);
      setMsgDraft("");
    }
    setMsgSending(false);
  };

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
      const saved = await res.json();
      setAddresses((a) =>
        addrForm.addressId
          ? a.map((x) => x.addressId === saved.AddressId ? saved : x)
          : [...a, saved]
      );
      setAddrForm(null);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Remove this address?")) return;
    await apiCall(`/customers/me/addresses/${id}`, { method: "DELETE" });
    setAddresses((a) => a.filter((x) => x.addressId !== id));
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

      {/* Header */}
      <div className="relative z-[1] border-b px-16 py-12" style={{ borderColor: "var(--linen)", background: "linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)" }}>
        <div className="ll-label mb-2 text-[0.62rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--sage-deep)" }}>My Account</div>
        <h1 className="ll-display font-normal" style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "var(--ink)" }}>
          Welcome back,{" "}
          <em className="italic" style={{ color: "var(--rose-deep)" }}>{user?.firstName ?? "friend"}</em>
        </h1>
        <p className="ll-body mt-2 text-sm font-light" style={{ color: "var(--ink-soft)" }}>{user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      {/* Tab bar */}
      <div className="relative z-[1] flex border-b" style={{ borderColor: "var(--linen)", background: "var(--cream)" }}>
        {([
          { id: "basket",      label: "Basket"      },
          { id: "orders",      label: "Orders"      },
          { id: "address",     label: "Addresses"   },
          { id: "preferences", label: "Preferences" },
          { id: "contact",     label: "Contact"     },   // was "messages" / "Messages"
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="ll-label border-b-2 px-8 py-4 text-[0.68rem] font-medium uppercase tracking-[0.15em] transition-colors"
            style={{
              borderColor: tab === id ? "var(--rose-deep)" : "transparent",
              color: tab === id ? "var(--rose-deep)" : "var(--ink-soft)",
              background: "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-[1] px-16 py-12">

        {/* ── Basket ── */}
        {tab === "basket" && (
          <BasketTab
            reservations={reservations}
            addresses={addresses}
            apiCall={apiCall}
            onChange={setReservations}
            onAddressTab={() => setTab("address")}
          />
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <OrdersTab
            orders={orders}
            highlight={placedOrderId}
          />
        )}

        {/* ── Addresses ── */}
        {tab === "address" && (
          <div className="max-w-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
                Saved <em className="italic" style={{ color: "var(--rose-deep)" }}>Addresses</em>
              </h2>
              <button onClick={() => setAddrForm({})}
                className="ll-label border px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] transition-colors hover:bg-[#c8daca]"
                style={{ borderColor: "var(--sage)", color: "var(--sage-deep)" }}>
                + Add Address
              </button>
            </div>

            {addresses.length === 0 && !addrForm && (
              <p className="ll-body italic text-base" style={{ color: "var(--brown-light)" }}>No addresses saved yet.</p>
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
                    <button onClick={() => setAddrForm(a)} className="ll-label text-[0.6rem] uppercase tracking-[0.12em] underline" style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
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
                    { key: "Label",   label: "Label",    full: false },
                    { key: "Street1", label: "Street",   full: true  },
                    { key: "Street2", label: "Apt/Suite",full: true  },
                    { key: "City",    label: "City",     full: false },
                    { key: "State",   label: "State",    full: false },
                    { key: "Zip",     label: "ZIP",      full: false },
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
                        onChange={(e) => setAddrForm((f) => ({ ...f, IsDefault: e.target.checked }))} />
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
              Choose the categories you'd like to be notified about when new pieces arrive.
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

        {/* ── Contact (was Messages) ──
            This tab still shows the in-app message thread (cust.Message rows).
            We just relabeled it. New inquiries — especially from anonymous
            visitors — go through /contact, which uses the public Resend-backed
            endpoint. The link below routes signed-in users there too if they'd
            rather start a fresh thread that gets logged on the contact-form
            audit trail. */}
        {tab === "contact" && (
          <div className="max-w-2xl">
            <h2 className="ll-display mb-2 text-xl font-normal" style={{ color: "var(--ink)" }}>
              Your Conversation with <em className="italic" style={{ color: "var(--rose-deep)" }}>Noemi</em>
            </h2>
            <p className="ll-body mb-8 text-sm font-light" style={{ color: "var(--ink-soft)" }}>
              Have a new question?{" "}
              <Link href="/contact" style={{ color: "var(--rose-deep)", textDecoration: "underline" }}>
                Visit the contact page
              </Link>
              {" "}— it&apos;ll send Noemi a fresh email she can reply to directly.
            </p>

            {/* Thread */}
            <div className="mb-6 flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <p className="ll-body italic text-base" style={{ color: "var(--brown-light)" }}>No messages yet.</p>
              )}
              {messages.map((m) => {
                const isOutbound = m.direction === "Outbound";
                return (
                  <div key={m.messageId} className={`flex ${isOutbound ? "justify-start" : "justify-end"}`}>
                    <div className="max-w-[75%] px-4 py-3"
                      style={{
                        background: isOutbound ? "var(--cream-dark)" : "var(--rose-deep)",
                        color: isOutbound ? "var(--ink)" : "#fff",
                        border: isOutbound ? "1px solid var(--linen)" : "none",
                      }}>
                      <p className="ll-body text-sm font-light leading-relaxed">{m.body}</p>
                      <div className={`ll-label mt-1 text-[0.55rem] uppercase tracking-[0.1em] ${isOutbound ? "" : "text-right"}`}
                        style={{ color: isOutbound ? "var(--ink-soft)" : "rgba(255,255,255,0.65)" }}>
                        {isOutbound ? "Noemi" : "You"} · {new Date(m.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose — kept for replying within an existing thread */}
            <div className="flex gap-3 border-t pt-4" style={{ borderColor: "var(--linen)" }}>
              <textarea
                value={msgDraft}
                onChange={(e) => setMsgDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                rows={3}
                placeholder="Reply to Noemi…"
                className="ll-body flex-1 resize-none border p-3 text-sm font-light outline-none placeholder:italic"
                style={{ borderColor: "var(--linen)", background: "var(--cream-dark)", color: "var(--ink)" }}
              />
              <button onClick={sendMessage} disabled={msgSending || !msgDraft.trim()}
                className="ll-label self-end px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-white transition-all disabled:opacity-40"
                style={{ background: "var(--rose-deep)", border: "none", cursor: "pointer" }}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-[1] px-16 pb-8 pt-12" style={{ background: "var(--ink)", color: "var(--cream-dark)" }}>
        <div className="ll-label flex flex-wrap items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span>© 2025 Noemi · The Linen Lady · Washington D.C.</span>
          <span>Handpicked since 1994</span>
        </div>
      </footer>
    </div>
  );
}