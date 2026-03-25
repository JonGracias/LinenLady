"use client";
import Link from "next/link";

// ── Shared layout ─────────────────────────────────────────────

function LegalLayout({ title, updated, children }: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ll-texture-overlay min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <div className="ll-texture-overlay pointer-events-none fixed inset-0 z-0" />

      <div className="h-3 w-full opacity-60" style={{ background: `repeating-linear-gradient(90deg,#b07878 0px,#b07878 8px,transparent 8px,transparent 16px,#8fad94 16px,#8fad94 24px,transparent 24px,transparent 32px,#ecdcdc 32px,#ecdcdc 40px,transparent 40px,transparent 48px)` }} />

      <nav className="relative z-10 flex items-center justify-between border-b px-12 py-5" style={{ borderColor: "var(--linen)", backgroundColor: "var(--cream)" }}>
        <Link href="/" className="ll-display text-lg italic" style={{ color: "var(--brown)", textDecoration: "none" }}>
          Noemi <span style={{ fontStyle: "normal", color: "var(--rose-deep)" }}>· The Linen Lady</span>
        </Link>
        <Link href="/shop" className="ll-label text-[0.72rem] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Shop</Link>
      </nav>

      <div className="relative z-[1] mx-auto max-w-3xl px-8 py-20">
        <div className="ll-label mb-3 text-[0.62rem] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--sage-deep)" }}>
          Last updated {updated}
        </div>
        <h1 className="ll-display mb-12 font-normal" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "var(--ink)" }}>
          {title}
        </h1>
        {children}
        <div className="mt-16 border-t pt-8" style={{ borderColor: "var(--linen)" }}>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--sage-deep)", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/terms"   className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--sage-deep)", textDecoration: "none" }}>Terms of Sale</Link>
            <Link href="/"        className="ll-label text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section helper ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="ll-display mb-4 text-xl font-normal" style={{ color: "var(--ink)" }}>{title}</h2>
      <div className="ll-body text-base font-light leading-[1.85]" style={{ color: "var(--ink-soft)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Sale" updated="January 1, 2025">
      <Section title="All Sales Are Final">
        <p>
          All items sold through this website and at the Georgetown Flea Market are vintage or
          antique and are sold as-is. All sales are final. We do not accept returns or exchanges
          unless an item was materially misrepresented in its listing.
        </p>
      </Section>

      <Section title="Reservations">
        <p className="mb-3">
          When you reserve an item, the item is held exclusively for you for <strong>48 hours</strong>.
          During this window, a Square payment link will be sent to your email address. Payment must
          be completed within 48 hours or the reservation will automatically expire and the item
          will become available to other buyers.
        </p>
        <p>
          Reservations may be cancelled by the buyer at any time before payment is completed.
          Once payment has been received, the sale is final.
        </p>
      </Section>

      <Section title="Pricing">
        <p>
          All prices are listed in US dollars and are inclusive of any applicable taxes. Prices are
          set by Noemi and reflect the age, condition, rarity, and provenance of each piece.
          Prices are not negotiable through the website, though you are welcome to discuss pricing
          in person at the market.
        </p>
      </Section>

      <Section title="Shipping">
        <p className="mb-3">
          Shipping is available for most items. Shipping costs are calculated at checkout based
          on the item size and your delivery address. We ship within the United States only.
        </p>
        <p>
          Antique and vintage linens are packed carefully, but we cannot accept responsibility for
          damage caused by carriers. We strongly recommend purchasing shipping insurance for
          high-value items.
        </p>
      </Section>

      <Section title="Item Descriptions">
        <p>
          We describe each item as accurately as possible including estimated age, origin, condition,
          and any known defects. Antique and vintage items will show signs of age and use consistent
          with their history — this is not considered a defect. If you have questions about a
          specific item before reserving it, please message us through your account or visit us at
          the market.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          Payments are processed by Square, Inc. We do not store or have access to your payment
          card information. By completing a payment you agree to Square&apos;s{" "}
          <a href="https://squareup.com/us/en/legal/general/ua" target="_blank" rel="noreferrer" style={{ color: "var(--rose-deep)" }}>
            Terms of Service
          </a>.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For questions about an order or reservation, message us through your account or email{" "}
          <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} style={{ color: "var(--rose-deep)" }}>{process.env.NEXT_PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}