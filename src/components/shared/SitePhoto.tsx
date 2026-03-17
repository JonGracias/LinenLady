// src/components/shared/SitePhoto.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MediaPickerModal, type SiteMediaItem } from "./MediaPickerModal";

type Props = {
  siteKey:    string;
  alt?:       string;
  className?: string;
  style?:     React.CSSProperties;
  objectFit?: "cover" | "contain";
};

type SiteConfigDto = {
  ConfigKey: string;
  MediaId:   number | null;
  Media:     SiteMediaItem | null;
  UpdatedAt: string;
};

const ADMIN_ORG_ID = process.env.NEXT_PUBLIC_ADMIN_ORG_ID;

export function SitePhoto({ siteKey, alt, className, style, objectFit = "cover" }: Props) {
  const { user, isLoaded } = useUser();

  const [config,     setConfig]     = useState<SiteConfigDto | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [hovered,    setHovered]    = useState(false);

  const isAdmin = isLoaded && !!user?.organizationMemberships?.some(
    (m) => m.organization.id === ADMIN_ORG_ID
  );

  useEffect(() => {
    fetch(`/api/site/config/${encodeURIComponent(siteKey)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [siteKey]);

  const handleSelect = async (media: SiteMediaItem) => {
    setPickerOpen(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/site/config/${encodeURIComponent(siteKey)}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ MediaId: media.MediaId }),
      });
      if (res.ok) setConfig(await res.json());
    } finally {
      setSaving(false);
    }
  };

  const imgUrl = config?.Media?.ReadUrl ?? null;

  return (
    <>
      <div
        className={`relative overflow-hidden ${className ?? ""}`}
        style={style}
        onMouseEnter={() => isAdmin && setHovered(true)}
        onMouseLeave={() => isAdmin && setHovered(false)}
      >
        {loading ? (
          <div className="h-full w-full animate-pulse" style={{ background: "var(--linen, #e8ddd0)" }} />

        ) : imgUrl ? (
          <>
            <img
              src={imgUrl}
              alt={alt ?? siteKey}
              className="h-full w-full transition-transform duration-500"
              style={{
                objectFit,
                transform: hovered && isAdmin ? "scale(1.02)" : "scale(1)",
              }}
            />
            {/* Admin edit overlay on existing image */}
            {isAdmin && (
              <button
                onClick={() => setPickerOpen(true)}
                disabled={saving}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: hovered ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
                  opacity:    hovered ? 1 : 0,
                  border:     "none",
                  cursor:     "pointer",
                }}
              >
                <span style={{ fontSize: "2rem", color: "#fff" }}>✎</span>
                <span
                  className="ll-label text-[0.62rem] uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {saving ? "Saving…" : "Change photo"}
                </span>
              </button>
            )}
          </>

        ) : isAdmin ? (
          /* ── Admin placeholder — full size, dashed, obvious ── */
          <button
            onClick={() => !saving && setPickerOpen(true)}
            disabled={saving}
            className="flex h-full w-full flex-col items-center justify-center gap-3 transition-colors duration-200"
            style={{
              background:  hovered ? "rgba(176,120,120,0.06)" : "var(--cream-dark, #f0ebe2)",
              border:      `2px dashed ${hovered ? "rgba(176,120,120,0.5)" : "rgba(0,0,0,0.15)"}`,
              cursor:      "pointer",
            }}
          >
            {saving ? (
              <span className="ll-label text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: "rgba(0,0,0,0.4)" }}>
                Saving…
              </span>
            ) : (
              <>
                {/* Big + icon */}
                <div
                  className="flex items-center justify-center transition-transform duration-200"
                  style={{
                    width:        64,
                    height:       64,
                    borderRadius: "50%",
                    background:   hovered ? "rgba(176,120,120,0.12)" : "rgba(0,0,0,0.05)",
                    transform:    hovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: "2rem", color: hovered ? "var(--rose-deep, #b07878)" : "rgba(0,0,0,0.25)", lineHeight: 1 }}>
                    +
                  </span>
                </div>
                {/* Key label */}
                <span
                  className="ll-label text-[0.62rem] uppercase tracking-[0.2em] transition-colors duration-200"
                  style={{ color: hovered ? "var(--rose-deep, #b07878)" : "rgba(0,0,0,0.3)" }}
                >
                  {siteKey.replace(/-/g, " ")}
                </span>
                <span
                  className="ll-label text-[0.55rem] uppercase tracking-[0.15em]"
                  style={{ color: "rgba(0,0,0,0.2)" }}
                >
                  Click to add photo
                </span>
              </>
            )}
          </button>

        ) : (
          /* Customer placeholder — invisible */
          <div className="h-full w-full" style={{ background: "var(--cream-dark, #f0ebe2)" }} />
        )}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        title={`Set photo: ${siteKey}`}
      />
    </>
  );
}