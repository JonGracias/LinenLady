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
      className="ll-label text-[0.68rem] font-medium uppercase tracking-[0.1em] outline-none transition-all duration-400"
      style={{
        padding: "0.5rem 0.75rem",
        background: "var(--surface-bright)",
        color: "var(--on-surface)",
        border: "1px solid rgba(196,181,168,0.3)",
        borderRadius: "0.25rem",
        cursor: "pointer",
      }}
    >
      <option value="">All Pieces</option>
      {CATEGORY_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}