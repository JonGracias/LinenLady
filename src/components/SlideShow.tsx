"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import type { InventoryImage } from "@/types/inventory";

export default function ImageCarousel({ images }: { images: InventoryImage[] }) {
  const slides = (images ?? []).filter(
    (x): x is InventoryImage & { ReadUrl: string } => typeof x.ReadUrl === "string" && x.ReadUrl.length > 0
  );

  if (slides.length === 0) return null;

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={10}
      slidesPerView={1}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden"
    >
      {slides.map((img, i) => (
        <SwiperSlide key={img.ImageId ?? i}>
          <img
            src={img.ReadUrl}
            alt={`Slide ${i + 1}`}
            className="object-contain bg-gray-50"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
