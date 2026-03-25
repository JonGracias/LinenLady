// /components/storefront/CategoryGrid

"use client";

import Link from "next/link";

type Category = {
  icon: string;
  name: string;
  sub: string;
  cat: string | null;
};

const CATEGORIES: Category[] = [
  { icon: "🪡", name: "Antique Linens",    sub: "Tablecloths · Napkins · Runners", cat: "tablecloth" },
  { icon: "🧵", name: "Lace & Embroidery", sub: "Needle lace · Broderie",          cat: "lace" },
  { icon: "🛏️", name: "Bed Linens",        sub: "Sheets · Shams · Coverlets",      cat: "bed linen" },
  { icon: "🏺", name: "Table & Home",      sub: "Placemats · Runners · Doilies",   cat: "runner" },
  { icon: "🧣", name: "Quilts & Blankets", sub: "Quilts · Throws · Blankets",      cat: "quilt" },
  { icon: "🔮", name: "All Pieces",        sub: "Browse everything",               cat: null },
];

type Props = {
  SectionTitle: React.ComponentType<{ children: React.ReactNode; center?: boolean }>;
};

export default function CategoryGrid({ SectionTitle }: Props) {
  return (
    <section
        className="relative z-[1] px-6 md:px-16 py-5"
        style={{
            background: "linear-gradient(135deg, var(--sage-light) 0%, var(--cream-dark) 100%)",
        }}
        >
        <div className="mb-5 text-center">

            <SectionTitle center>
            Shop <em className="italic" style={{ color: "var(--rose-deep)" }}>by Category</em>
            </SectionTitle>
        </div>

        <div className="mx-auto w-full max-w-[1120px]">
            <div
            className="grid gap-px"
            style={{
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                background: "var(--linen)",
            }}
            >
            {CATEGORIES.map(({ icon, name, sub, cat }) => {
                const isAllPieces = cat === null;

                return (
                    <Link
                    key={name}
                    href={cat ? `/shop?category=${cat}` : "/shop"}
                    className="flex h-[140px] items-center justify-center px-4 text-center transition-colors duration-200"
                    style={{
                        background: isAllPieces ? "var(--rose)" : "var(--cream)",
                        textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = isAllPieces
                        ? "var(--brown)"
                        : "var(--rose-light)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = isAllPieces
                        ? "var(--rose-deep)"
                        : "var(--cream)";
                    }}
                    >
                    <div className="flex flex-col items-center justify-center">
                        <span className="mb-2 block text-2xl">
                        {isAllPieces ? "→" : icon}
                        </span>

                        <div
                        className="ll-display text-sm italic leading-tight"
                        style={{ color: isAllPieces ? "var(--cream)" : "var(--ink)" }}
                        >
                        {isAllPieces ? "Browse All" : name}
                        </div>

                        <div
                        className="ll-label mt-[2px] text-[0.58rem] leading-tight uppercase tracking-[0.12em]"
                        style={{
                            color: isAllPieces ? "var(--rose-light)" : "var(--ink-soft)",
                        }}
                        >
                        {sub}
                        </div>
                    </div>
                    </Link>
                );
                })}
            </div>
        </div>
        </section>
  );
}