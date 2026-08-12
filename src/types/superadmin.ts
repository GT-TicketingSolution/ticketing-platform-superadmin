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
  adminName: string;
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
