import type { DriveStep, Side } from "driver.js";

export type TourPersona = "client" | "admin";

// Helper to create steps with consistent structure
const step = (
  element: string,
  title: string,
  description: string,
  side: Side = "bottom",
): DriveStep => ({
  element,
  popover: {
    title,
    description,
    side,
    align: "center",
  },
});

// Welcome step (no element, centered)
const welcome = (title: string, description: string): DriveStep => ({
  popover: {
    title,
    description,
  },
});

// ============================================================
// CLIENT TOUR STEPS
// ============================================================

export const clientLandingSteps: DriveStep[] = [
  welcome(
    "👋 Welcome to Lynchpin Global!",
    "Let's take a quick tour of your financial dashboard. You'll learn where everything is and how to navigate.",
  ),
  step(
    '[data-tour="client-menu"]',
    "📍 Your Navigation Menu",
    "This is your main menu. Access your Dashboard, Mandates, Disbursements, and Terms & Conditions from here.",
    "right"
  ),
  step(
    '[data-tour="cta-primary"]',
    "💰 Total Balance",
    "Your complete mandate value at a glance. This includes your mandate contribution, accrued disbursements, and all transactions.",
    "bottom"
  ),
  step(
    '[data-tour="feature-cards"]',
    "📊 Mandate Breakdown",
    "Here's a detailed breakdown: Mandate Contribution, Accrued Disbursements, Additional Contributions, and Additional Disbursements.",
    "bottom"
  ),
  step(
    '[data-tour="yield-cards"]',
    "📈 Disbursements & Charges",
    "Track one-off disbursements, performance-linked disbursements, service fees, and operational charges in this section.",
    "top"
  ),
  step(
    '[data-tour="assets-under"]',
    "🏢 Active Mandates",
    "View all active mandates and associated transactions with their current status.",
    "top"
  ),
  step(
    '[data-tour="payments-list"]',
    "💸 Disbursement History",
    "Your recent mandate contributions and disbursements are displayed here for easy tracking.",
    "top"
  ),
  welcome(
    "✅ You're All Set!",
    "That's your dashboard! Click 'My Mandates' in the menu to see your detailed mandate participations. You can restart this tour anytime using the Help button."
  ),
];

export const clientPortfolioSteps: DriveStep[] = [
  welcome(
    "📂 Mandate Participation",
    "Welcome to your mandate overview! Here you can view all mandate participations, lending transactions, asset-related engagements, and rental engagements in detail."
  ),
  step(
    '[data-tour="portfolio-tab-list"]',
    "📑 Mandate Tabs",
    "Switch between different views: Mandates, Loans, Asset Transactions, and Rentals.",
    "bottom"
  ),
  step(
    '[data-tour="positions-table"]',
    "💼 Your Mandates",
    "This table shows all mandate participations including contribution amount, contractual terms, accrued disbursements, and related documentation.",
    "top"
  ),
  welcome(
    "💡 Quick Tip",
    "Click on any mandate entry to expand and view additional details, documentation, and transaction history!"
  ),
];

export const clientWithdrawalSteps: DriveStep[] = [
  welcome(
    "🏦 Contributions & Disbursements",
    "Request mandate contributions or disbursements linked to your active mandate participations here."
  ),
  step(
    '[data-tour="withdrawal-new-request"]',
    "📝 Make a Request",
    "Click this button to submit a new contribution or disbursement request to the admin team.",
    "left"
  ),
  step(
    '[data-tour="withdrawal-table"]',
    "📋 Request History",
    "Track all your requests here. You can see the status (Pending, Approved, Processing, or Cancelled).",
    "top"
  ),
  welcome(
    "✅ That's It!",
    "Your requests will be reviewed by the admin team. Check back anytime to see the status!",
  ),
];

// ============================================================
// ADMIN TOUR STEPS
// ============================================================

