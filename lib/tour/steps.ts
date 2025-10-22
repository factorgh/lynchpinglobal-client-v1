import type { StepType } from "@reactour/tour";

export type TourPersona = "client" | "admin";

const center = (content: StepType["content"]): StepType => ({ selector: "body", content, position: "center" });

const clientSteps: Record<string, StepType[]> = {
  "/": [center("Welcome! Use Help anytime to start the guided tour.")],
  "/(auth)/login": [
    { selector: '[data-tour="login-email"]', content: "Enter your email" },
    { selector: '[data-tour="login-password"]', content: "Enter your password" },
    { selector: '[data-tour="login-forgot"]', content: "Recover access if you forgot your password" },
    { selector: '[data-tour="login-submit"]', content: "Sign in to your dashboard" },
  ],
  "/(auth)/register": [
    { selector: '[data-tour="register-form"]', content: "Create your account" },
    { selector: '[data-tour="register-policy"]', content: "Review and accept policies" },
    { selector: '[data-tour="register-submit"]', content: "Finish registration" },
  ],
  "/(dashboard)/dashboard": [
    { selector: '[data-tour="navbar"]', content: "Navigate primary sections" },
    { selector: '[data-tour="portfolio-summary"]', content: "Your balances and KPIs at a glance" },
    { selector: '[data-tour="statistics"]', content: "Detailed statistics" },
    { selector: '[data-tour="notifications"]', content: "View important updates" },
  ],
  "/(dashboard)/portfolio": [
    { selector: '[data-tour="positions-table"]', content: "View holdings and performance" },
  ],
  "/(dashboard)/wealth": [
    { selector: '[data-tour="wealth-new"]', content: "Create a new wealth entry" },
  ],
  "/(dashboard)/rentals": [
    { selector: '[data-tour="rental-list"]', content: "Active rentals" },
    { selector: '[data-tour="rental-detail"]', content: "Details and terms" },
    { selector: '[data-tour="payout-schedule"]', content: "Payout schedule" },
  ],
  "/(dashboard)/cashout": [
    { selector: '[data-tour="cashout-new-payment"]', content: "Create a new payment" },
    { selector: '[data-tour="payment-user"]', content: "Choose the user to pay" },
    { selector: '[data-tour="payment-amount"]', content: "Enter amount" },
    { selector: '[data-tour="payment-requested-date"]', content: "Pick request date" },
    { selector: '[data-tour="payment-status"]', content: "Set payment status" },
    { selector: '[data-tour="payment-submit"]', content: "Submit payment" },
    { selector: '[data-tour="payment-table"]', content: "Review recent payments" },
  ],
  "/(dashboard)/withdrawal": [
    { selector: '[data-tour="withdrawal-new-request"]', content: "Make a withdrawal request" },
    { selector: '[data-tour="withdrawal-table"]', content: "Review withdrawal history" },
  ],
  "/(dashboard)/activity": [
    { selector: '[data-tour="activity-filters"]', content: "Filter history" },
    { selector: '[data-tour="activity-table"]', content: "Your activities" },
  ],
  "/(dashboard)/landing": [
    { selector: '[data-tour="cta-primary"]', content: "Primary call to action" },
    { selector: '[data-tour="feature-cards"]', content: "Key features" },
  ],
};

const adminSteps: Record<string, StepType[]> = {
  "/(dashboard)/users": [
    { selector: '[data-tour="users-table"]', content: "Manage users" },
    { selector: '[data-tour="user-actions"]', content: "Edit or delete users" },
  ],
  "/(dashboard)/users/change-password": [
    { selector: '[data-tour="old-password"]', content: "Current password" },
    { selector: '[data-tour="new-password"]', content: "New password" },
    { selector: '[data-tour="strength-meter"]', content: "Check strength" },
  ],
  "/(dashboard)/conditions": [
    { selector: '[data-tour="policy-view"]', content: "Review conditions" },
    { selector: '[data-tour="acknowledge"]', content: "Acknowledge changes" },
  ],
  "/(dashboard)/terms": [
    { selector: '[data-tour="policy-view"]', content: "Review terms" },
    { selector: '[data-tour="acknowledge"]', content: "Acknowledge changes" },
  ],
};

export function getSteps(persona: TourPersona, route: string): StepType[] {
  const maps: Record<TourPersona, Record<string, StepType[]>> = {
    client: clientSteps,
    admin: adminSteps,
  };
  const table = maps[persona];
  return table[route] || clientSteps[route] || [center("Welcome to this page.")];
}
