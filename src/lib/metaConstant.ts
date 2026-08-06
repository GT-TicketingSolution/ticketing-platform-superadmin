/**
 * SEO & Metadata Constants for Super Admin Ticketing Platform
 */

export const SITE_CONFIG = {
  name: "Ticketing Platform Super Admin",
  shortName: "Super Admin",
  description:
    "Master Control Panel for Super Administrators to manage tenant admins, pending domain requests, subscription renewals, and platform earnings across cities.",
  siteUrl: "https://superadmin.ticketing-platform.com",
};

export interface PageMeta {
  title: string;
  fullTitle: string;
  description: string;
  keywords: string[];
}

export const META_CONSTANTS: Record<string, PageMeta> = {
  dashboard: {
    title: "Dashboard",
    fullTitle: "Dashboard | Super Admin – Ticketing Platform",
    description:
      "Overview of platform revenue, total active administrators, pending request pipeline, annual earnings breakdown, and city revenue share.",
    keywords: [
      "Super Admin Dashboard",
      "Platform Revenue",
      "Ticketing Analytics",
      "City Revenue Share",
      "Admin Dues",
    ],
  },
  admin: {
    title: "Admin Management",
    fullTitle: "Admin Directory | Super Admin – Ticketing Platform",
    description:
      "Directory of tenant administrators, sub-domain setups, role access permissions, and renewal details.",
    keywords: [
      "Admin Directory",
      "Tenant Management",
      "Sub-domain Access",
      "Role Permissions",
      "Super Admin",
    ],
  },
  pendingRequests: {
    title: "Pending Requests",
    fullTitle: "Pending Requests | Super Admin – Ticketing Platform",
    description:
      "Review, approve, or reject domain setup requests, server upgrades, and quota additions from tenant administrators.",
    keywords: [
      "Admin Requests",
      "Domain Approvals",
      "System Upgrades",
      "Role Authorization",
      "Request Pipeline",
    ],
  },
  renewal: {
    title: "Subscription Renewals",
    fullTitle: "Subscription Renewals | Super Admin – Ticketing Platform",
    description:
      "Track tenant subscription renewal dates, upcoming dues, overdue licenses, and send instant reminder notifications.",
    keywords: [
      "License Renewal",
      "Subscription Dues",
      "Tenant Dues",
      "Renewal Reminders",
      "Overdue Notifications",
    ],
  },
  notifications: {
    title: "Notifications",
    fullTitle: "Notifications | Super Admin – Ticketing Platform",
    description:
      "All platform notifications — due-soon renewal alerts and recent admin requests for the Super Admin.",
    keywords: [
      "Renewal Alerts",
      "Admin Notifications",
      "Due Soon",
      "Pending Requests",
      "Super Admin Alerts",
    ],
  },
  login: {
    title: "Super Admin Login",
    fullTitle: "Login | Super Admin – Ticketing Platform",
    description:
      "Secure login portal for Super Admin access to manage the multi-tenant ticketing platform.",
    keywords: [
      "Super Admin Login",
      "Secure Portal",
      "Authentication",
      "Ticketing System Access",
    ],
  },
  resetPassword: {
    title: "Reset Password",
    fullTitle: "Reset Password | Super Admin – Ticketing Platform",
    description:
      "Reset your Super Admin account password securely to regain access to the platform.",
    keywords: [
      "Reset Password",
      "Super Admin Security",
      "Password Recovery",
      "Secure Access",
    ],
  },
};
