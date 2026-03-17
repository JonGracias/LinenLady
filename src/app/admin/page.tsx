// src/app/admin/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  {
    href:    "/admin/items",
    label:   "Inventory",
    sub:     "Review, edit and publish pieces",
    icon:    "🪡",
    accent:  "var(--rose-deep, #b07878)",
    accentBg:"rgba(176,120,120,0.08)",
  },
  {
    href:    "/admin/media",
    label:   "Media",
    sub:     "Upload and manage site photos",
    icon:    "🖼",
    accent:  "rgba(143,173,148,0.9)",
    accentBg:"rgba(143,173,148,0.07)",
  },
  {
    href:    "/admin/hero",
    label:   "Hero Banner",
    sub:     "Configure homepage slides",
    icon:    "✦",
    accent:  "rgba(210,190,150,0.9)",
    accentBg:"rgba(210,190,150,0.06)",
  },
];

export default function AdminLandingPage() {
  const { user } = useUser();
  const [hovered, setHovered] = useState<string | null>(null);

  const firstName = user?.firstName ?? "Admin";

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden px-8 py-16"
      style={{ background: "#0f0f0f" }}
    >
      {/* Subtle grain texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* Faint radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top:       "30%",
          left:      "50%",
          transform: "translate(-50%, -50%)",
          width:     700,
          height:    700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(176,120,120,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Wordmark */}
      <div className="relative z-10 mb-16 text-center">
        <div
          className="ll-label mb-3 text-[0.6rem] uppercase tracking-[0.35em]"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Linen Lady · Admin
        </div>
        <h1
          className="ll-display font-normal"
          style={{
            fontSize:      "clamp(2rem, 4vw, 3rem)",
            color:         "rgba(255,255,255,0.85)",
            letterSpacing: "0.02em",
          }}
        >
          Good{" "}
          <em className="italic" style={{ color: "var(--rose-deep, #b07878)" }}>
            {getTimeOfDay()}
          </em>
          {", "}
          {firstName}.
        </h1>
        <p
          className="ll-body mt-3 text-sm font-light"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          What would you like to work on?
        </p>
      </div>

      {/* Nav cards */}
      <div
        className="relative z-10 grid w-full gap-4"
        style={{ maxWidth: 680, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {NAV_ITEMS.map(({ href, label, sub, icon, accent, accentBg }) => (
          <Link
            key={href}
            href={href}
            onMouseEnter={() => setHovered(href)}
            onMouseLeave={() => setHovered(null)}
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex flex-col gap-4 p-6 transition-all duration-300"
              style={{
                background:   hovered === href ? accentBg : "rgba(255,255,255,0.02)",
                border:       `1px solid ${hovered === href ? accent : "rgba(255,255,255,0.06)"}`,
                transform:    hovered === href ? "translateY(-4px)" : "translateY(0)",
                boxShadow:    hovered === href ? `0 16px 40px rgba(0,0,0,0.4)` : "none",
              }}
            >
              {/* Icon */}
              <div
                className="flex h-12 w-12 items-center justify-center text-2xl transition-transform duration-300"
                style={{
                  background:   `rgba(255,255,255,0.04)`,
                  border:       `1px solid rgba(255,255,255,0.06)`,
                  transform:    hovered === href ? "scale(1.1)" : "scale(1)",
                }}
              >
                {icon}
              </div>

              {/* Label */}
              <div>
                <div
                  className="ll-display font-normal text-lg transition-colors duration-200"
                  style={{ color: hovered === href ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)" }}
                >
                  {label}
                </div>
                <div
                  className="ll-body mt-1 text-xs font-light leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {sub}
                </div>
              </div>

              {/* Arrow */}
              <div
                className="ll-label mt-auto text-[0.65rem] uppercase tracking-[0.15em] transition-all duration-200"
                style={{
                  color:     hovered === href ? accent : "rgba(255,255,255,0.15)",
                  transform: hovered === href ? "translateX(4px)" : "translateX(0)",
                }}
              >
                Enter →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div
        className="relative z-10 mt-16 ll-label text-[0.55rem] uppercase tracking-[0.2em]"
        style={{ color: "rgba(255,255,255,0.1)" }}
      >
        Noemi · The Linen Lady · Georgetown Flea Market
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}