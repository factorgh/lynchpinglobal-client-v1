"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, TrendingUp, Layers } from "lucide-react";
import { TrophyOutlined } from "@ant-design/icons";

interface SlideItem {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  gradient: string;
  accentBg: string;
  icon: any;
}

const slides: SlideItem[] = [
  {
    badge: "PRIVATE MANDATES",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    title: "Institutional Wealth Stewardship",
    description: "Multi-generational capital preservation with disciplined quarterly compounding and bespoke mandates.",
    statLabel: "Yield Covenant",
    statValue: "Contractual",
    gradient: "from-slate-950 via-emerald-950/80 to-slate-900",
    accentBg: "bg-emerald-500/10",
    icon: ShieldCheck,
  },
  {
    badge: "ENERGY & COMMODITIES",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    title: "Asset-Backed Energy Ventures",
    description: "Secured participation in verified bulk fuel distribution and midstream oil & gas infrastructure.",
    statLabel: "Collateral Ratio",
    statValue: "100% Backed",
    gradient: "from-slate-950 via-amber-950/70 to-slate-900",
    accentBg: "bg-amber-500/10",
    icon: Layers,
  },
  {
    badge: "QUARTERLY YIELDS",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/30",
    title: "Consistent Compounded Accruals",
    description: "Automated daily interest tracking and quarterly payout disbursements tailored to your mandate.",
    statLabel: "Disbursement Cycle",
    statValue: "Quarterly",
    gradient: "from-slate-950 via-teal-950/80 to-slate-900",
    accentBg: "bg-teal-500/10",
    icon: TrendingUp,
  },
  {
    badge: "PERFORMANCE LINKED",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    title: "Alpha Growth & Special Distributions",
    description: "Quarterly performance distributions linked to proprietary commodity trade gains and asset rentals.",
    statLabel: "Capital Standing",
    statValue: "A-Rated",
    gradient: "from-slate-950 via-indigo-950/80 to-slate-900",
    accentBg: "bg-blue-500/10",
    icon: TrophyOutlined,
  },
];

const CustomSlider: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[activeIndex];
  const IconComponent = currentSlide.icon;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden w-full h-full min-h-[220px] sm:min-h-[260px] rounded-2xl shadow-lg border border-slate-700/50 flex flex-col justify-between p-5 sm:p-6 transition-all duration-700 select-none bg-gradient-to-br"
      style={{
        backgroundImage: `radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 50%), linear-gradient(to bottom right, var(--tw-gradient-stops))`,
      }}
    >
      {/* Background Gradient Layer */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient} transition-colors duration-1000 -z-10`}
      />

      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Slide Header: Badge + Navigation Arrows */}
      <div className="flex items-center justify-between gap-2 z-10">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border backdrop-blur-md ${currentSlide.badgeColor}`}
        >
          <IconComponent className="w-3 h-3" />
          {currentSlide.badge}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevious}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Body: Title & Description */}
      <div className="my-auto py-2 z-10">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug drop-shadow-sm">
          {currentSlide.title}
        </h3>
        <p className="text-xs text-white/75 font-normal mt-1.5 leading-relaxed line-clamp-2 sm:line-clamp-3">
          {currentSlide.description}
        </p>
      </div>

      {/* Slide Footer: Metric Highlight & Dots */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/60 font-medium">
            {currentSlide.statLabel}:
          </span>
          <span className="text-xs font-bold text-emerald-400 font-mono tracking-tight">
            {currentSlide.statValue}
          </span>
        </div>

        {/* Slide Indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeIndex === index
                  ? "w-5 bg-emerald-400"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomSlider;
