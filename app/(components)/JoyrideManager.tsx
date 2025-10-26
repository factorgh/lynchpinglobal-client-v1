"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TourProvider, useTour, type StepType } from "@reactour/tour";
import { getSteps, type TourPersona } from "@/lib/tour/steps";
import { useAuth } from "@/context/authContext";

// 🎯 Utility: localStorage-safe helper
const storage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// 🧭 Auto-start when unseen
function AutoStartTour({ storageKey }: { storageKey: string }) {
  const { setIsOpen } = useTour();

  React.useEffect(() => {
    const seen = storage.get(storageKey);
    if (!seen) {
      // Wait for DOM to stabilize and ensure tour-ready elements exist
      const checkTourReady = () => {
        const hasTourElements = document.querySelectorAll('[data-tour]').length > 0;
        if (hasTourElements) {
          setIsOpen(true);
        } else {
          setTimeout(checkTourReady, 200);
        }
      };
      
      const timer = setTimeout(checkTourReady, 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey, setIsOpen]);

  return null;
}

// 🆘 Floating control buttons
function TourControls({ storageKey }: { storageKey: string }) {
  const { setIsOpen } = useTour();

  const handleOpen = () => setIsOpen(true);
  const handleRestart = () => {
    storage.remove(storageKey);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex gap-2">
      <button
        onClick={handleOpen}
        className="rounded-full bg-black text-white text-xs px-4 py-2 hover:bg-gray-900 shadow-md"
      >
        Help
      </button>
      <button
        onClick={handleRestart}
        className="rounded-full bg-gray-700 text-white text-xs px-4 py-2 hover:bg-gray-800 shadow-md"
      >
        Restart
      </button>
    </div>
  );
}

// 🔢 Step indicator
function ProgressBadge() {
  const { steps, currentStep, isOpen } = useTour();
  if (!isOpen || !steps?.length) return null;
  return (
    <div className="fixed bottom-5 left-5 z-[9999] bg-black/80 text-white text-xs px-3 py-1 rounded-full shadow-md">
      Step {(currentStep ?? 0) + 1} / {steps.length}
    </div>
  );
}

// 🧭 Main Manager
export default function TourManager({
  persona,
  version = "v1",
}: {
  persona?: TourPersona;
  version?: string;
}) {
  const { roles } = useAuth();
  const authPersona: TourPersona = roles === "admin" ? "admin" : "client";
  const activePersona: TourPersona = persona ?? authPersona;
  const pathname = usePathname() || "/";
  const storageKey = `tour_seen:${activePersona}:${version}:${pathname}`;
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => setMounted(true), []);

  const steps = React.useMemo<StepType[]>(() => {
    const stepList = getSteps(activePersona, pathname);
    // Validate steps exist
    if (!stepList || stepList.length === 0) {
      console.warn(`No tour steps found for persona: ${activePersona}, path: ${pathname}`);
      return [];
    }
    return stepList;
  }, [activePersona, pathname]);

  if (!mounted) return null;
  
  // Don't render tour if no valid steps
  if (!steps || steps.length === 0) return null;

  return (
    <TourProvider
      steps={steps}
      disableInteraction={false}
      scrollSmooth
      padding={8}
      styles={{
        maskArea: (base) => ({
          ...base,
          rx: 12,
        }),
        popover: (base) => ({
          ...base,
          borderRadius: 12,
          maxWidth: 300,
          backgroundColor: "#fff",
          color: "#111",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1), 0 2px 10px rgba(0,0,0,0.05)",
        }),
        badge: (base) => ({ ...base, display: "none" }),
      }}
      onClickClose={({ setIsOpen }) => {
        storage.set(storageKey, "1");
        setIsOpen(false);
      }}
      onClickMask={({ setIsOpen, steps, currentStep }) => {
        if (!steps || steps.length <= 1 || currentStep === steps.length - 1) {
          storage.set(storageKey, "1");
        }
        setIsOpen(false);
      }}
    >
      <AutoStartTour storageKey={storageKey} />
      <TourControls storageKey={storageKey} />
      <ProgressBadge />
    </TourProvider>
  );
}
