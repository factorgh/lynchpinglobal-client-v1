"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TourProvider, useTour, type StepType } from "@reactour/tour";
import { getSteps, type TourPersona } from "@/lib/tour/steps";

type Step = {
  target: string; // CSS selector
  content: StepType["content"]; // align with @reactour/tour expected type
  placement?: string; // we'll map 'center' to position: 'center'
  disableBeacon?: boolean;
};

const routesSteps: Record<string, Step[]> = {};

function AutoStartTour({ storageKey }: { storageKey: string }) {
  const { setIsOpen, isOpen } = useTour();
  React.useEffect(() => {
    try {
      const seen =
        typeof window !== "undefined" && localStorage.getItem(storageKey);
      if (!seen) setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, [storageKey, setIsOpen]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen === false) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
    }
  }, [isOpen, storageKey]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsOpen]);
  return null;
}

function OpenTourButton({ storageKey }: { storageKey: string }) {
  const { setIsOpen } = useTour();
  const restart = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setIsOpen(true);
  };
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-black/80 text-white px-3 py-2 text-sm hover:bg-black"
        aria-label="Open tour"
      >
        Help
      </button>
      <button
        type="button"
        onClick={restart}
        className="rounded-full bg-gray-700/80 text-white px-3 py-2 text-sm hover:bg-gray-700"
        aria-label="Restart tour"
      >
        Restart
      </button>
    </div>
  );
}

function ProgressBadge() {
  const { steps, currentStep, isOpen } = useTour();
  if (!isOpen || !steps?.length) return null;
  const total = steps.length;
  const idx = (currentStep ?? 0) + 1;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 rounded bg-black/70 text-white px-2 py-1 text-xs"
    >
      {idx}/{total}
    </div>
  );
}

export default function JoyrideManager({
  persona = "client",
  version = "v1",
}: {
  persona?: TourPersona;
  version?: string;
}) {
  const pathname = usePathname() || "/";
  const storageKey = `tour_seen:${persona}:${version}:${pathname}`;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const steps: StepType[] = React.useMemo(() => {
    const s = getSteps(persona, pathname);
    // passthrough since StepType already matches
    return s;
  }, [persona, pathname]);

  if (!mounted) return null;

  return (
    <TourProvider
      steps={steps}
      onClickClose={({ setIsOpen }) => {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {}
        setIsOpen(false);
      }}
      onClickMask={({ setIsOpen, steps: allSteps, currentStep }) => {
        try {
          // Mark as seen when closing from mask, especially on last step or single-step tours
          if (
            !allSteps ||
            allSteps.length <= 1 ||
            currentStep === (allSteps?.length || 1) - 1
          ) {
            localStorage.setItem(storageKey, "1");
          }
        } catch {}
        setIsOpen(false);
      }}
      scrollSmooth
    >
      <AutoStartTour storageKey={storageKey} />
      <OpenTourButton storageKey={storageKey} />
      <ProgressBadge />
    </TourProvider>
  );
}
