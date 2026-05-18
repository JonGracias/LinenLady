// src/app/(store)/account/_components/basket/_utils.ts
//
// Display helpers shared by ActiveReservations, CheckoutPanel, and the
// BasketTab orchestrator. Tiny on purpose — anything bigger lives in
// the component that owns it.

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h remaining`;
  }
  return `${h}h ${m}m remaining`;
}