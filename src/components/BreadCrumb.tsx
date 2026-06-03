import Link from "next/link";


/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

export default function Breadcrumb({ name }: { name: string }) {
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