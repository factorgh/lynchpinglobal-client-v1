import type { StepType } from "@reactour/tour";

export type TourPersona = "client" | "admin";

// Helper to center text on screen when needed
const center = (content: StepType["content"]): StepType => ({
  selector: "body",
  content,
  position: "center",
});

// -------- CLIENT STEPS --------
const clientSteps: Record<string, StepType[]> = {
  "/": [center("Welcome to Lynchpin Global! Use Help anytime to restart the tour.")],
  "/login": [
    {
      selector: '[data-tour="login-email"]',
      content: "🔑 Enter your email or username to sign in",
    },
    {
      selector: '[data-tour="login-submit"]',
      content: "Click to access your dashboard",
    },
  ],
  "/register": [
    {
      selector: '[data-tour="register-form"]',
      content: "📝 Create your account to get started",
    },
  ],
  "/dashboard": [
    {
      selector: '[data-tour="portfolio-summary"]',
      content: "📊 Overview: Assets under management, clients, payments, and loans",
    },
    {
      selector: '[data-tour="statistics"]',
      content: "📈 View detailed performance analytics and trends",
    },
  ],
  "/portfolio": [
    {
      selector: '[data-tour="positions-table"]',
      content: "💼 Track your investment holdings and accrued returns",
    },
  ],
  "/wealth": [
    {
      selector: '[data-tour="wealth-new"]',
      content: "➕ Create new investment entries with principal, add-ons, and rates",
    },
    {
      selector: '[data-tour="wealth-table"]',
      content: "📋 Manage and track all your investment entries",
    },
  ],
  "/rentals": [
    {
      selector: '[data-tour="loan-list"]',
      content: "💰 View and manage active loans with due dates and payments",
    },
    {
      selector: '[data-tour="rental-list"]',
      content: "🏠 Manage rental agreements and asset returns",
    },
  ],
  "/cashout": [
    {
      selector: '[data-tour="cashout-new-payment"]',
      content: "💸 Create profit payments to investors",
    },
    {
      selector: '[data-tour="payment-table"]',
      content: "📜 Review payment history and withdrawal requests",
    },
  ],
  "/withdrawal": [
    {
      selector: '[data-tour="withdrawal-new-request"]',
      content: "🏦 Request capital withdrawals from your investments",
    },
  ],
  "/activity": [
    {
      selector: '[data-tour="activity-table"]',
      content: "📝 View your complete activity log and transaction history",
    },
  ],
  "/landing": [
    {
      selector: '[data-tour="cta-primary"]',
      content: "💰 Your total balance and key financial metrics",
    },
    {
      selector: '[data-tour="feature-cards"]',
      content: "📊 Breakdown: Principal, accrued interest, add-ons, and returns",
    },
  ],
  "/forgot-password": [
    { selector: "body", content: "🔐 Recover your account via email" },
  ],
  "/reset-password": [
    { selector: "body", content: "🔑 Reset your password and continue" },
  ],
};

// -------- ADMIN STEPS --------
const adminSteps: Record<string, StepType[]> = {
  "/dashboard": [
    {
      selector: '[data-tour="portfolio-summary"]',
      content: "📊 Monitor: Assets under management, active clients, and outstanding payments",
    },
    {
      selector: '[data-tour="statistics"]',
      content: "📈 View performance analytics and business metrics",
    },
  ],
  "/users": [
    {
      selector: '[data-tour="users-table"]',
      content: "👥 Manage all users: clients, admins, and their roles",
    },
  ],
  "/users/change-password": [
    {
      selector: '[data-tour="new-password"]',
      content: "🔒 Update your password - use a strong, secure password",
    },
  ],
  "/wealth": [
    {
      selector: '[data-tour="wealth-new"]',
      content: "💼 Create investment entries: Set principal, rates, and track ownership",
    },
    {
      selector: '[data-tour="wealth-table"]',
      content: "📋 Manage all investments with add-ons, one-offs, and returns",
    },
  ],
  "/assets": [
    {
      selector: '[data-tour="asset-form"]',
      content: "🏢 Add assets: Define class, value, designation, and documents",
    },
    {
      selector: '[data-tour="asset-table"]',
      content: "📊 Track all assets under management with values and maturity",
    },
  ],
  "/rentals": [
    {
      selector: '[data-tour="loan-list"]',
      content: "💵 Manage loans: Track amounts, rates, due dates, and overdue fees",
    },
    {
      selector: '[data-tour="rental-list"]',
      content: "🏠 Manage rentals: Asset classes, returns, and agreements",
    },
  ],
  "/cashout": [
    {
      selector: '[data-tour="cashout-new-payment"]',
      content: "💸 Process profit payments to investors",
    },
    {
      selector: '[data-tour="payment-table"]',
      content: "📜 Review all payments and withdrawal requests",
    },
  ],
  "/activity": [
    {
      selector: '[data-tour="activity-table"]',
      content: "📝 Monitor complete system activity and audit logs",
    },
  ],
  "/notifications": [
    {
      selector: '[data-tour="notifications"]',
      content: "🔔 Send announcements to all users or specific groups",
    },
  ],
};

export function getSteps(persona: TourPersona, route: string): StepType[] {
  const maps: Record<TourPersona, Record<string, StepType[]>> = {
    client: clientSteps,
    admin: adminSteps,
  };
  const table = maps[persona];
  // 1) Exact match in persona table
  if (table[route]) return table[route];
  // 2) Exact match in client table
  if (clientSteps[route]) return clientSteps[route];
  // 3) Prefix match (handles dynamic routes like /reset-password/[token])
  const personaPrefix = Object.keys(table).find(
    (k) => route === k || route.startsWith(k + "/")
  );
  if (personaPrefix) return table[personaPrefix];
  const clientPrefix = Object.keys(clientSteps).find(
    (k) => route === k || route.startsWith(k + "/")
  );
  if (clientPrefix) return clientSteps[clientPrefix];
  // 4) Fallback
  return [center("Welcome to this page.")];
}
