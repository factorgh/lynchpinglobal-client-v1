import type { DriveStep, Side } from "driver.js";

export type TourPersona = "client" | "admin";

// Helper to create steps with consistent structure
const step = (
  element: string,
  title: string,
  description: string,
  side: Side = "bottom"
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
    "Let's take a quick tour of your financial dashboard. You'll learn where everything is and how to navigate."
  ),
  step(
    '[data-tour="client-menu"]',
    "📍 Your Navigation Menu",
    "This is your main menu. Access your Dashboard, Portfolio, Withdrawals, and Terms & Conditions from here.",
    "right"
  ),
  step(
    '[data-tour="cta-primary"]',
    "💰 Total Balance",
    "Your complete portfolio value at a glance. This includes your principal, accrued interest, and all returns.",
    "bottom"
  ),
  step(
    '[data-tour="feature-cards"]',
    "📊 Investment Breakdown",
    "Here's a detailed breakdown: Principal investment amount, Accrued interest earned, Add-ons you've made, and Add-on interest.",
    "bottom"
  ),
  step(
    '[data-tour="yield-cards"]',
    "📈 Yields & Deductions",
    "Track your one-off yields, performance yields, management fees, and operational costs in this section.",
    "top"
  ),
  step(
    '[data-tour="assets-under"]',
    "🏢 Your Assets",
    "View all assets under management with their current values and status.",
    "top"
  ),
  step(
    '[data-tour="payments-list"]',
    "💸 Payment History",
    "Your recent payments and transactions are displayed here for easy tracking.",
    "top"
  ),
  welcome(
    "✅ You're All Set!",
    "That's your dashboard! Click 'My Portfolio' in the menu to see your detailed investments. You can restart this tour anytime using the Help button."
  ),
];

export const clientPortfolioSteps: DriveStep[] = [
  welcome(
    "📂 Your Investment Portfolio",
    "Welcome to your portfolio! Here you can view all your investments, loans, assets, and rentals in detail."
  ),
  step(
    '[data-tour="portfolio-tab-list"]',
    "📑 Portfolio Tabs",
    "Switch between different views: Wealth (investments), Loans, Assets, and Rentals.",
    "bottom"
  ),
  step(
    '[data-tour="positions-table"]',
    "💼 Your Investments",
    "This table shows all your investment positions with principal, rates, accrued returns, and document links.",
    "top"
  ),
  welcome(
    "💡 Quick Tip",
    "Click on any investment row to expand and see more details including documents and transaction history!"
  ),
];

export const clientWithdrawalSteps: DriveStep[] = [
  welcome(
    "🏦 Withdrawals & Payments",
    "Request capital withdrawals or profit payments from your investments here."
  ),
  step(
    '[data-tour="withdrawal-new-request"]',
    "📝 Make a Request",
    "Click this button to submit a new withdrawal or profit payment request to the admin team.",
    "left"
  ),
  step(
    '[data-tour="withdrawal-table"]',
    "📋 Request History",
    "Track all your withdrawal requests here. You can see the status (Pending, Approved, Processing, or Cancelled).",
    "top"
  ),
  welcome(
    "✅ That's It!",
    "Your requests will be reviewed by the admin team. Check back anytime to see the status!"
  ),
];

// ============================================================
// ADMIN TOUR STEPS
// ============================================================

export const adminDashboardSteps: DriveStep[] = [
  welcome(
    "👋 Welcome, Admin!",
    "Let's explore your management dashboard. You have full control over investments, assets, loans, and user accounts."
  ),
  step(
    '[data-tour="admin-menu"]',
    "📍 Admin Navigation",
    "Your complete admin toolkit: Dashboard, Wealth Management, Assets, Loans & Rentals, Cashouts, User Management, and Activity Logs.",
    "right"
  ),
  step(
    '[data-tour="portfolio-summary"]',
    "📊 Key Metrics",
    "At-a-glance overview: Total assets under management, active clients, outstanding payments, and total loans.",
    "bottom"
  ),
  step(
    '[data-tour="statistics"]',
    "📈 Analytics",
    "Performance charts and trends to help you track business growth and make informed decisions.",
    "top"
  ),
  welcome(
    "🚀 Let's Get Started!",
    "Head to 'Wealth' in the menu to manage client investments. You can restart this tour anytime!"
  ),
];

export const adminWealthSteps: DriveStep[] = [
  welcome(
    "💰 Wealth Management",
    "This is where you create and manage client investment portfolios. Let's see how it works."
  ),
  step(
    '[data-tour="wealth-header"]',
    "📋 Wealth Overview",
    "The Wealth Management dashboard shows all client investments at a glance.",
    "bottom"
  ),
  step(
    '[data-tour="wealth-new"]',
    "➕ Create Investment",
    "Click here to create a new investment. You can set principal, rates, co-owners, and upload documents.",
    "left"
  ),
  step(
    '[data-tour="wealth-table"]',
    "📊 Investment Table",
    "All investments are listed here. Click any row to expand and see details, add-ons, one-offs, and documents.",
    "top"
  ),
  welcome(
    "💡 Pro Tips",
    "• Daily cron jobs automatically calculate accrued returns<br>• You can add co-owners for joint investments<br>• Upload certificates, mandates, and other documents"
  ),
];

