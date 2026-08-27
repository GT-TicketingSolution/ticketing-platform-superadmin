export interface AdminUser {
  id: string;
  name: string;
  businessName: string;
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
  adminEmail?: string | null;
  adminJoinedAt?: string | null;
  adminNextRenewalDate?: string | null;
  renewalDate: string;
  amount: number;
  lastNotificationSent?: string;
  lastNotificationSentAt?: string | null;
  city: string;
  status: "Due Soon" | "Overdue" | "Upcoming" | "Completed" | "PENDING" | "PAID" | "CANCELLED";
  paymentDate?: string | null;
  paymentMethod?: string | null;
  transactionReference?: string | null;
  paymentStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardFilterState {
  dateRange: "all" | "today" | "week" | "month" | "year";
  city: string;
  searchQuery: string;
}
