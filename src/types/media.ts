// src/types/media.ts

export type SiteMediaItem = {
  mediaId:    number;
  name:       string;
  blobPath:   string;
  readUrl:    string | null;
  uploadedAt: string;
};

export type MediaProps = {
  open:       boolean;
  onClose:    () => void;
  onSelect:   (media: SiteMediaItem) => void;
  title?:     string;
};

export type NewBlobUrlResponse = {
  uploadUrl:       string;
  requiredHeaders: Record<string, string>;
  contentType:     string;
  blobName:        string;
};

export type HeroSlide = {
  slideId:   number;
  mediaId:   number | null;
  media:     SiteMediaItem | null;
  heading:   string | null;
  subtext:   string | null;
  linkUrl:   string | null;
  linkLabel: string | null;
  sortOrder: number;
  isActive:  boolean;
};

export type PanelPosition =
  | "bottom"        // full-width caption bar along the bottom edge (default)
  | "bottom-left"   // compact card, bottom-left corner
  | "bottom-right"  // compact card, bottom-right corner
  | "top-left"      // compact card, top-left corner
  | "top-right";    // compact card, top-right corner

export type BannerSlide = {
  photoUrl?:       string;
  label?:          string;
  headline:        string;
  sub?:            string;
  href?:           string;
  cta?:            string;
  secondaryHref?:  string;
  secondaryCta?:   string;
  thumbnailUrl?:   string | null;
  itemName?:       string;
  /** Saved by AI on upload. Falls back to "bottom" if omitted. */
  panelPosition?:  PanelPosition;
};
