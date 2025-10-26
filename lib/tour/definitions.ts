import type { StepType } from "@reactour/tour";
import type { TourConfig } from "./config";
import React from "react";

/**
 * Tour Definitions
 * Centralized configuration for all tours
 */

// Helper for centered content
const centerContent = (title: string, description?: string): StepType => ({
  selector: "body",
  content: React.createElement(
    "div",
    null,
    React.createElement(
      "h3",
      { className: "text-lg font-bold mb-2" },
      title
    ),
    description &&
      React.createElement(
        "p",
        { className: "text-sm text-gray-600" },
        description
      )
  ),
  position: "center" as const,
  highlightedSelectors: [],
  mutationObservables: [],
});

// Helper for step with content
const step = (
  selector: string,
  title: string,
  description?: string,
  highlightedSelectors?: string[]
): StepType => ({
  selector,
  content: React.createElement(
    "div",
    null,
    React.createElement(
      "h3",
      { className: "text-base font-semibold mb-1" },
      title
    ),
    description &&
      React.createElement(
        "p",
        { className: "text-sm text-gray-600" },
        description
      )
  ),
  highlightedSelectors: highlightedSelectors || [],
  mutationObservables: [],
});

/**
 * TOUR DEFINITIONS
 */
export const TOUR_CONFIGS: TourConfig[] = [
  // ==================== DASHBOARD TOURS ====================
  {
    id: "dashboard_admin",
    persona: ["admin", "superadmin"],
    route: "/dashboard",
    title: "Admin Dashboard Overview",
    description: "Learn to monitor key business metrics and analytics",
    autoStart: true,
    skipIfCompleted: true,
    enabled: true,
    priority: 10,
    steps: [
      step(
        '[data-tour="portfolio-summary"]',
        "📊 Key Metrics Dashboard",
        "Monitor assets under management, active clients, outstanding payments, and loans in real-time"
      ),
      step(
        '[data-tour="statistics"]',
        "📈 Performance Analytics",
        "View detailed charts and trends to track business growth and performance"
      ),
    ],
  },
  {
    id: "dashboard_client",
    persona: ["client"],
    route: "/landing",
    title: "Your Financial Overview",
    description: "Track your investments and returns",
    autoStart: true,
    skipIfCompleted: true,
    enabled: true,
    priority: 10,
    steps: [
      step(
        '[data-tour="cta-primary"]',
        "💰 Total Balance",
        "Your complete portfolio value including principal and accrued returns"
      ),
      step(
        '[data-tour="feature-cards"]',
        "📊 Investment Breakdown",
        "View principal, accrued interest, add-ons, and add-on interest"
      ),
    ],
  },

  // ==================== WEALTH/INVESTMENT TOURS ====================
  {
    id: "wealth_admin",
    persona: ["admin", "superadmin"],
    route: "/wealth",
    title: "Investment Management",
    description: "Create and track investment entries for clients",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 8,
    steps: [
      step(
        '[data-tour="wealth-new"]',
        "➕ Create Investment",
        "Add new investment entries: Set principal amount, guaranteed rates, start date, and add joint owners"
      ),
      step(
        '[data-tour="wealth-table"]',
        "📋 Investment Portfolio",
        "Manage all investments: View details, edit entries, track accruals, and add add-ons or one-offs"
      ),
    ],
  },
  {
    id: "portfolio_client",
    persona: ["client"],
    route: "/portfolio",
    title: "Your Investment Portfolio",
    description: "View your investment positions and returns",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 9,
    steps: [
      step(
        '[data-tour="positions-table"]',
        "💼 Investment Holdings",
        "Track your investments: Principal, rates, accrued returns, and transaction history"
      ),
    ],
  },

  // ==================== ASSETS TOURS ====================
  {
    id: "assets_admin",
    persona: ["admin", "superadmin"],
    route: "/assets",
    title: "Asset Management",
    description: "Manage client assets and wealth",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 7,
    steps: [
      step(
        '[data-tour="asset-form"]',
        "🏢 Add Asset",
        "Define asset name, class, value, designation, and upload supporting documents"
      ),
      step(
        '[data-tour="asset-table"]',
        "📊 Asset Portfolio",
        "Track all assets with values, maturity dates, accrued interest, and documentation"
      ),
    ],
  },

  // ==================== LOANS & RENTALS TOURS ====================
  {
    id: "rentals_admin",
    persona: ["admin", "superadmin"],
    route: "/rentals",
    title: "Loans & Rentals Management",
    description: "Handle client loans and rental agreements",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 6,
    steps: [
      step(
        '[data-tour="loan-list"]',
        "💵 Loans Dashboard",
        "Manage loans: Track amounts, interest rates, due dates, overdue fees, and payment status"
      ),
      step(
        '[data-tour="rental-list"]',
        "🏠 Rentals Management",
        "Handle rental agreements: Asset classes, return dates, designations, and agreements"
      ),
    ],
  },

  // ==================== PAYMENTS TOURS ====================
  {
    id: "cashout_admin",
    persona: ["admin", "superadmin"],
    route: "/cashout",
    title: "Payment Processing",
    description: "Process profit payments and handle withdrawals",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 5,
    steps: [
      step(
        '[data-tour="cashout-new-payment"]',
        "💸 Create Payment",
        "Process profit payments: Select user, set amount, request date, and approve status"
      ),
      step(
        '[data-tour="payment-table"]',
        "📜 Payment History",
        "Review all payments and track withdrawal requests for investors"
      ),
    ],
  },
  {
    id: "withdrawal_client",
    persona: ["client"],
    route: "/withdrawal",
    title: "Request Withdrawal",
    description: "Withdraw capital from your investments",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 4,
    steps: [
      step(
        '[data-tour="withdrawal-new-request"]',
        "🏦 Capital Withdrawal",
        "Request to withdraw capital from your investment portfolio"
      ),
    ],
  },

  // ==================== ACTIVITY TOURS ====================
  {
    id: "activity_admin",
    persona: ["admin", "superadmin"],
    route: "/activity",
    title: "System Activity Logs",
    description: "Monitor system-wide activity and audit trails",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 3,
    steps: [
      step(
        '[data-tour="activity-table"]',
        "📝 Activity Log",
        "View complete audit trail: User actions, system events, and transaction history"
      ),
    ],
  },

  // ==================== USER MANAGEMENT TOURS ====================
  {
    id: "users_admin",
    persona: ["admin", "superadmin"],
    route: "/users",
    title: "User Management",
    description: "Manage clients and admin accounts",
    autoStart: false,
    skipIfCompleted: false,
    enabled: true,
    priority: 8,
    steps: [
      step(
        '[data-tour="users-table"]',
        "👥 User Directory",
        "Manage all users: View clients and admins, edit roles, and account details"
      ),
    ],
  },

  // ==================== AUTH TOURS ====================
  {
    id: "login_all",
    persona: ["client", "admin", "superadmin"],
    route: "/login",
    title: "Sign In",
    description: "Access your account",
    autoStart: false,
    skipIfCompleted: true,
    enabled: true,
    priority: 1,
    steps: [
      step(
        '[data-tour="login-email"]',
        "🔑 Sign In",
        "Enter your email or username to access your dashboard"
      ),
    ],
  },
];

