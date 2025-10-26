"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TourProvider, useTour } from "@reactour/tour";
import { usePathname } from "next/navigation";
import {
  TourAnalyticsManager,
  TourPersona,
  TourStorage,
} from "./config";
import { getTourConfigs } from "./definitions";
import type { TourConfig } from "./config";

/**
 * Tour Controls Component
 * Shows Help/Restart buttons and progress
 */
function TourControls() {
  const { setIsOpen, currentStep, isOpen, steps } = useTour();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3">
      {/* Progress Badge */}
      {steps && steps.length > 0 && (
        <div className="bg-black/90 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          {currentStep + 1} / {steps.length}
        </div>
      )}
    </div>
  );
}

/**
 * Floating Help Button
 */
export function TourHelpButton() {
  const { setIsOpen } = useTour();
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!showButton) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-5 left-5 z-[9998] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors flex items-center gap-2"
      aria-label="Tour Help"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Help
    </button>
  );
}

/**
 * Auto-start Tour Wrapper
 */
function AutoStartTour({
  tourConfig,
  storageKey,
}: {
  tourConfig: TourConfig | null;
  storageKey: string;
}) {
  const { setIsOpen, setIsOpen: setOpenFromHook } = useTour();

  useEffect(() => {
    if (!tourConfig || !tourConfig.autoStart) return;

    // Check if already seen
    const seen = TourStorage.get(storageKey);
    if (seen && tourConfig.skipIfCompleted) return;

    // Wait for DOM and tour elements
    const checkReady = () => {
      if (tourConfig.steps.length === 0) return;

      const firstStep = tourConfig.steps[0];
      if (!firstStep?.selector || firstStep.selector === "body") {
        setOpenFromHook(true);
        return;
      }

      const element = document.querySelector(firstStep.selector);
      if (element) {
        setOpenFromHook(true);
      } else {
        setTimeout(checkReady, 200);
      }
    };

    const timer = setTimeout(checkReady, 600);
    return () => clearTimeout(timer);
  }, [tourConfig, storageKey, setIsOpen, setOpenFromHook]);

  return null;
}

/**
 * Main Tour Manager Component
 * Enterprise-grade tour system
 */
interface TourManagerProps {
  persona?: TourPersona;
  version?: string;
  onTourStart?: (tourId: string) => void;
  onTourComplete?: (tourId: string) => void;
  onTourAbandon?: (tourId: string) => void;
}

export default function TourManager({
  persona: propPersona,
  version = "2.0",
  onTourStart,
  onTourComplete,
  onTourAbandon,
}: TourManagerProps) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  const [persona, setPersona] = useState<TourPersona>("client");

  // Get persona from context or prop
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userPersona: TourPersona = user.role === "admin" || user.role === "superadmin" ? "admin" : "client";
        setPersona(userPersona);
      }
    } catch (e) {
      console.warn("Failed to get user persona", e);
    }
  }, []);

  const activePersona = propPersona || persona;

  // Get tour configuration
  const tourConfig = useMemo(() => {
    return getTourConfigs(activePersona, pathname);
  }, [activePersona, pathname]);

  // Storage key for tracking
  const storageKey = useMemo(() => {
    if (!tourConfig) return "";
    return TourStorage.getKey("seen", tourConfig.id, version);
  }, [tourConfig, version]);

  // Initialize
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle tour events
  const handleTourOpen = useCallback(() => {
    if (!tourConfig) return;
    
    TourAnalyticsManager.start(tourConfig.id, activePersona, tourConfig.steps.length);
    onTourStart?.(tourConfig.id);
  }, [tourConfig, activePersona, onTourStart]);

  const handleTourClose = useCallback(() => {
    if (!tourConfig) return;
    
    TourStorage.set(storageKey, { seen: true, timestamp: Date.now() });
    TourAnalyticsManager.abandon(tourConfig.id);
    onTourAbandon?.(tourConfig.id);
  }, [tourConfig, storageKey, onTourAbandon]);

  const handleTourComplete = useCallback(() => {
    if (!tourConfig) return;
    
    TourStorage.set(storageKey, { seen: true, completed: true, timestamp: Date.now() });
    TourAnalyticsManager.complete(tourConfig.id);
    onTourComplete?.(tourConfig.id);
  }, [tourConfig, storageKey, onTourComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ? to open tour
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        handleTourOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTourOpen]);

  if (!mounted || !tourConfig) return null;

  return (
    <TourProvider
      steps={tourConfig.steps}
      disableInteraction={false}
      scrollSmooth
      padding={8}
      afterOpen={handleTourOpen}
      beforeClose={handleTourClose}
      onClickClose={({ setIsOpen }) => {
        TourStorage.set(storageKey, { seen: true, timestamp: Date.now() });
        setIsOpen(false);
      }}
      onClickMask={({ setIsOpen, steps, currentStep }) => {
        // Complete on last step
        if (steps && currentStep === steps.length - 1) {
          handleTourComplete();
          TourStorage.set(storageKey, { seen: true, completed: true, timestamp: Date.now() });
        }
        setIsOpen(false);
      }}
      styles={{
        maskArea: (base) => ({
          ...base,
          rx: 12,
        }),
        popover: (base) => ({
          ...base,
          borderRadius: 16,
          maxWidth: 400,
          padding: 20,
          backgroundColor: "#fff",
          color: "#111",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.05)",
        }),
        close: (base) => ({
          ...base,
          right: 10,
          top: 10,
          backgroundColor: "#f5f5f5",
          borderRadius: "50%",
          width: 32,
          height: 32,
          color: "#666",
          "&:hover": {
            backgroundColor: "#e5e5e5",
          },
        }),
        badge: (base) => ({ ...base, display: "none" }),
        dot: (base, { current }) => ({
          ...base,
          backgroundColor: current ? "#3b82f6" : "#d1d5db",
          width: 8,
          height: 8,
        }),
      }}
      showCloseButton
      showNavigation
    >
      <AutoStartTour tourConfig={tourConfig} storageKey={storageKey} />
      <TourControls />
      <TourHelpButton />
    </TourProvider>
  );
}

/**
 * Hook to manually control tour
 */
export function useTourControls() {
  const { setIsOpen, isOpen, currentStep, setCurrentStep, steps } = useTour();
  const pathname = usePathname() || "/";
  const [persona, setPersona] = useState<TourPersona>("client");

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const restartTour = useCallback(() => {
    import("./definitions").then(({ getTourConfigs }) => {
      const tourConfig = getTourConfigs(persona, pathname);
      if (tourConfig) {
        TourStorage.remove(TourStorage.getKey("seen", tourConfig.id, "2.0"));
        setCurrentStep(0);
        setIsOpen(true);
      }
    });
  }, [persona, pathname, setIsOpen, setCurrentStep]);

  const nextStep = useCallback(() => {
    if (steps && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [steps, currentStep, setCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  return {
    startTour,
    closeTour,
    restartTour,
    nextStep,
    prevStep,
    isOpen,
    currentStep: currentStep ?? 0,
    totalSteps: steps?.length ?? 0,
  };
}

