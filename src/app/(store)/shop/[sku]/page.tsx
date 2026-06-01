// src/app/(store)/shop/[sku]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  AvailabilityState,
  InventoryItem,
  InventoryImage,
} from "@/types/inventory";
import { useStorefrontContext } from "@/context/StorefrontContext";
import { useCustomerSession } from "@/context/CustomerSessionContext";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/* ─── types ───────────────────────────────────────────────────────────────── */

type ItemDetail = InventoryItem & {
  images?: InventoryImage[];
};

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="flex items-center gap-2 px-6 md:px-10 py-4" aria-label="breadcrumb">
      <Link
        href="/"
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
        style={{ color: "var(--on-surface-variant)" }}
      >
        Home
      </Link>
      <span className="ll-label text-[0.58rem]" style={{ color: "var(--outline-variant)" }}>
        /
      </span>
      <Link
        href="/shop"
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
        style={{ color: "var(--on-surface-variant)" }}
      >
        Collection
      </Link>
      <span className="ll-label text-[0.58rem]" style={{ color: "var(--outline-variant)" }}>
        /
      </span>
      <span
        className="ll-label text-[0.58rem] uppercase tracking-[0.15em] truncate max-w-[160px]"
        style={{ color: "var(--on-surface)" }}
      >
        {name}
      </span>
    </nav>
  );
}

/* ─── Image Gallery (desktop) ─────────────────────────────────────────────── */

function DesktopGallery({ images }: { images: InventoryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="flex items-center justify-center ll-display text-2xl italic"
        style={{
          aspectRatio: "4/5",
          background: "var(--surface-container-highest)",
          borderRadius: "0.25rem",
          color: "var(--outline-variant)",
        }}
      >
        Linen Lady
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "4/5", borderRadius: "0.25rem", background: "var(--surface-container-highest)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]?.readUrl ?? ""}
          alt={`Detail view ${active + 1}`}
          className="h-full w-full object-cover transition-opacity duration-500"
        />
        {/* One of a Kind badge */}
        <div className="absolute left-0 top-5">
          <span
            className="ll-label px-3 py-1.5 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
            style={{
              background: "rgba(30,27,26,0.68)",
              backdropFilter: "blur(6px)",
              color: "rgba(253,250,246,0.9)",
            }}
          >
            One of a Kind
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.imageId}
              onClick={() => setActive(i)}
              className="shrink-0 overflow-hidden transition-all duration-300"
              style={{
                width: 72,
                height: 72,
                borderRadius: "0.2rem",
                outline: i === active
                  ? "2px solid var(--primary)"
                  : "1px solid rgba(196,181,168,0.25)",
                outlineOffset: i === active ? "2px" : "0",
                opacity: i === active ? 1 : 0.65,
              }}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.readUrl ?? ""}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile Carousel ─────────────────────────────────────────────────────── */

