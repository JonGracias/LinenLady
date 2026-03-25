"use client";

import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

type Props = {
  active: Category | null;
  onChange: (value: Category | null) => void;
};

export default function CategoryPills({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className="ll-label px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] border transition-all duration-200"
        style={{
          background:  active === null ? "var(--rose-deep)" : "transparent",
          color:       active === null ? "#fff" : "var(--ink-soft)",
          borderColor: active === null ? "var(--rose-deep)" : "var(--linen)",
          cursor: "pointer",
        }}
      >
        All
      </button>
      {CATEGORY_OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className="ll-label px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] border transition-all duration-200"
            style={{
              background:  isActive ? "var(--rose-deep)" : "transparent",
              color:       isActive ? "#fff" : "var(--ink-soft)",
              borderColor: isActive ? "var(--rose-deep)" : "var(--linen)",
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