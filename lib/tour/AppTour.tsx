"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { driver, DriveStep, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { usePathname } from "next/navigation";
import { getTourSteps, getTourKey, TourPersona } from "./tourSteps";

// Storage helpers
const storage = {
  get: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

interface AppTourProps {
  persona?: TourPersona;
  autoStart?: boolean;
}

const AppTour: React.FC<AppTourProps> = ({ persona: propPersona, autoStart = true }) => {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  const [persona, setPersona] = useState<TourPersona>("client");
  const [tourKey, setTourKey] = useState("");
  const driverRef = useRef<Driver | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Get persona from localStorage user
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userPersona: TourPersona =
        user.role === "admin" || user.role === "superadmin" ? "admin" : "client";
      setPersona(propPersona || userPersona);
    } catch {
      setPersona(propPersona || "client");
    }

    // Cleanup on unmount
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [propPersona]);

  // Initialize driver and start tour when route changes
  useEffect(() => {
    if (!mounted) return;

    const activePersona = propPersona || persona;
    const steps = getTourSteps(activePersona, pathname);
    const newTourKey = getTourKey(activePersona, pathname);
    setTourKey(newTourKey);

    if (steps.length === 0) return;

    // Create driver instance
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: "lynchpin-tour-popover",
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish ✓",
      onDestroyStarted: () => {
        storage.set(`tour_${newTourKey}`, "seen");
        driverInstance.destroy();
      },
      steps: steps,
    });

    driverRef.current = driverInstance;

    // Auto-start if not seen
    if (autoStart) {
      const hasSeen = storage.get(`tour_${newTourKey}`);
      if (!hasSeen) {
        // Wait for DOM to be ready
        const timer = setTimeout(() => {
          const firstStep = steps[0];
          const targetExists =
            firstStep.element === "body" ||
            firstStep.element === undefined ||
            document.querySelector(firstStep.element as string);

          if (targetExists) {
            driverInstance.drive();
          } else {
            // Keep checking for element
            let attempts = 0;
            const checkInterval = setInterval(() => {
              attempts++;
              if (document.querySelector(firstStep.element as string) || attempts > 15) {
                clearInterval(checkInterval);
                if (attempts <= 15) {
                  driverInstance.drive();
                }
              }
            }, 300);
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [mounted, pathname, persona, propPersona, autoStart]);

  // Manual start tour
  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.drive();
    }
  }, []);

  // Restart tour (clear storage and start)
  const restartTour = useCallback(() => {
    storage.remove(`tour_${tourKey}`);
    if (driverRef.current) {
      driverRef.current.drive();
    }
  }, [tourKey]);

  if (!mounted) return null;

  return (
    <>
      {/* Custom CSS for driver.js */}
      <style jsx global>{`
        .driver-popover {
          background: #ffffff !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 
                      0 0 0 1px rgba(0, 0, 0, 0.05) !important;
          padding: 20px 24px !important;
          max-width: 400px !important;
        }

        .driver-popover-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin-bottom: 8px !important;
          line-height: 1.4 !important;
        }

        .driver-popover-description {
          font-size: 15px !important;
          color: #4b5563 !important;
          line-height: 1.7 !important;
          margin-bottom: 16px !important;
        }

        .driver-popover-progress-text {
          font-size: 12px !important;
          color: #9ca3af !important;
          margin-bottom: 12px !important;
        }

        .driver-popover-navigation-btns {
          display: flex !important;
          gap: 8px !important;
          justify-content: flex-end !important;
        }

        .driver-popover-prev-btn {
          background: transparent !important;
          color: #6b7280 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .driver-popover-prev-btn:hover {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }

        .driver-popover-next-btn,
        .driver-popover-done-btn {
          background: #3b82f6 !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 10px 20px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .driver-popover-next-btn:hover,
        .driver-popover-done-btn:hover {
          background: #2563eb !important;
        }

        .driver-popover-close-btn {
          color: #9ca3af !important;
          width: 28px !important;
          height: 28px !important;
          top: 12px !important;
          right: 12px !important;
        }

        .driver-popover-close-btn:hover {
          color: #6b7280 !important;
        }

        .driver-popover-arrow {
          border: 8px solid transparent !important;
        }

        .driver-popover-arrow-side-left {
          border-right-color: #ffffff !important;
        }

        .driver-popover-arrow-side-right {
          border-left-color: #ffffff !important;
        }

        .driver-popover-arrow-side-top {
          border-bottom-color: #ffffff !important;
        }

        .driver-popover-arrow-side-bottom {
          border-top-color: #ffffff !important;
        }

        .driver-overlay {
          background: rgba(0, 0, 0, 0.6) !important;
        }

        .driver-active-element {
          border-radius: 8px !important;
        }
      `}</style>

      {/* Floating Help Button */}
      <TourFloatingButton onStart={startTour} onRestart={restartTour} />
    </>
  );
};

// Floating Help/Restart Button Component
interface TourFloatingButtonProps {
  onStart: () => void;
  onRestart: () => void;
}

const TourFloatingButton: React.FC<TourFloatingButtonProps> = ({ onStart, onRestart }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Expanded menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 min-w-[160px]">
          <button
            onClick={() => {
              onStart();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <span className="text-lg">▶️</span>
            Start Tour
          </button>
          <button
            onClick={() => {
              onRestart();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <span className="text-lg">🔄</span>
            Restart Tour
          </button>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          ${isOpen 
            ? "bg-gray-800 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
        aria-label="Tour Help"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AppTour;