function MobileCarousel({ images }: { images: InventoryImage[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div
        className="w-full flex items-center justify-center ll-display text-2xl italic"
        style={{ aspectRatio: "4/3", background: "var(--surface-container-highest)", color: "var(--outline-variant)" }}
      >
        Linen Lady
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full" style={{ aspectRatio: "4/3" }}>
      {images.map((img, i) => (
        <div
          key={img.imageId}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.readUrl ?? ""} alt="" className="h-full w-full object-cover" />
        </div>
      ))}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === active ? "var(--on-primary)" : "rgba(253,250,246,0.45)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 400ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Care instructions ───────────────────────────────────────────────────── */

const CARE_STEPS = [
  {
    n: "01",
    title: "Laundering",
    body: "Avoid modern detergents and mechanical washing. Hand wash only in tepid distilled water with a neutral-pH linen soap. Do not wring.",
  },
  {
    n: "02",
    title: "Drying",
    body: "Lay flat on a clean white cotton sheet in a shaded area. Direct sunlight may cause uneven bleaching of the natural fibres.",
  },
  {
    n: "03",
    title: "Storage",
    body: "Roll — never fold — to avoid structural creases. Store in acid-free tissue paper within a breathable cedar chest or linen bag.",
  },
];

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function ItemDetailPage() {
  const { sku }  = useParams<{ sku: string }>();
  const {
    getThumbnailUrl,
    ensureThumbnail,
    getAvailabilityState,
    checkAvailability,
  } = useStorefrontContext();
  const { add, remove, has } = useCustomerSession();

  const [item,    setItem]    = useState<ItemDetail | null>(null);
  const [images,  setImages]  = useState<InventoryImage[]>([]);
  const [related, setRelated] = useState<ItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Availability state for *this* SKU. Independently tracked from the
  // storefront context because the page may have been deep-linked, in
  // which case the context's list doesn't include this item.
  //
  //   undefined → not checked yet (treat as loading)
  //   null      → checked, item is available
  //   string    → checked, item is in a blocked state
  const [availState, setAvailState] = useState<AvailabilityState | null | undefined>(undefined);

  // Basket toggle state — async add() can fail with a structured reason, so
  // we surface a hint inline rather than a generic toast.
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const inBasket = item ? has(item.inventoryId) : false;

  // Derived flags — recomputed cheaply from availState. The "yours" states
  // get distinct routing; the "locked by other" states block the action.
  const isLockedByOther =
    availState === "InBasket" || availState === "PendingPayment";
  const isYourBasket          = availState === "YourBasket";
  const isYourPendingPayment  = availState === "YourPendingPayment";
  const isYours               = isYourBasket || isYourPendingPayment;
  const isGone                = availState === "Sold" || availState === "Inactive";

  /* ── Fetch item by SKU, then check availability ── */
  const fetchItem = useCallback(async () => {
    if (!sku) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/sku/${sku}`);
      if (res.status === 404) { setError("not_found"); return; }
      if (!res.ok) throw new Error("fetch failed");
      const data: ItemDetail = await res.json();
      setItem(data);

      /* ── Availability check.
         Reuse the storefront-cached value if we have one (came in from
         the grid), otherwise fire a one-off check for just this id. */
      const cached = getAvailabilityState(data.inventoryId);
      if (cached !== null) {
        setAvailState(cached);
      } else {
        const entries = await checkAvailability([data.inventoryId]);
        const entry   = entries.find((e) => e.inventoryId === data.inventoryId);
        setAvailState(entry ? entry.state : null);
      }

      /* ── Fetch images ── */
      const imgRes = await fetch(`/api/items/${data.inventoryId}/images`);
      if (imgRes.ok) {
        const imgs: InventoryImage[] = await imgRes.json();
        setImages(imgs.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder));
      }

      /* ── Fetch related (similar) ── */
      const relRes = await fetch(`/api/items/${data.inventoryId}/similar?top=4`);
      if (relRes.ok) {
        const relData = await relRes.json();
        console.log("similar items sample:", relData[0]);
        const rel3 = relData.slice(0, 3) as ItemDetail[];
        setRelated(rel3);
        // Pre-fetch thumbnails for related items via the storefront context cache
        rel3.forEach((r) => ensureThumbnail(r.inventoryId));
      }
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  /* ── Basket toggle — shared between desktop CTA and mobile sticky bar.
       Pre-flight: re-check availability immediately before calling add().
       The customer may have been on this page for minutes before clicking,
       and the storefront cache could be stale. This narrows the race
       window from "page load → click" to "pre-flight → server insert"
       which is single-digit milliseconds. The server still wins ties via
       the unique index on the basket table — this is belt-and-suspenders. ── */
  const toggleBasket = useCallback(async () => {
    if (!item || busy) return;

    // State-based short-circuits, no network needed.
    if (isLockedByOther) {
      setHint(availState === "PendingPayment"
        ? "This piece is awaiting payment from another customer."
        : "Another customer is holding this piece right now.");
      return;
    }

    setBusy(true);
    setHint(null);
    try {
      if (inBasket) {
        await remove(item.inventoryId);
        // After removal we no longer have it — re-check to update the pill.
        const entries = await checkAvailability([item.inventoryId]);
        const entry   = entries.find((e) => e.inventoryId === item.inventoryId);
        setAvailState(entry ? entry.state : null);
        return;
      }

      // Pre-flight check — narrows the race window before the actual POST.
      const entries = await checkAvailability([item.inventoryId]);
      const entry   = entries.find((e) => e.inventoryId === item.inventoryId);
      if (entry) {
        setAvailState(entry.state);
        if (entry.state === "InBasket" || entry.state === "PendingPayment") {
          setHint(entry.state === "PendingPayment"
            ? "This piece was just claimed for payment. Please refresh to see other pieces."
            : "Another customer just added this piece to their basket.");
          return;
        }
        if (entry.state === "Sold" || entry.state === "Inactive") {
          setHint("This piece is no longer available.");
          return;
        }
        // YourBasket / YourPendingPayment — fall through to the add() call,
        // which will return already_in_basket and we'll handle it normally.
      }

      // Use the primary image if available, fall back to the first.
      const primary = images.find((i) => i.isPrimary) ?? images[0];
      const result = await add({
        inventoryId:    item.inventoryId,
        sku:            item.sku,
        name:           item.name,
        unitPriceCents: item.unitPriceCents,
        thumbnailUrl:   primary?.readUrl ?? null,
      });

      if (!result.ok) {
        if (result.reason === "needs_email_verify") {
          setHint("Please verify your email before adding pieces to your basket.");
        } else if (result.reason === "held_by_other") {
          // Lost the race even after the pre-flight — re-sync state so the
          // pill updates and the button disables.
          setHint("Another customer just added this piece. Try refreshing the page.");
          const re = await checkAvailability([item.inventoryId]);
          const reEntry = re.find((e) => e.inventoryId === item.inventoryId);
          setAvailState(reEntry ? reEntry.state : null);
        } else if (result.reason !== "already_in_basket") {
          setHint(result.message || "Couldn't add that piece.");
        }
      } else {
        // Successful add → re-sync state so the page shows "YourBasket".
        const re = await checkAvailability([item.inventoryId]);
        const reEntry = re.find((e) => e.inventoryId === item.inventoryId);
        setAvailState(reEntry ? reEntry.state : null);
      }
    } finally {
      setBusy(false);
    }
  }, [item, busy, inBasket, isLockedByOther, availState, add, remove, images, checkAvailability]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="animate-pulse px-6 md:px-10 py-10 md:grid md:gap-16" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ aspectRatio: "4/5", background: "var(--surface-container)", borderRadius: "0.25rem" }} />
        <div className="space-y-5 mt-8 md:mt-0">
          <div className="h-3 w-24 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
          <div className="h-8 w-3/4 rounded-sm" style={{ background: "var(--surface-container)" }} />
          <div className="h-5 w-1/4 rounded-sm" style={{ background: "var(--surface-container-low)" }} />
          <div className="space-y-2 pt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-3 rounded-sm" style={{ background: "var(--surface-container-low)", width: `${75 + i * 5}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found (404 from items API, or Sold/Inactive — both mean "gone") ── */
  if (error === "not_found" || (!loading && !item) || isGone) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="ll-display text-3xl italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
          {isGone ? "No Longer Available" : "Piece Not Found"}
        </p>
        <p className="ll-body text-base font-light mb-8" style={{ color: "var(--outline)" }}>
          {isGone
            ? "This piece has found its home. Browse other one-of-a-kind heritage linens."
            : "This item may have been sold or removed from the collection."}
        </p>
        <Link href="/shop" className="btn-primary">Browse the Collection →</Link>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="ll-display text-2xl italic mb-4" style={{ color: "var(--on-surface-variant)" }}>
          Something went wrong.
        </p>
        <button onClick={fetchItem} className="btn-secondary">Try Again</button>
      </div>
    );
  }

  /* ── Button label + styling, computed once for use in both desktop CTA
       and mobile sticky bar so they always agree on what the state means. ── */
  const ctaLabel: string = (() => {
    if (busy)                   return inBasket ? "Removing…" : "Adding…";
    if (isYourPendingPayment)   return "Complete Payment →";
    if (isYourBasket || inBasket) return "✓ In Basket";
    if (availState === "InBasket")       return "In Someone's Basket";
    if (availState === "PendingPayment") return "Awaiting Payment";
    return "+ Add to Basket";
  })();

  // Disabled when blocked-by-other, or while the basket call is in flight.
  const ctaDisabled = busy || isLockedByOther;

  /* ── Full page ── */
  return (
    <>
      <div
        className="ll-texture-overlay min-h-screen pb-28 md:pb-0"
        style={{ background: "var(--surface)", color: "var(--on-surface)" }}
      >
        <Breadcrumb name={item.name} />

        {/* ────────────────────────────────────────────────────────
            Desktop: two-column layout — gallery left, info right
        ──────────────────────────────────────────────────────── */}
        <div className="px-6 md:px-10 md:grid md:gap-14 lg:gap-20 pb-0" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* ── Left: gallery (desktop only) ── */}
          <div className="hidden md:block">
            <DesktopGallery images={images} />
          </div>

          {/* ── Mobile: carousel ── */}
          <div className="md:hidden -mx-6 mb-6">
            <MobileCarousel images={images} />
          </div>

          {/* ── Right: information panel ── */}
          <div className="flex flex-col">

            {/* Status + SKU */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {item.isFeatured && (
                  <span
                    className="ll-label px-2.5 py-1 text-[0.5rem] font-medium uppercase tracking-[0.15em]"
                    style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "0.2rem" }}
                  >
                    Featured
                  </span>
                )}
                <span
                  className="ll-label text-[0.55rem] font-medium uppercase tracking-[0.15em]"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  One of a Kind
                </span>

                {/* Availability badge — visible alongside the One of a Kind
                    label so it's contextual to the piece's status. */}
                {availState === "InBasket" && (
                  <span
                    className="ll-label px-2.5 py-1 text-[0.5rem] font-medium uppercase tracking-[0.15em]"
                    style={{ background: "rgba(30,27,26,0.78)", color: "rgba(253,250,246,0.92)", borderRadius: "0.2rem" }}
                  >
                    In Someone's Basket
                  </span>
                )}
                {availState === "PendingPayment" && (
                  <span
                    className="ll-label px-2.5 py-1 text-[0.5rem] font-medium uppercase tracking-[0.15em]"
                    style={{ background: "rgba(176,120,120,0.92)", color: "#ffffff", borderRadius: "0.2rem" }}
                  >
                    Awaiting Payment
                  </span>
                )}
                {(availState === "YourBasket" || isYourPendingPayment) && (
                  <span
                    className="ll-label px-2.5 py-1 text-[0.5rem] font-medium uppercase tracking-[0.15em]"
                    style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "0.2rem" }}
                  >
                    {isYourPendingPayment ? "Your Pending Payment" : "In Your Basket"}
                  </span>
                )}
              </div>
              <span
                className="ll-label text-[0.55rem] uppercase tracking-[0.12em]"
                style={{ color: "var(--outline)" }}
              >
                {item.sku}
              </span>
            </div>

            {/* Name */}
            <h1
              className="ll-display font-normal leading-tight mb-2"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
                color: "var(--on-surface)",
                letterSpacing: "-0.015em",
              }}
            >
              {item.name}
            </h1>

            {/* Price */}
            <p
              className="ll-display text-2xl font-normal mb-6"
              style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
            >
              {formatPrice(item.unitPriceCents)}
            </p>

            {/* Description */}
            {item.description && (
              <p
                className="ll-body text-[1rem] font-light leading-[1.85] mb-8"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {item.description}
              </p>
            )}

            {/* Spec tiles */}
            {(() => {
              // Parse KeywordsJson once — safe fallback to {} if missing/invalid
              let kw: Record<string, string[]> = {};
              try { if (item.keywordsJson) kw = JSON.parse(item.keywordsJson); } catch { /* ignore */ }

              const condition = kw.condition?.[0] ?? null;
              const material  = (kw.materials ?? kw.material)?.[0] ?? null;

              const specs = [
                { label: "Condition", value: condition ?? "Heritage Grade" },
                { label: "Material",  value: material  ?? "Natural Linen"  },
                { label: "Quantity",  value: item.quantityOnHand > 1 ? `${item.quantityOnHand} available` : "One of a Kind" },
                { label: "Era",       value: kw.era?.[0] ?? kw.style?.[0] ?? "Antique" },
              ];

              return (
                <div
                  className="grid grid-cols-2 gap-px mb-8"
                  style={{ background: "rgba(196,181,168,0.15)", borderRadius: "0.25rem", overflow: "hidden" }}
                >
                  {specs.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 px-4 py-3"
                      style={{ background: "var(--surface-bright)" }}
                    >
                      <span className="ll-label text-[0.5rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--on-surface-variant)" }}>
                        {label}
                      </span>
                      <span className="ll-body text-sm font-normal capitalize" style={{ color: "var(--on-surface)" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Desktop CTAs — single primary action: add/remove from basket,
                OR route to checkout-resume for YourPendingPayment, OR show
                disabled "held by other" state. */}
            <div className="hidden md:flex flex-col gap-3">
              {isYourPendingPayment ? (
                // The customer has a Square checkout pending — send them
                // to /basket?tab=orders where they can resume payment in
                // the Orders sub-view.
                <Link
                  href="/basket?tab=orders"
                  className="btn-primary py-4 text-center text-[0.68rem] tracking-[0.15em]"
                >
                  Complete Payment →
                </Link>
              ) : (
                <button
                  onClick={toggleBasket}
                  disabled={ctaDisabled}
                  className="btn-primary py-4 text-[0.68rem] tracking-[0.15em] disabled:opacity-50"
                  style={{
                    cursor: isLockedByOther ? "not-allowed" : (busy ? "wait" : "pointer"),
                  }}
                >
                  {ctaLabel}
                </button>
              )}

              {/* "View Basket" secondary link when the piece is in the
                  customer's basket — survives the rename from inBasket
                  to availState since YourBasket implies a server-side hold. */}
              {(inBasket || isYourBasket) && !isYourPendingPayment && (
                <Link
                  href="/basket"
                  className="ll-label py-3 text-center text-[0.62rem] uppercase tracking-[0.15em] underline"
                  style={{
                    color: "var(--primary)",
                    textDecoration: "underline",
                  }}
                >
                  View Basket → Check Out
                </Link>
              )}

              {hint && (
                <p className="ll-body mt-1 text-xs italic" style={{ color: "#991b1b" }}>
                  {hint}
                </p>
              )}
            </div>


          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            Related curations
        ──────────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="px-6 md:px-10 py-14" style={{ borderTop: "1px solid rgba(196,181,168,0.15)" }}>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h2
                  className="ll-display text-2xl font-normal italic"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
                >
                  Related Curations
                </h2>
                <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.15em]" style={{ color: "var(--on-surface-variant)" }}>
                  Selected to complement your choice
                </p>
              </div>
              <Link
                href="/shop"
                className="ll-label hidden md:inline text-[0.58rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
                style={{ color: "var(--primary)" }}
              >
                View Collection →
              </Link>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {related.map((rel) => (
                <Link
                  key={rel.inventoryId}
                  href={`/shop/${rel.sku}`}
                  className="group block"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="overflow-hidden mb-3"
                    style={{ aspectRatio: "4/3", background: "var(--surface-container-highest)", borderRadius: "0.2rem" }}
                  >
                    {getThumbnailUrl(rel.inventoryId) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getThumbnailUrl(rel.inventoryId)!}
                        alt={rel.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center ll-display text-sm italic" style={{ color: "var(--outline-variant)" }}>
                        Linen Lady
                      </div>
                    )}
                  </div>
                  <p className="ll-display text-sm font-normal mb-0.5" style={{ color: "var(--on-surface)" }}>{rel.name}</p>
                  <p className="ll-label text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: "var(--primary)" }}>
                    {formatPrice(rel.unitPriceCents)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

        {/* ────────────────────────────────────────────────────────
            Care instructions
        ──────────────────────────────────────────────────────── */}
        <section
          className="mt-16 px-6 md:px-10 py-14"
          style={{ background: "var(--surface-container-low)", borderTop: "1px solid rgba(196,181,168,0.15)" }}
        >
          <div className="max-w-2xl">
            <h2
              className="ll-display text-2xl font-normal italic mb-8"
              style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
            >
              Caring for Your Heritage Piece
            </h2>
            <div className="flex flex-col gap-6">
              {CARE_STEPS.map(({ n, title, body }) => (
                <div key={n} className="flex gap-5">
                  <span
                    className="ll-label shrink-0 text-[0.58rem] font-medium uppercase tracking-[0.12em] pt-0.5"
                    style={{ color: "var(--primary)", width: 24 }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="ll-label mb-1 text-[0.65rem] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--on-surface)" }}>
                      {title}
                    </p>
                    <p className="ll-body text-sm font-light leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ────────────────────────────────────────────────────────
          Mobile sticky bottom bar — basket toggle + view-basket link,
          OR resume-payment link for YourPendingPayment, OR disabled
          state for locked-by-other.
      ──────────────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col"
        style={{
          background:    "var(--surface-bright)",
          borderTop:     "1px solid rgba(196,181,168,0.2)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Hint row — only renders when there's an error to surface */}
        {hint && (
          <p
            className="ll-body px-4 pt-2 text-xs italic"
            role="alert"
            style={{ color: "#991b1b" }}
          >
            {hint}
          </p>
        )}

        <div className="flex items-stretch gap-0">
          {isYourPendingPayment ? (
            // Full-width "Complete Payment" link, routes to /basket?tab=orders
            <Link
              href="/basket?tab=orders"
              className="ll-label flex-1 flex items-center justify-center gap-2 py-4 text-[0.65rem] uppercase tracking-[0.15em]"
              style={{
                background:    "var(--primary)",
                color:         "var(--on-primary)",
                border:        "none",
                textDecoration: "none",
              }}
            >
              Complete Payment →
            </Link>
          ) : (
            <>
              {/* When in basket: split bar — left half toggles off, right half goes to /account */}
              {/* When not in basket: full-width add button */}
              {/* When locked-by-other: full-width disabled button */}
              <button
                onClick={toggleBasket}
                disabled={ctaDisabled}
                className="ll-label flex-1 flex items-center justify-center gap-2 py-4 text-[0.65rem] uppercase tracking-[0.15em] transition-all duration-300 disabled:opacity-60"
                style={{
                  background: isLockedByOther
                    ? "var(--surface-container)"
                    : (inBasket || isYourBasket)
                      ? "var(--surface-container-low)"
                      : "var(--primary)",
                  color: isLockedByOther
                    ? "var(--on-surface-variant)"
                    : (inBasket || isYourBasket)
                      ? "var(--primary)"
                      : "var(--on-primary)",
                  cursor: isLockedByOther ? "not-allowed" : (busy ? "wait" : "pointer"),
                  border:  "none",
                  borderRight: (inBasket || isYourBasket) ? "1px solid rgba(196,181,168,0.2)" : "none",
                }}
              >
                <svg
                  width="18" height="18" viewBox="0 0 24 24"
                  fill={(inBasket || isYourBasket) ? "currentColor" : "none"}
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {ctaLabel}
              </button>

              {(inBasket || isYourBasket) && !isLockedByOther && (
                <Link
                  href="/basket"
                  className="ll-label flex-1 flex items-center justify-center py-4 text-[0.65rem] uppercase tracking-[0.15em] transition-all duration-300"
                  style={{
                    background: "var(--primary)",
                    color:      "var(--on-primary)",
                    border:     "none",
                    textDecoration: "none",
                  }}
                >
                  View Basket →
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
