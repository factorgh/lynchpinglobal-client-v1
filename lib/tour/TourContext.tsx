"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type TourPersona = "client" | "admin";

interface TourState {
  isRunning: boolean;
  stepIndex: number;
  tourKey: string;
}

interface TourContextType {
  // State
  isRunning: boolean;
  stepIndex: number;
  persona: TourPersona;
  
  // Actions
  startTour: () => void;
  stopTour: () => void;
  restartTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  setPersona: (persona: TourPersona) => void;
  
  // Storage
  hasSeenTour: (key: string) => boolean;
  markTourSeen: (key: string) => void;
  resetAllTours: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const STORAGE_PREFIX = "lynchpin_tour_";

// Safe localStorage access
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
  clearPrefix: (prefix: string): void => {
    if (typeof window === "undefined") return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [persona, setPersona] = useState<TourPersona>("client");

  // Load persona from user role on mount
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "admin" || user.role === "superadmin") {
        setPersona("admin");
      } else {
        setPersona("client");
      }
    } catch {}
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const restartTour = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  const hasSeenTour = useCallback((key: string): boolean => {
    return storage.get(`${STORAGE_PREFIX}${key}`) === "seen";
  }, []);

  const markTourSeen = useCallback((key: string): void => {
    storage.set(`${STORAGE_PREFIX}${key}`, "seen");
  }, []);

  const resetAllTours = useCallback((): void => {
    storage.clearPrefix(STORAGE_PREFIX);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isRunning,
        stepIndex,
        persona,
        startTour,
        stopTour,
        restartTour,
        nextStep,
        prevStep,
        goToStep,
        setPersona,
        hasSeenTour,
        markTourSeen,
        resetAllTours,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within TourProvider");
  }
  return context;
};

