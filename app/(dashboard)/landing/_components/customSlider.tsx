"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  src: string;
  alt: string;
}

const slides: Slide[] = [
  { src: "/showcase.webp", alt: "Lynchpin Global Showcase 1" },
  { src: "/showcase2.webp", alt: "Lynchpin Global Showcase 2" },
  { src: "/showcase3.webp", alt: "Lynchpin Global Showcase 3" },
  { src: "/showcase4.webp", alt: "Lynchpin Global Showcase 4" },
  { src: "/showcase5.webp", alt: "Lynchpin Global Showcase 5" },
  { src: "/showcase6.webp", alt: "Lynchpin Global Showcase 6" },
  { src: "/showcase7.webp", alt: "Lynchpin Global Showcase 7" },
];

const CustomSlider: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden w-full h-full min-h-[220px] sm:min-h-[260px] rounded-2xl shadow-sm border border-slate-200/80 bg-slate-950 p-2 sm:p-2.5 group select-none"
    >
      {/* Slider Carousel Container with margin on sides */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full px-1.5 sm:px-2.5 py-1"
          >
            <div
              className="w-full h-full rounded-xl bg-cover bg-center bg-no-repeat shadow-inner transition-transform duration-300"
              style={{
                backgroundImage: `url(${slide.src})`,
              }}
              role="img"
              aria-label={slide.alt}
            />
          </div>
        ))}
      </div>

      {/* Manual Navigation Controls (Chevron Arrows) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
        <button
          type="button"
          onClick={goToPrevious}
          className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-sm"
          aria-label="Previous Showcase Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-sm"
          aria-label="Next Showcase Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide Indicator Dots at Bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === index
                ? "w-6 h-1.5 bg-amber-400"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Jump to showcase slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomSlider;

