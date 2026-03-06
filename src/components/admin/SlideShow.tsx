"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import type { InventoryImage } from "@/types/inventory";

type Props = {
  images: InventoryImage[];
  onSwiper?: (swiper: any) => void;
  onSlideChange?: (imageId: number) => void;
};

export default function ImageCarousel({ images, onSwiper, onSlideChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = (images ?? []).filter(
    (x): x is InventoryImage & { ReadUrl: string } =>
      typeof x.ReadUrl === "string" && x.ReadUrl.length > 0
  );

  if (slides.length === 0) return null;

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="swiper-fill relative w-full h-full bg-black">
      <Swiper
        modules={[Navigation, Pagination]}
        onSwiper={onSwiper}
        onSlideChange={(swiper) => {
          const img = slides[swiper.activeIndex];
          if (img) onSlideChange?.(img.ImageId);
        }}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={10}
        slidesPerView={1}
      >
        {slides.map((img, i) => (
          <SwiperSlide key={img.ImageId ?? i}>
            <img
              src={img.ReadUrl}
              alt={`Slide ${i + 1}`}
              className="bg-black"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-8 right-2 z-10 p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
    </div>
  );
}