export const adminDashboardSteps: DriveStep[] = [
  welcome(
    "👋 Welcome, Admin!",
    "Let's explore your management dashboard. You have full control over mandates, assets, loans, and user accounts."
  ),
  step(
    '[data-tour="admin-menu"]',
    "📍 Admin Navigation",
    "Your complete admin toolkit: Dashboard, Mandate Management, Assets, Loans & Rentals, Disbursements, User Management, and Activity Logs.",
    "right"
  ),
  step(
    '[data-tour="portfolio-summary"]',
    "📊 Key Metrics",
    "At-a-glance overview: Total active mandates, active clients, outstanding disbursements, and total loans.",
    "bottom"
  ),
  step(
    '[data-tour="statistics"]',
    "📈 Analytics",
    "Performance charts and trends to help you track business growth and make informed decisions.",
    "top",
  ),
  welcome(
    "🚀 Let's Get Started!",
    "Head to 'Mandates' in the menu to manage client mandate participations. You can restart this tour anytime!"
  ),
];

export const adminWealthSteps: DriveStep[] = [
  welcome(
    "💰 Mandate Management",
    "This is where you create and manage client mandate participations. Let's see how it works."
  ),
  step(
    '[data-tour="wealth-header"]',
    "📋 Mandate Overview",
    "The Mandate Management dashboard shows all client mandate participations at a glance.",
    "bottom"
  ),
  step(
    '[data-tour="wealth-new"]',
    "➕ Create Mandate",
    "Click here to create a new mandate. You can set mandate contribution, contractual terms, co owners, and upload documents.",
    "left"
  ),
  step(
    '[data-tour="wealth-table"]',
    "📊 Mandate Table",
    "All mandates are listed here. Click any row to expand and see details, add ons, one offs, and documents.",
    "top"
  ),
  welcome(
    "💡 Pro Tips",
    "• Daily cron jobs automatically calculate accrued disbursements<br>• You can add co owners for joint mandates<br>• Upload certificates, mandates, and other documents"
  ),
];

export const adminAssetSteps: DriveStep[] = [
  welcome(
    "🏢 Asset Management",
    "Track and manage all client assets including properties, vehicles, and other valuable items.",
  ),
  step(
    '[data-tour="asset-form"]',
    "➕ Add New Asset",
    "Create new asset entries with class, value, designation, maturity dates, images, and supporting documents.",
    "left",
  ),
  step(
    '[data-tour="asset-table"]',
    "📊 Asset Transactions",
    "View all assets with their values, accrued disbursements, status, and maturity information.",
    "top"
  ),
  welcome(
    "✅ Asset Tips",
    "Assets support joint ownership and quarterly tracking. Upload images and documents for each asset!",
  ),
];

export const adminRentalsSteps: DriveStep[] = [
  welcome(
    "💵 Loans & Rentals",
    "Manage client loans and asset rental agreements. Two sections in one powerful module.",
  ),
  step(
    '[data-tour="rentals-tab-list"]',
    "📑 Two Sections",
    "Switch between Loan Management and Asset Rentals using these tabs.",
    "bottom",
  ),
  step(
    '[data-tour="loan-form"]',
    "➕ Create Loan",
    "Add new loans for existing clients. Set amount, rate, due date, and upload agreements.",
    "left",
  ),
  step(
    '[data-tour="loan-list"]',
    "📋 Loan Table",
    "Track all loans with amounts due, overdue days, and payment status. Overdue fees are calculated automatically!",
    "top",
  ),
  step(
    '[data-tour="rental-form"]',
    "➕ Create Rental",
    "Add rental agreements with asset class, return dates, and supporting documents.",
    "left",
  ),
  step(
    '[data-tour="rental-list"]',
    "📋 Rental Table",
    "Monitor all rentals with due amounts, return dates, and overdue status.",
    "top",
  ),
  welcome(
    "⚡ Automatic Processing",
    "Daily cron jobs automatically calculate overdue fees and update loan/rental statuses!",
  ),
];

