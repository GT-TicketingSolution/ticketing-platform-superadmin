"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Building2,
  Search,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  X,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { type RenewalItem } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmNotify } from "@/lib/notify";
import { DataTable, Column } from "@/components/ui/DataTable";
import { META_CONSTANTS } from "@/lib/metaConstant";
import { useDebounce } from "@/hooks/useDebounce";

type ApiRenewal = {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string | null;
  adminJoinedAt?: string | null;
  adminNextRenewalDate?: string | null;
  city?: string | null;
  amount: string | number;
  startDate: string;
  dueDate: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paymentDate: string | null;
  paymentMethod:
    | "CASH"
    | "BANK_TRANSFER"
    | "UPI"
    | "CARD"
    | "ONLINE"
    | "OTHER"
    | null;
  transactionReference: string | null;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | null;
  createdAt: string;
  updatedAt: string;
  lastNotificationSentAt: string | null;
};

type RenewalsApiResponse = {
  success: boolean;
  data: ApiRenewal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
};

export default function RenewalPage() {
  useEffect(() => {
    document.title = META_CONSTANTS.renewal.fullTitle;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchQuery(searchParam);
      }
      const statusParam = params.get("status");
      if (statusParam) {
        setStatusFilter(statusParam.toUpperCase());
      }
    }
  }, []);

  const { showToast } = useToast();
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const PAGE_SIZE = 5;

  const fetchRenewals = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        if (statusFilter !== "All") {
          params.set("status", statusFilter);
        }

        const response = await fetch(`/api/renewals?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result: RenewalsApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch renewals");
        }

        const apiData: ApiRenewal[] = Array.isArray(result.data)
          ? result.data
          : [];

        const mappedRenewals: RenewalItem[] = apiData.map((r) => {
          const dueDate = new Date(r.dueDate);
          const formattedDueDate = isNaN(dueDate.getTime())
            ? r.dueDate
            : dueDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

          return {
            id: r.id,
            adminId: r.adminId,
            adminName: r.adminName ?? "Unknown Admin",
            adminEmail: r.adminEmail ?? "",
            adminJoinedAt: r.adminJoinedAt ?? null,
            adminNextRenewalDate: r.adminNextRenewalDate ?? null,
            city: r.city ?? "",
            renewalDate: formattedDueDate,
            amount: Number(r.amount) || 0,
            status: r.status,
            lastNotificationSentAt: r.lastNotificationSentAt ?? null,
            paymentDate: r.paymentDate,
            paymentMethod: r.paymentMethod,
            transactionReference: r.transactionReference,
            paymentStatus: r.paymentStatus,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          };
        });

        setRenewals(mappedRenewals);
        setCurrentPage(result.pagination?.page ?? page);
        setTotalPages(result.pagination?.totalPages ?? 1);
        setTotalCount(result.pagination?.total ?? apiData.length);
        setHasNextPage(result.pagination?.hasNextPage ?? false);
        setHasPreviousPage(result.pagination?.hasPreviousPage ?? false);
      } catch (err) {
        console.error("FETCH_RENEWALS_ERROR:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch renewals",
        );
        setRenewals([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    fetchRenewals(1);
  }, [fetchRenewals]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== "All";

  const formatLastNotification = (isoString?: string | null) => {
    if (!isoString) return "Not Sent";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Not Sent";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderRenewalStatusBadge = (status: string) => {
    let bg: string = "rgba(244, 188, 67, 0.15)";
    let fg: string = "#D97706";
    let label = status;
    let icon = <Clock size={13} />;

    if (status === "PAID" || status === "Completed") {
      bg = "#F0FDF4";
      fg = "#16A34A";
      label = "Paid";
      icon = <CheckCircle2 size={13} />;
    } else if (status === "CANCELLED" || status === "Cancelled") {
      bg = "#FEF2F2";
      fg = colors.status.error;
      label = "Cancelled";
      icon = <AlertTriangle size={13} />;
    } else if (status === "PENDING" || status === "Pending") {
      bg = "#FFFBEB";
      fg = "#D97706";
      label = "Pending";
      icon = <Clock size={13} />;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: bg,
          color: fg,
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 700,
          border: `1px solid ${fg}30`,
        }}
      >
        {icon}
        {label}
      </span>
    );
  };

  const handleSendNotification = async (id: string, adminName: string) => {
    const confirmed = await confirmNotify(adminName);

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/renewals/${id}/notify`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send notification");
      }

      showToast(`Renewal reminder sent to "${adminName}"`, "success");

      // Re-fetch to get the backend's updated lastNotificationSentAt timestamp
      fetchRenewals(currentPage);
    } catch (err) {
      console.error("SEND_RENEWAL_NOTIFICATION_ERROR:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to send notification",
        "error",
      );
    }
  };

  const columns: Column<RenewalItem>[] = [
    {
      header: "Admin Name",
      cell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(12, 42, 66, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={18} color={colors.sidebar.bg} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.adminName}</div>
            {r.city ? (
              <div style={{ fontSize: "12px", color: colors.brand.accent }}>
                {r.city}
              </div>
            ) : r.adminEmail ? (
              <div style={{ fontSize: "12px", color: colors.text.muted }}>
                {r.adminEmail}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: "Renewal Date",
      cell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={15} color={colors.brand.primary} />
          <span style={{ fontWeight: 600, color: colors.text.primary }}>
            {r.renewalDate}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (r) => renderRenewalStatusBadge(r.status),
    },
    {
      header: "Amount",
      cell: (r) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: colors.text.primary,
          }}
        >
          ₹{r.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Notification Action",
      align: "right",
      cell: (r) => (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <button
            onClick={() => handleSendNotification(r.id, r.adminName)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: colors.brand.primary,
              color: colors.sidebar.activeText,
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.bold,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(244, 188, 67, 0.25)",
              transition: "all 0.18s ease",
            }}
          >
            <Send size={15} />
            <span>Send Notification</span>
          </button>

          {r.lastNotificationSentAt && (
            <span
              style={{
                fontSize: "11px",
                color: colors.text.muted,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              Last Sent:{" "}
              <strong style={{ color: colors.brand.accent }}>
                {formatLastNotification(r.lastNotificationSentAt)}
              </strong>
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize["2xl"],
              color: colors.text.primary,
              margin: 0,
            }}
          >
            Subscription & License Renewals ({totalCount})
          </h1>
          <p
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: "14px",
              color: colors.text.muted,
              margin: "4px 0 0 0",
            }}
          >
            Track tenant renewal dates, upcoming subscription dues, and send
            instant notification reminders to administrators.
          </p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          padding: "14px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: colors.bg.page,
            padding: "8px 14px",
            borderRadius: "8px",
            border: `1px solid ${colors.header.border}`,
            width: "320px",
          }}
        >
          <Search size={18} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Search admin name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              background: "transparent",
              fontFamily: typography.fontFamily.sans,
              color: colors.text.primary,
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Clear search"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: colors.text.muted,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Buttons & Reset */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text.muted,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Filter size={14} /> Filter Status:
          </span>
          {[
            { label: "All", value: "All" },
            { label: "Pending", value: "PENDING" },
            { label: "Paid", value: "PAID" },
            { label: "Cancelled", value: "CANCELLED" },
          ].map((item) => {
            const isActive = statusFilter === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isActive
                    ? `1.5px solid ${colors.brand.accent}`
                    : `1px solid ${colors.header.border}`,
                  background: isActive ? "rgba(35, 114, 165, 0.1)" : "#FFFFFF",
                  color: isActive ? colors.brand.accent : colors.text.muted,
                  transition: "all 0.15s ease",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {item.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${colors.status.error}`,
                background: "rgba(239, 68, 68, 0.08)",
                color: colors.status.error,
                transition: "all 0.15s ease",
                fontFamily: typography.fontFamily.sans,
                marginLeft: "6px",
              }}
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Reusable DataTable UI (with S.No & server-side pagination) ── */}
      <DataTable
        columns={columns}
        data={renewals}
        keyExtractor={(r) => r.id}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        emptyMessage={error ?? "No renewal records found."}
        pagination={{
          page: currentPage,
          limit: PAGE_SIZE,
          total: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPreviousPage: hasPreviousPage,
          onPageChange: (p) => {
            setCurrentPage(p);
            fetchRenewals(p);
          },
        }}
      />
    </div>
  );
}
