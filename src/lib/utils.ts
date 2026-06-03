export function formatPrice(cents: number) {
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

/* ─── Care instructions ───────────────────────────────────────────────────── */

export const CARE_STEPS = [
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