export const adminCashoutSteps: DriveStep[] = [
  welcome(
    "💸 Disbursements",
    "Process disbursements and manage client disbursement requests."
  ),
  step(
    '[data-tour="cashout-tab-list"]',
    "📑 Disbursements",
    "Two sections: Disbursements (outgoing to clients) and Requests (client-initiated).",
    "bottom"
  ),
  step(
    '[data-tour="cashout-new-payment"]',
    "➕ New Disbursement",
    "Create disbursements to mandate participants. Select user, enter amount, and set approval status.",
    "left"
  ),
  step(
    '[data-tour="payment-table"]',
    "📋 Disbursement History",
    "View all processed disbursements with dates, amounts, and status.",
    "top"
  ),
  welcome(
    "📥 Disbursement Requests",
    "Switch to the Requests tab to review and approve client disbursement requests."
  ),
];

export const adminUsersSteps: DriveStep[] = [
  welcome(
    "👥 User Management",
    "Manage all clients and admin accounts from this central hub.",
  ),
  step(
    '[data-tour="users-table"]',
    "📋 User Directory",
    "View all users with their usernames, unique license numbers, emails, and roles.",
    "top",
  ),
  step(
    '[data-tour="user-actions"]',
    "⚙️ User Actions",
    "Edit user details or remove accounts using the action buttons.",
    "left",
  ),
  welcome(
    "🔑 About Licenses",
    "Each user gets a unique license number (CL-XXXXXX) automatically on registration.",
  ),
];

export const adminActivitySteps: DriveStep[] = [
  welcome(
    "📝 Activity Logs",
    "Monitor all system activities for transparency and auditing.",
  ),
  step(
    '[data-tour="activity-filters"]',
    "🔍 Filter Activities",
    "Filter logs by time period: All time, Last 7 days, Last 14 days, or Last month.",
    "left",
  ),
  step(
    '[data-tour="activity-table"]',
    "📋 Activity Timeline",
    "Complete audit trail showing who did what and when. All major actions are logged automatically.",
    "top",
  ),
  welcome(
    "🔒 Audit Ready",
    "These logs provide full transparency for compliance and auditing purposes.",
  ),
];

// ============================================================
// LOGIN STEPS (shared)
// ============================================================

export const loginSteps: DriveStep[] = [
  step(
    '[data-tour="login-email"]',
    "🔑 Sign In",
    "Enter your email address or username to access your account.",
    "bottom",
  ),
  step(
    '[data-tour="login-password"]',
    "🔒 Password",
    "Enter your secure password. Use the 'Show' button to verify.",
    "bottom",
  ),
  step(
    '[data-tour="login-submit"]',
    "✅ Login",
    "Click to access your personalized dashboard.",
    "top",
  ),
  step(
    '[data-tour="login-forgot"]',
    "🔄 Change Password",
    "Need to update your password? Click here to change it securely.",
    "top",
  ),
];

// ============================================================
// GET STEPS BY ROUTE
// ============================================================

export function getTourSteps(
  persona: TourPersona,
  pathname: string,
): DriveStep[] {
  // Client routes
  if (persona === "client") {
    if (pathname === "/landing" || pathname === "/") {
      return clientLandingSteps;
    }
    if (pathname === "/portfolio") {
      return clientPortfolioSteps;
    }
    if (pathname === "/withdrawal") {
      return clientWithdrawalSteps;
    }
  }

  // Admin routes
  if (persona === "admin") {
    if (pathname === "/dashboard") {
      return adminDashboardSteps;
    }
    if (pathname === "/wealth") {
      return adminWealthSteps;
    }
    if (pathname === "/assets") {
      return adminAssetSteps;
    }
    if (pathname === "/rentals") {
      return adminRentalsSteps;
    }
    if (pathname === "/cashout") {
      return adminCashoutSteps;
    }
    if (pathname === "/users") {
      return adminUsersSteps;
    }
    if (pathname === "/activity") {
      return adminActivitySteps;
    }
  }

  // Shared routes
  if (pathname === "/login") {
    return loginSteps;
  }

  return [];
}

// Get tour key for storage
export function getTourKey(persona: TourPersona, pathname: string): string {
  return `${persona}_${pathname.replace(/\//g, "_") || "home"}_v2`;
}
