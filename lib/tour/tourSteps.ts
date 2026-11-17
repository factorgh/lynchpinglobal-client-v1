import type { DriveStep, Side } from "driver.js";

export type TourPersona = "client" | "admin";

// Fired on window when a page tour ends (finished, closed, or unable to start).
export const TOUR_FINISHED_EVENT = "lynchpin:tour-finished";
export const START_TOUR_EVENT = "lynchpin:start-tour";

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
    "This is your client dashboard. It shows only your mandate figures, reports and documents — nothing belonging to another client.",
  ),
  step(
    '[data-tour="client-menu"]',
    "📍 Your Navigation Menu",
    "Use this menu for Dashboard, My Mandates, Disbursements (withdrawal requests), My Documents and the LP Library.",
    "right"
  ),
  step(
    '[data-tour="cta-primary"]',
    "💰 Total Capital Allocation",
    "The current value of your active mandates: mandate contribution, additional contributions and accrued earnings, less the service fee and operational charges.",
    "right"
  ),
  step(
    '[data-tour="feature-cards"]',
    "📊 Mandate Breakdown",
    "Mandate Contribution is capital you placed. Accrued Earnings are contractual earnings to date. Additional Contributions are extra amounts added. Additional Earnings are earnings on those extras.",
    "bottom"
  ),
  step(
    '[data-tour="yield-cards"]',
    "📈 Performance & Charges",
    "Performance Bonus is extra yield for the quarter. Service Fee and Operational Charges are the deductions taken from your mandate.",
    "top"
  ),
  step(
    '[data-tour="assets-under"]',
    "📄 Quarterly Mandate Report",
    "Countdown to the current quarter close. After close, view and download your Quarterly Mandate Report here.",
    "top"
  ),
  step(
    '[data-tour="payments-list"]',
    "📊 Ledger Report",
    "Open the ledger the Lynchpin team attaches to your mandate. It shows your earnings and disbursements for the quarter.",
    "top"
  ),
  welcome(
    "✅ You're All Set!",
    "Open My Mandates to see each mandate and its documents. Restart this tour anytime with Want a Tour? in the menu. Questions? Email info@lynchpinglobal.com or call +233 30 700 0640."
  ),
];

export const clientPortfolioSteps: DriveStep[] = [
  welcome(
    "📂 My Mandates",
    "This page lists only the mandates assigned to you: contribution, contractual terms, accrued earnings and documents."
  ),
  step(
    '[data-tour="portfolio-tab-list"]',
    "📑 Mandate Tabs",
    "Mandates is your main tab. Loans, asset transactions and rentals appear only if they are assigned to you.",
    "bottom"
  ),
  step(
    '[data-tour="positions-table"]',
    "💼 Your Mandates",
    "Each row is one of your mandates, with contribution, contractual terms and accrued earnings.",
    "top"
  ),
  welcome(
    "💡 Mandate Documents",
    "Open a mandate to preview its documents in the same viewer used on the admin side, and attach supporting files if needed."
  ),
];

export const clientWithdrawalSteps: DriveStep[] = [
  welcome(
    "🏦 Disbursements",
    "Disbursements are withdrawals from your mandate. Request a payout or an additional contribution here."
  ),
  step(
    '[data-tour="withdrawal-new-request"]',
    "📝 Make a Request",
    "Send a contribution or disbursement request to the Lynchpin team.",
    "left"
  ),
  step(
    '[data-tour="withdrawal-table"]',
    "📋 Disbursement History",
    "Track each request: Pending, Approved, Processing, Rejected or Cancelled. Rejected or cancelled requests are never deducted from your mandate.",
    "top"
  ),
  welcome(
    "✅ That's It!",
    "The Lynchpin team reviews each request. Check back here for its status.",
  ),
];

export const clientDocumentsSteps: DriveStep[] = [
  welcome(
    "📁 My Documents",
    "Upload files for Lynchpin to review: signed agreements, ID, receipts and supporting records. Only your files appear here."
  ),
  step(
    '[data-tour="docs-upload"]',
    "⬆️ Submit a File",
    "Choose a document type, add an optional note, then drag in or browse for the file and submit it to admin.",
    "left"
  ),
  step(
    '[data-tour="docs-list"]',
    "📋 Your Submissions",
    "Every file you have sent to admin is listed here. You can preview, download or remove it.",
    "top"
  ),
  welcome(
    "✅ Documents",
    "Admin reviews these under Client Documents. Official Lynchpin PDFs are in LP Library, not on this page."
  ),
];

export const clientLibrarySteps: DriveStep[] = [
  welcome(
    "📚 LP Library",
    "This is the shared library of official Lynchpin terms and policy documents. It is not your personal file vault."
  ),
  step(
    '[data-tour="library-docs"]',
    "📄 Official Documents",
    "Select a published document to read it in the viewer. These are the same institutional papers for every client.",
    "bottom"
  ),
  step(
    '[data-tour="library-viewer"]',
    "👀 Document Viewer",
    "Read the selected PDF here, or open/download it from the buttons above.",
    "top"
  ),
  welcome(
    "✅ Library",
    "To send your own files to admin, use My Documents in the menu."
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
    "Your complete admin toolkit: Dashboard, Clients, Client Documents, Mandates, Quarterly Rollover, Asset Transactions, Loans & Rentals, Disbursements, User Management, Activity Log and the LP Library.",
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
    "All mandates are listed here. Click any row to expand and see details, add ons, and documents.",
    "top"
  ),
  welcome(
    "💡 Pro Tips",
    "• Daily cron jobs automatically calculate accrued earnings<br>• You can add co owners for joint mandates<br>• Upload ledger reports, mandates, and other documents"
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
    "View all assets with their values, accrued earnings, status, and maturity information.",
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
    const [path, query = ""] = (pathname || "").split("?");
    const view = new URLSearchParams(query).get("view");
    if (path === "/landing" || path === "/") {
      return clientLandingSteps;
    }
    if (path === "/portfolio") {
      return clientPortfolioSteps;
    }
    if (path === "/withdrawal") {
      return clientWithdrawalSteps;
    }
    if (path === "/terms" && view === "upload") {
      return clientDocumentsSteps;
    }
    if (path === "/terms") {
      return clientLibrarySteps;
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
  const raw =
    !pathname || pathname === "/"
      ? persona === "admin"
        ? "/dashboard"
        : "/landing"
      : pathname;
  const [path, query = ""] = raw.split("?");
  const view = new URLSearchParams(query).get("view");
  const normalizedPath =
    path === "/terms" && view === "upload" ? "/terms_upload" : path;
  return `${persona}_${normalizedPath.replace(/\//g, "_")}_v4`;
}
