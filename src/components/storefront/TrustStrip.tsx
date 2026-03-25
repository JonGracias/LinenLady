"use client";

export default function TrustStrip() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ background: "var(--ink)" }}
    >
      <span
        className="ll-label py-[1.1rem] px-10 text-[0.65rem] uppercase tracking-[0.2em] whitespace-nowrap"
        style={{ color: "var(--rose-light)" }}
      >
        Antique &amp; Vintage Linens Since 1994
      </span>
    </div>
  );
}