/**
 * Get tour configs for a specific persona and route
 */
export function getTourConfigs(
  persona: string,
  route: string
): TourConfig | null {
  const personaList = [persona as any, "admin", "client"]; // Include fallbacks
  
  // Find exact route match first
  const exactMatch = TOUR_CONFIGS.find(
    config =>
      personaList.includes(config.persona[0]) &&
      config.route === route &&
      config.enabled
  );
  
  if (exactMatch) return exactMatch;

  // Try route matching (for dynamic routes)
  const patternMatch = TOUR_CONFIGS.find(config => {
    const matchesPersona = personaList.some(p => config.persona.includes(p as any));
    if (!matchesPersona || !config.enabled) return false;
    
    if (config.route instanceof RegExp) {
      return config.route.test(route);
    }
    
    // Partial match for nested routes
    if (typeof config.route === "string") {
      return route.startsWith(config.route) || config.route.startsWith(route);
    }
    
    return false;
  });

  return patternMatch || null;
}

/**
 * Get all enabled tours for a persona
 */
export function getToursForPersona(persona: string): TourConfig[] {
  return TOUR_CONFIGS.filter(
    config =>
      config.persona.includes(persona as any) &&
      config.enabled &&
      (config.persona.includes("admin") || config.persona.includes("client"))
  ).sort((a, b) => b.priority - a.priority);
}

