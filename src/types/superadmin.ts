export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedDate: string;
  lastRenewalDate: string;
  nextRenewalDate: string;
  subDomain: string;
  renewalAmount: number;
  city: string;
  rolesAccess: string[];
  status: "Active" | "Inactive" | "Expired";
}

export interface PendingRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  desc: string;
  notes: string;
  status: "Accepted" | "In-progress" | "Pending" | "Canceled";
  createdDate: string;
  city: string;
}

export interface RenewalItem {
  id: string;
  adminId: string;
  businessName: string;
  renewalDate: string;
  amount: number;
  lastNotificationSent?: string;
  city: string;
  status: "Due Soon" | "Overdue" | "Upcoming" | "Completed";
}

export interface DashboardFilterState {
  dateRange: "all" | "today" | "week" | "month" | "year";
  city: string;
  searchQuery: string;
}

// ── Initial Mock Data ────────────────────────────────────────────────────────
export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: "ADM-001",
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@nahargarh.com",
    joinedDate: "2021-01-15",
    lastRenewalDate: "2026-01-15",
    nextRenewalDate: "2027-01-15",
    subDomain: "nahargarh.ticketing.com",
    renewalAmount: 45000,
    city: "Jaipur",
    rolesAccess: ["Ticket Booking", "Bookings", "Transactions", "Invoices", "Reports"],
    status: "Active",
  },
  {
    id: "ADM-002",
    name: "Priya Verma",
    phone: "+91 98123 45678",
    email: "priya.verma@citypalace.com",
    joinedDate: "2016-03-20",
    lastRenewalDate: "2026-03-20",
    nextRenewalDate: "2027-03-20",
    subDomain: "citypalace.ticketing.com",
    renewalAmount: 60000,
    city: "Udaipur",
    rolesAccess: ["Bookings", "Inventory / Capacity", "Customer Management", "Reports"],
    status: "Active",
  },
  {
    id: "ADM-003",
    name: "Amitabh Mehta",
    phone: "+91 97654 32109",
    email: "amitabh@fortview.org",
    joinedDate: "2021-06-10",
    lastRenewalDate: "2026-06-10",
    nextRenewalDate: "2027-06-10",
    subDomain: "fortview.ticketing.com",
    renewalAmount: 38000,
    city: "Jodhpur",
    rolesAccess: ["Ticket Booking", "Bookings", "CCTV Monitoring"],
    status: "Active",
  },
  {
    id: "ADM-004",
    name: "Sunita Roy",
    phone: "+91 99887 76655",
    email: "sunita.r@delhiattractions.in",
    joinedDate: "2020-09-01",
    lastRenewalDate: "2025-09-01",
    nextRenewalDate: "2026-09-01",
    subDomain: "delhimuseum.ticketing.com",
    renewalAmount: 52000,
    city: "Delhi",
    rolesAccess: ["Ticket Booking", "Invoices", "Complimentary Passes", "Reports"],
    status: "Active",
  },
  {
    id: "ADM-005",
    name: "Vikramaditya Singh",
    phone: "+91 91234 56789",
    email: "vikram@mumbaifunpark.com",
    joinedDate: "2019-11-12",
    lastRenewalDate: "2025-11-12",
    nextRenewalDate: "2026-11-12",
    subDomain: "mumbaifunpark.ticketing.com",
    renewalAmount: 75000,
    city: "Mumbai",
    rolesAccess: ["Ticket Booking", "Attraction Management", "User Management", "Settings", "Backup"],
    status: "Active",
  },
];

export const INITIAL_PENDING_REQUESTS: PendingRequest[] = [
  {
    id: "REQ-101",
    name: "Karan Johar",
    phone: "+91 98450 11223",
    email: "karan@royalheritagetours.com",
    desc: "Requesting super admin authorization for new theme park domain setup.",
    notes: "Followed up via call. Requires approval by Friday.",
    status: "Pending",
    createdDate: "2026-08-01",
    city: "Jaipur",
  },
  {
    id: "REQ-102",
    name: "Meenakshi Sundaram",
    phone: "+91 97311 88990",
    email: "meenakshi@palacevents.in",
    desc: "Upgrading server tier for monsoon festival traffic increase.",
    notes: "Payment gateway verified. In review by devops team.",
    status: "In-progress",
    createdDate: "2026-08-03",
    city: "Udaipur",
  },
  {
    id: "REQ-103",
    name: "Devendra Rathore",
    phone: "+91 99001 22334",
    email: "devendra@desertsafari.com",
    desc: "Addition of 5 new counter staff roles and complimentary pass quota.",
    notes: "Approved after compliance check.",
    status: "Accepted",
    createdDate: "2026-07-28",
    city: "Jodhpur",
  },
  {
    id: "REQ-104",
    name: "Ananya Gupta",
    phone: "+91 96112 33445",
    email: "ananya@delhiwaterpark.com",
    desc: "Domain alias update to waterpark-delhi.com.",
    notes: "Canceled due to incorrect documentation submitted.",
    status: "Canceled",
    createdDate: "2026-07-25",
    city: "Delhi",
  },
];

export const INITIAL_RENEWALS: RenewalItem[] = [
  {
    id: "REN-201",
    adminId: "ADM-003",
    businessName: "Fort View Jodhpur",
    renewalDate: "2026-08-25",
    amount: 38000,
    city: "Jodhpur",
    status: "Due Soon",
  },
  {
    id: "REN-202",
    adminId: "ADM-004",
    businessName: "Delhi Heritage Museum",
    renewalDate: "2025-09-01",
    amount: 52000,
    city: "Delhi",
    status: "Upcoming",
  },
  {
    id: "REN-203",
    adminId: "ADM-005",
    businessName: "Mumbai Fun Park",
    renewalDate: "2025-11-12",
    amount: 75000,
    city: "Mumbai",
    status: "Upcoming",
  },
  {
    id: "REN-204",
    adminId: "ADM-001",
    businessName: "Nahargarh Fort Palace",
    renewalDate: "2026-01-15",
    amount: 45000,
    city: "Jaipur",
    status: "Upcoming",
  },
  {
    id: "REN-205",
    adminId: "ADM-002",
    businessName: "City Palace Ticket Hub",
    renewalDate: "2026-03-20",
    amount: 60000,
    city: "Udaipur",
    status: "Upcoming",
  },
];