export const adminAssetSteps: DriveStep[] = [
  welcome(
    "🏢 Asset Management",
    "Track and manage all client assets including properties, vehicles, and other valuable items."
  ),
  step(
    '[data-tour="asset-form"]',
    "➕ Add New Asset",
    "Create new asset entries with class, value, designation, maturity dates, images, and supporting documents.",
    "left"
  ),
  step(
    '[data-tour="asset-table"]',
    "📊 Asset Portfolio",
    "View all assets with their values, accrued interest, status, and maturity information.",
    "top"
  ),
  welcome(
    "✅ Asset Tips",
    "Assets support joint ownership and quarterly tracking. Upload images and documents for each asset!"
  ),
];

export const adminRentalsSteps: DriveStep[] = [
  welcome(
    "💵 Loans & Rentals",
    "Manage client loans and asset rental agreements. Two sections in one powerful module."
  ),
  step(
    '[data-tour="rentals-tab-list"]',
    "📑 Two Sections",
    "Switch between Loan Management and Asset Rentals using these tabs.",
    "bottom"
  ),
  step(
    '[data-tour="loan-form"]',
    "➕ Create Loan",
    "Add new loans for existing clients. Set amount, rate, due date, and upload agreements.",
    "left"
  ),
  step(
    '[data-tour="loan-list"]',
    "📋 Loan Table",
    "Track all loans with amounts due, overdue days, and payment status. Overdue fees are calculated automatically!",
    "top"
  ),
  step(
    '[data-tour="rental-form"]',
    "➕ Create Rental",
    "Add rental agreements with asset class, return dates, and supporting documents.",
    "left"
  ),
  step(
    '[data-tour="rental-list"]',
    "📋 Rental Table",
    "Monitor all rentals with due amounts, return dates, and overdue status.",
    "top"
  ),
  welcome(
    "⚡ Automatic Processing",
    "Daily cron jobs automatically calculate overdue fees and update loan/rental statuses!"
  ),
];

export const adminCashoutSteps: DriveStep[] = [
  welcome(
    "💸 Cashouts & Withdrawals",
    "Process profit payments and manage client withdrawal requests."
  ),
  step(
    '[data-tour="cashout-tab-list"]',
    "📑 Payments & Withdrawals",
    "Two sections: Payments (outgoing to clients) and Withdrawals (client requests).",
    "bottom"
  ),
  step(
    '[data-tour="cashout-new-payment"]',
    "➕ New Payment",
    "Create profit payments to investors. Select user, enter amount, and set approval status.",
    "left"
  ),
  step(
    '[data-tour="payment-table"]',
    "📋 Payment History",
    "View all processed payments with dates, amounts, and status.",
    "top"
  ),
  welcome(
    "📥 Withdrawal Requests",
    "Switch to the Withdrawals tab to review and approve client withdrawal requests."
  ),
];

export const adminUsersSteps: DriveStep[] = [
  welcome(
    "👥 User Management",
    "Manage all clients and admin accounts from this central hub."
  ),
  step(
    '[data-tour="users-table"]',
    "📋 User Directory",
    "View all users with their usernames, unique license numbers, emails, and roles.",
    "top"
  ),
  step(
    '[data-tour="user-actions"]',
    "⚙️ User Actions",
    "Edit user details or remove accounts using the action buttons.",
    "left"
  ),
  welcome(
    "🔑 About Licenses",
    "Each user gets a unique license number (CL-XXXXXX) automatically on registration."
  ),
];

export const adminActivitySteps: DriveStep[] = [
  welcome(
    "📝 Activity Logs",
    "Monitor all system activities for transparency and auditing."
  ),
  step(
    '[data-tour="activity-filters"]',
    "🔍 Filter Activities",
    "Filter logs by time period: All time, Last 7 days, Last 14 days, or Last month.",
    "left"
  ),
  step(
    '[data-tour="activity-table"]',
    "📋 Activity Timeline",
    "Complete audit trail showing who did what and when. All major actions are logged automatically.",
    "top"
  ),
  welcome(
    "🔒 Audit Ready",
    "These logs provide full transparency for compliance and auditing purposes."
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
    "bottom"
  ),
  step(
    '[data-tour="login-password"]',
    "🔒 Password",
    "Enter your secure password. Use the 'Show' button to verify.",
    "bottom"
  ),
  step(
    '[data-tour="login-submit"]',
    "✅ Login",
    "Click to access your personalized dashboard.",
    "top"
  ),
  step(
    '[data-tour="login-forgot"]',
    "🔄 Change Password",
    "Need to update your password? Click here to change it securely.",
    "top"
  ),
];

// ============================================================
// GET STEPS BY ROUTE
// ============================================================

export function getTourSteps(persona: TourPersona, pathname: string): DriveStep[] {
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
