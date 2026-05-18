// src/app/contact/page.tsx
//
// Public contact page. Uses the same storefront layout as /shop and /about
// (header + footer come from the route group's layout.tsx).

import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title:       "Contact — LinenLady",
  description:
    "Send a message to Noemi about a piece in the collection, an order, or a question about antique linens.",
};

type SearchParams = {
  sku?:  string;
  item?: string;
};

export default async function ContactPage({
  searchParams,
}: {
  // App Router 14+: searchParams is a Promise.
  searchParams: Promise<SearchParams>;
}) {
  const { sku, item } = await searchParams;

  return (
    <main
      className="min-h-screen px-6 sm:px-12 py-16 md:py-24"
      style={{ background: "var(--surface)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="ll-label text-[0.62rem] uppercase tracking-[0.18em] mb-3"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Inquire
          </p>
          <h1
            className="ll-display text-4xl sm:text-5xl font-light mb-4"
            style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
          >
            Write to Noemi
          </h1>
          <p
            className="ll-body text-base sm:text-lg font-light leading-relaxed max-w-md mx-auto"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Questions about a piece, a custom request, or anything you'd like to know about
            the collection — Noemi reads and answers every message herself.
          </p>
        </div>

        {/* Form */}
        <div
          className="p-8 sm:p-10 rounded-lg"
          style={{
            background: "var(--surface-bright)",
            border:     "1px solid rgba(196, 181, 168, 0.25)",
          }}
        >
          <ContactForm productSku={sku} productName={item} />
        </div>
      </div>
    </main>
  );
}
