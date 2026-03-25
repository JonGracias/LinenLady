"use client";

import type { Category } from "@/types/inventory";
import { CATEGORY_OPTIONS } from "@/types/inventory";

type Props = {
  active: Category | null;
  onChange: (value: Category | null) => void;
};

export default function CategoryDropdown({ active, onChange }: Props) {
  return (
    <select
      value={active ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value as Category)}
      className="ll-label border py-2 px-3 text-[0.7rem] uppercase tracking-[0.1em] outline-none"
      style={{
        borderColor: "var(--linen)",
        color: "var(--ink)",
        background: "var(--cream)",
        cursor: "pointer",
      }}
    >
      <option value="">All</option>
      {CATEGORY_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}