// src/components/contact/AskAboutItemButton.tsx
//
// Small launcher used on /shop/[sku]. Routes the buyer to /contact with the
// SKU and item name pre-populated in the query string — the contact page
// reads those and feeds them into ContactForm.
//
// We do this via a plain Link rather than an inline modal so the contact
// page stays the canonical place for inquiries (one URL to share, one place
// to maintain copy).

import Link from "next/link";

type Props = {
  sku:      string;
  itemName: string;
  /** Visual variant. "primary" matches the main CTA on a product page. */
  variant?: "primary" | "secondary";
};

export default function AskAboutItemButton({ sku, itemName, variant = "secondary" }: Props) {
  const href = `/contact?sku=${encodeURIComponent(sku)}&item=${encodeURIComponent(itemName)}`;
  const cls  = variant === "primary" ? "btn-primary" : "btn-secondary";

  return (
    <Link href={href} className={cls}>
      Ask Noemi about this piece →
    </Link>
  );
}
