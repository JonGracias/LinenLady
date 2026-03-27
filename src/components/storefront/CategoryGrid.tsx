// src/components/storefront/CategoryGrid.tsx
"use client";

import Link from "next/link";

type Category = {
  icon: string;
  name: string;
  sub:  string;
  cat:  string | null;
};

const CATEGORIES: Category[] = [
  { icon: "🪡", name: "Antique Linens",    sub: "Tablecloths · Napkins · Runners", cat: "tablecloth" },
  { icon: "🧵", name: "Lace & Embroidery", sub: "Needle lace · Broderie",          cat: "lace"       },
  { icon: "🛏️", name: "Bed Linens",        sub: "Sheets · Shams · Coverlets",      cat: "bed linen"  },
  { icon: "🏺", name: "Table & Home",      sub: "Placemats · Runners · Doilies",   cat: "runner"     },
  { icon: "🧣", name: "Quilts & Blankets", sub: "Quilts · Throws · Blankets",      cat: "quilt"      },
  { icon: "→",  name: "Browse All",        sub: "Browse everything",               cat: null         },
];

type Props = {
  SectionTitle: React.ComponentType<{ children: React.ReactNode; center?: boolean }>;
};

export default function CategoryGrid({ SectionTitle }: Props) {
  return (
    <section
      className="relative z-[1] py-8 md:py-10"
      style={{ background: "var(--surface-container-low)" }}
    >
      {/* Title */}
      <div className="mb-6 px-6 md:px-16 text-center">
        <SectionTitle center>
          Shop{" "}
          <em className="italic" style={{ color: "var(--primary)" }}>
            by Category
          </em>
        </SectionTitle>
      </div>

      {/* Grid */}
      <div className="ll-category-grid">
        {CATEGORIES.map(({ icon, name, sub, cat }) => {
          const isAllPieces = cat === null;
          return (
            <Link
              key={name}
              href={cat ? `/shop?category=${cat}` : "/shop"}
              className="group ll-category-cell"
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                padding:        "1.75rem 1rem",
                textAlign:      "center",
                textDecoration: "none",
                minHeight:      "120px",
                background:     isAllPieces ? "var(--primary)" : "var(--surface-bright)",
                transition:     "background 300ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = isAllPieces
                  ? "var(--primary-container)"
                  : "var(--surface-container)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = isAllPieces
                  ? "var(--primary)"
                  : "var(--surface-bright)";
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{icon}</span>
                <span
                  className="ll-display"
                  style={{
                    fontSize:      "0.85rem",
                    fontStyle:     "italic",
                    lineHeight:    1.2,
                    color:         isAllPieces ? "var(--on-primary)" : "var(--on-surface)",
                  }}
                >
                  {name}
                </span>
                <span
                  className="ll-label"
                  style={{
                    fontSize:      "0.5rem",
                    lineHeight:    1.3,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color:         isAllPieces ? "rgba(253,250,246,0.7)" : "var(--on-surface-variant)",
                    opacity:       0,
                    transition:    "opacity 300ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  {sub}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .ll-category-grid {
          display: grid;
          gap: 1px;
          background: rgba(196,181,168,0.2);
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 540px) {
          .ll-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 768px) {
          .ll-category-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        }
        .ll-category-cell:hover .ll-label {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
}