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
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { type RenewalItem } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmNotify } from "@/lib/notify";
import { DataTable, Column } from "@/components/ui/DataTable";
import { META_CONSTANTS } from "@/lib/metaConstant";

type RenewalsApiResponse = {
  success: boolean;
  data: Array<{
    id: string;
    adminId: string;
    adminName: string | null;
    adminEmail: string | null;
    city: string | null;
    amount: string;
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
  }>;
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
    }
  }, []);

  const { showToast } = useToast();
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const fetchRenewals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      params.set("page", "1");
      params.set("limit", "100");

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (
        statusFilter === "PENDING" ||
        statusFilter === "PAID" ||
        statusFilter === "CANCELLED"
      ) {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/renewals?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      const result: RenewalsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch renewals");
      }

      const mappedRenewals: RenewalItem[] = result.data.map((r) => {
        const dueDate = new Date(r.dueDate);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        let displayStatus: RenewalItem["status"];

        if (r.status === "PAID") {
          displayStatus = "Completed";
        } else if (daysRemaining < 0) {
          displayStatus = "Overdue";
        } else if (daysRemaining <= 15) {
          displayStatus = "Due Soon";
        } else {
          displayStatus = "Upcoming";
        }

        return {
          id: r.id,
          adminId: r.adminId,
          adminName: r.adminName ?? "Unknown Admin",
          city: "",
          renewalDate: dueDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          amount: Number(r.amount),
          status: displayStatus,
        };
      });

      setRenewals(mappedRenewals);
    } catch (error) {
      console.error("FETCH_RENEWALS_ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to fetch renewals",
      );

      setRenewals([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchRenewals();
  }, [fetchRenewals]);

  const renderRenewalStatusBadge = (status: RenewalItem["status"]) => {
    let bg: string = "rgba(35, 114, 165, 0.12)";
    let fg: string = colors.brand.accent;
    let icon = <Calendar size={13} />;

    if (status === "Overdue") {
      bg = "#FEF2F2";
      fg = colors.status.error;
      icon = <AlertTriangle size={13} />;
    } else if (status === "Due Soon") {
      bg = "#FFFBEB";
      fg = "#D97706";
      icon = <Clock size={13} />;
    } else if (status === "Completed") {
      bg = "#F0FDF4";
      fg = "#16A34A";
      icon = <CheckCircle2 size={13} />;
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
        {status}
      </span>
    );
  };

  const filteredRenewals = renewals.filter((r) => {
    const matchesSearch =
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.adminName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setRenewals((current) =>
        current.map((r) =>
          r.id === id
            ? {
                ...r,
                lastNotificationSent: now,
              }
            : r,
        ),
      );

      showToast(`Renewal reminder sent to "${adminName}"`, "success");
    } catch (error) {
      console.error("SEND_RENEWAL_NOTIFICATION_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to send notification",
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
            <div style={{ fontSize: "12px", color: colors.brand.accent }}>
              {r.city}
            </div>
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

          {r.lastNotificationSent && (
            <span style={{ fontSize: "11px", color: colors.text.muted }}>
              Last sent today at {r.lastNotificationSent}
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
            Subscription & License Renewals ({renewals.length})
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
            placeholder="Search admin name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              background: "transparent",
              fontFamily: typography.fontFamily.sans,
            }}
          />
        </div>

        {/* Status Filter Buttons */}
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
          {["All", "Due Soon", "Overdue", "Upcoming"].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
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
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Reusable DataTable UI (with S.No & 5 items pagination) ── */}
      <DataTable
        columns={columns}
        data={filteredRenewals}
        keyExtractor={(r) => r.id}
        pageSize={5}
        isLoading={isLoading}
        emptyMessage={error ?? "No renewal records found."}
      />
    </div>
  );
}
