import type { StepType } from "@reactour/tour";

/**
 * Tour Configuration
 * Enterprise-grade tour system with rich features
 */

export type TourPersona = "client" | "admin" | "superadmin";

export interface TourConfig {
  id: string;
  persona: TourPersona[];
  route: string | RegExp;
  title: string;
  description?: string;
  steps: StepType[];
  enabled: boolean;
  autoStart: boolean;
  skipIfCompleted: boolean;
  priority: number; // 1-10, higher = show first
  metadata?: Record<string, any>;
}

/**
 * Tour analytics and progress tracking
 */
export interface TourAnalytics {
  tourId: string;
  persona: TourPersona;
  startedAt: number;
  completedAt?: number;
  abandonedAt?: number;
  stepsCompleted: number;
  totalSteps: number;
  currentStep: number;
  skipped: boolean;
}

/**
 * Storage utilities with enhanced features
 */
export class TourStorage {
  private static prefix = "lynchpin_tour_";
  
  static getKey(type: string, ...parts: string[]): string {
    return `${this.prefix}${type}_${parts.join("_")}`;
  }

  static set(key: string, value: any): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("TourStorage: Failed to set", key, e);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn("TourStorage: Failed to get", key, e);
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("TourStorage: Failed to remove", key, e);
    }
  }

  static clear(pattern?: string): void {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix) && (!pattern || key.includes(pattern))) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("TourStorage: Failed to clear", e);
    }
  }

  static getAll<T>(): Array<{ key: string; value: T }> {
    if (typeof window === "undefined") return [];
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      return keys.map(key => ({
        key,
        value: this.get<T>(key)
      })).filter(item => item.value !== null) as Array<{ key: string; value: T }>;
    } catch (e) {
      return [];
    }
  }
}

/**
 * Tour analytics tracking
 */
export class TourAnalyticsManager {
  private static analytics: Map<string, TourAnalytics> = new Map();

  static start(tourId: string, persona: TourPersona, totalSteps: number): void {
    const analytics: TourAnalytics = {
      tourId,
      persona,
      startedAt: Date.now(),
      stepsCompleted: 0,
      totalSteps,
      currentStep: 0,
      skipped: false,
    };
    
    this.analytics.set(tourId, analytics);
    TourStorage.set(`analytics_${tourId}`, analytics);
    
    // Track in analytics service if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "tour_started", {
        tour_id: tourId,
        persona: persona,
      });
    }
  }

  static progress(tourId: string, currentStep: number, stepsCompleted: number): void {
    const analytics = this.analytics.get(tourId);
    if (analytics) {
      analytics.currentStep = currentStep;
      analytics.stepsCompleted = stepsCompleted;
      TourStorage.set(`analytics_${tourId}`, analytics);
    }
  }

  static complete(tourId: string): void {
    const analytics = this.analytics.get(tourId);
    if (analytics) {
      analytics.completedAt = Date.now();
      TourStorage.set(`analytics_${tourId}`, analytics);
      
      // Track completion
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "tour_completed", {
          tour_id: tourId,
          persona: analytics.persona,
          duration: analytics.completedAt - analytics.startedAt,
          steps_completed: analytics.stepsCompleted,
        });
      }
    }
  }

  static abandon(tourId: string): void {
    const analytics = this.analytics.get(tourId);
    if (analytics) {
      analytics.abandonedAt = Date.now();
      TourStorage.set(`analytics_${tourId}`, analytics);
      
      // Track abandonment
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "tour_abandoned", {
          tour_id: tourId,
          persona: analytics.persona,
          steps_completed: analytics.stepsCompleted,
          current_step: analytics.currentStep,
        });
      }
    }
  }

  static get(tourId: string): TourAnalytics | undefined {
    return this.analytics.get(tourId) || TourStorage.get<TourAnalytics>(`analytics_${tourId}`);
  }

  static getAll(): TourAnalytics[] {
    return Array.from(this.analytics.values());
  }
}

