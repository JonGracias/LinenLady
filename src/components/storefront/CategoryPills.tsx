"use client";

import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

type Props = {
  active: Category | null;
  onChange: (value: Category | null) => void;
};

export default function CategoryPills({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[{ value: null, label: "All Pieces" }, ...CATEGORY_OPTIONS].map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={label}
            onClick={() => onChange(value as Category | null)}
            className="ll-label text-[0.62rem] font-medium uppercase tracking-[0.15em] transition-all duration-400"
            style={{
              padding: "0.375rem 1rem",
              background:  isActive ? "var(--primary)" : "transparent",
              color:       isActive ? "var(--on-primary)" : "var(--on-surface-variant)",
              border:      isActive ? "1px solid var(--primary)" : "1px solid rgba(196,181,168,0.3)",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}