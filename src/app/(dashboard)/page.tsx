"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  RefreshCw,
  IndianRupee,
  FileSpreadsheet,
  Filter,
  Building2,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { exportMultiSectionXLS, XLSSection } from "@/lib/exportUtils";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

type DashboardAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  subdomain: string | null;
  joinedDate: string;
  nextRenewal: string | null;
  renewalAmount: number | string | null;
};

type DashboardData = {
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    pendingRequests: number;
    upcomingRenewals: number;
    totalEarnings: number | string;
  };

  earnings: {
    yearly: {
      year: number;
      amount: number | string;
    }[];

    monthly: {
      year: number;
      data: {
        month: number;
        monthName: string;
        amount: number | string;
      }[];
    };

    highestAnnualRevenue: {
      year: number;
      amount: number | string;
    } | null;

    growthRate: number;
  };

  cityRevenue: {
    city: string;
    amount: number | string;
  }[];

  activeAdmins: DashboardAdmin[];
};

type UpcomingRenewalsData = {
  summary: {
    overdue: number;
    dueWithin7Days: number;
    dueWithin15Days: number;
    total: number;
  };

  renewals: {
    id: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    city: string;
    amount: string;
    startDate: string;
    dueDate: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    transactionReference: string | null;
    daysRemaining: number;
    urgency: "OVERDUE" | "DUE_SOON";
  }[];
};

// ── Helper: get today as YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [upcomingRenewals, setUpcomingRenewals] =
    useState<UpcomingRenewalsData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const fetchDashboard = useCallback(async () => {
    // Only proceed if date range is complete (both from and to, or neither)
    const hasPartialDateRange = Boolean((fromDate && !toDate) || (!fromDate && toDate));
    if (hasPartialDateRange) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query params for /api/dashboard
      const params = new URLSearchParams();
      params.set("year", String(new Date().getFullYear()));
      if (selectedCity && selectedCity !== "All") params.set("city", selectedCity);
      if (fromDate && toDate) {
        params.set("from", fromDate);
        params.set("to", toDate);
      }

      const [dashboardResponse, renewalsResponse] = await Promise.all([
        fetch(`/api/dashboard?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        }),

        fetch("/api/dashboard/upcoming-renewals?days=365", {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const dashboardResult = await dashboardResponse.json();

      const renewalsResult = await renewalsResponse.json();

      if (!dashboardResponse.ok || !dashboardResult.success) {
        throw new Error(
          dashboardResult.message || "Failed to fetch dashboard data",
        );
      }

      if (!renewalsResponse.ok || !renewalsResult.success) {
        throw new Error(
          renewalsResult.message || "Failed to fetch upcoming renewals",
        );
      }

      setDashboard(dashboardResult.data);

      setUpcomingRenewals(renewalsResult.data);
    } catch (error) {
      console.error("DASHBOARD_FETCH_ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCity, fromDate, toDate]);

  useEffect(() => {
    // When only from date is selected, do not hit the API until to date is also selected
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      return;
    }
    fetchDashboard();
  }, [fetchDashboard, fromDate, toDate]);

  // API data
  const admins = dashboard?.activeAdmins ?? [];
  const renewals = upcomingRenewals?.renewals ?? [];

  const cities = useMemo(() => {
    const set = new Set<string>();
    admins.forEach((a) => set.add(a.city));
    renewals.forEach((r) => set.add(r.city));
    return ["All", ...Array.from(set)];
  }, [admins, renewals]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesCity = selectedCity === "All" || admin.city === selectedCity;
      return matchesCity;
    });
  }, [admins, selectedCity]);

  const filteredRenewals = useMemo(() => {
    return renewals.filter((item) => {
      const matchesCity = selectedCity === "All" || item.city === selectedCity;
      return matchesCity;
    });
  }, [renewals, selectedCity]);

  const totalAdminsCount = dashboard?.stats.totalAdmins ?? 0;

  const pendingRequestsCount = dashboard?.stats.pendingRequests ?? 0;

  const upcomingRenewalsCount =
    dashboard?.stats.upcomingRenewals ?? upcomingRenewals?.summary.total ?? 0;

  const totalEarnings = Number(dashboard?.stats.totalEarnings ?? 0);

  // Handle Export XLS (Exports full platform dashboard data: Stats + Admins + Renewals)
  const handleExportXLS = () => {
    // Build comprehensive list of all upcoming renewals
    const seenAdminIds = new Set<string>();
    const allUpcomingRenewalsRows: (string | number)[][] = [];

    // 1. Add all structured renewals from the renewals API endpoint
    filteredRenewals.forEach((r) => {
      seenAdminIds.add(r.adminId);
      const dueDate = new Date(r.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      let statusLabel = r.status;
      if (daysRemaining < 0) statusLabel = "Overdue";
      else if (daysRemaining <= 30) statusLabel = "Due Soon";
      else statusLabel = "Upcoming";

      allUpcomingRenewalsRows.push([
        r.id,
        r.adminName,
        r.adminEmail,
        r.adminPhone,
        r.city,
        dueDate.toLocaleDateString("en-IN"),
        `₹${Number(r.amount).toLocaleString("en-IN")}`,
        statusLabel,
        r.paymentStatus ?? "PENDING",
      ]);
    });

    // 2. Add upcoming renewals for all active admins with a nextRenewal date
    filteredAdmins.forEach((a) => {
      if (!seenAdminIds.has(a.id) && a.nextRenewal) {
        seenAdminIds.add(a.id);
        const dueDate = new Date(a.nextRenewal);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        let statusLabel = "Upcoming";
        if (daysRemaining < 0) statusLabel = "Overdue";
        else if (daysRemaining <= 30) statusLabel = "Due Soon";

        allUpcomingRenewalsRows.push([
          `REN-${a.id.slice(0, 8).toUpperCase()}`,
          a.name,
          a.email,
          a.phone,
          a.city,
          dueDate.toLocaleDateString("en-IN"),
          a.renewalAmount
            ? `₹${Number(a.renewalAmount).toLocaleString("en-IN")}`
            : "₹0",
          statusLabel,
          daysRemaining < 0 ? "OVERDUE" : "PENDING",
        ]);
      }
    });

    // 3. Build Past Years Annual & Monthly Earnings rows
    const yearlyEarningsRows: (string | number)[][] = (
      dashboard?.earnings?.yearly ?? []
    ).map((y) => [
      String(y.year),
      `₹${Number(y.amount).toLocaleString("en-IN")}`,
      dashboard?.earnings?.highestAnnualRevenue?.year === y.year
        ? "Highest Annual Revenue"
        : "-",
    ]);

    const monthlyEarningsRows: (string | number)[][] = (
      dashboard?.earnings?.monthly?.data ?? []
    ).map((m) => [
      `${m.monthName} ${dashboard?.earnings?.monthly?.year ?? new Date().getFullYear()}`,
      `₹${Number(m.amount).toLocaleString("en-IN")}`,
      `Month ${m.month}`,
    ]);

    // 4. Build City Revenue Share rows
    const totalCityRev = (dashboard?.cityRevenue ?? []).reduce(
      (acc, c) => acc + Number(c.amount),
      0,
    );

    const cityRevenueRows: (string | number)[][] = (
      dashboard?.cityRevenue ?? []
    ).map((c) => {
      const amt = Number(c.amount);
      const percent =
        totalCityRev > 0 ? `${((amt / totalCityRev) * 100).toFixed(2)}%` : "0%";
      return [c.city, `₹${amt.toLocaleString("en-IN")}`, percent];
    });

    if (cityRevenueRows.length > 0) {
      cityRevenueRows.push([
        "Total (All Cities)",
        `₹${totalCityRev.toLocaleString("en-IN")}`,
        "100.00%",
      ]);
    }

    const highestRevenueStr = dashboard?.earnings?.highestAnnualRevenue
      ? `₹${Number(dashboard.earnings.highestAnnualRevenue.amount).toLocaleString("en-IN")} (${dashboard.earnings.highestAnnualRevenue.year})`
      : "-";

    const growthRateStr =
      dashboard?.earnings?.growthRate !== undefined
        ? `+${dashboard.earnings.growthRate}% Growth`
        : "-";

    const sections: XLSSection[] = [
      {
        title: "1. PLATFORM SUMMARY METRICS",
        headers: ["Metric Label", "Value"],
        rows: [
          ["Total Active Admins", totalAdminsCount],
          ["Pending Requests Count", pendingRequestsCount],
          ["Upcoming Renewals Count", upcomingRenewalsCount],
          [
            "Total Platform Revenue Dues",
            `₹${totalEarnings.toLocaleString("en-IN")}`,
          ],
          ["Highest Annual Revenue", highestRevenueStr],
          ["Growth Rate (YoY)", growthRateStr],
          ["Selected City Filter", selectedCity],
          ["Export Generated At", new Date().toLocaleString()],
        ],
      },
      {
        title: "2. PAST YEARS ANNUAL EARNINGS BREAKDOWN",
        headers: ["Period / Year", "Revenue Amount", "Notes / Highlight"],
        rows: [
          ...yearlyEarningsRows,
          ["--", "--", "--"],
          ...monthlyEarningsRows,
        ],
      },
      {
        title: "3. CITY REVENUE SHARE BREAKDOWN",
        headers: ["City", "Revenue Amount", "Share of Total (%)"],
        rows: cityRevenueRows,
      },
      {
        title: "4. ACTIVE ADMINISTRATORS DIRECTORY",
        headers: [
          "Admin ID",
          "Admin Name",
          "Phone",
          "Email",
          "City",
          "Sub-Domain",
          "Joined Date",
          "Last Renewal Date",
          "Next Renewal Date",
          "Renewal Amount",
          "Status",
        ],
        rows: filteredAdmins.map((a) => [
          a.id,
          a.name,
          a.phone,
          a.email,
          a.city,
          a.subdomain ?? "-",
          new Date(a.joinedDate).toLocaleDateString("en-IN"),
          "-",
          a.nextRenewal
            ? new Date(a.nextRenewal).toLocaleDateString("en-IN")
            : "-",
          a.renewalAmount
            ? `₹${Number(a.renewalAmount).toLocaleString("en-IN")}`
            : "-",
          "ACTIVE",
        ]),
      },
      {
        title: "5. SUBSCRIPTION & LICENSE RENEWALS TRACKER",
        headers: [
          "Renewal ID",
          "Admin Name",
          "Email",
          "Phone",
          "City",
          "Due Date",
          "Amount",
          "Status",
          "Payment Status",
        ],
        rows: allUpcomingRenewalsRows,
      },
    ];

    exportMultiSectionXLS(
      `SuperAdmin_Full_Dashboard_Report_${selectedCity}`,
      sections,
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          color: colors.status.error,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Top Header Title & Actions ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
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
            Super Admin Dashboard
          </h1>
          <p
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: "14px",
              color: colors.text.muted,
              margin: "4px 0 0 0",
            }}
          >
            Overview of administrators, pending requests, renewals, and revenue.
          </p>
        </div>

        {/* Export XLS Button */}
        <button
          onClick={handleExportXLS}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#107C41",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontFamily: typography.fontFamily.sans,
            fontWeight: typography.fontWeight.semibold,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16, 124, 65, 0.25)",
            transition: "all 0.18s ease",
            whiteSpace: "nowrap",
          }}
        >
          <FileSpreadsheet size={18} />
          <span>Export as XLS</span>
        </button>
      </div>

      {/* ── Filters Bar ── */}
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
        {/* Left Side: Filter icon + City dropdown + Filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={18} color={colors.brand.accent} />
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.bold,
                fontSize: "14px",
                color: colors.text.primary,
              }}
            >
              Filters:
            </span>
          </div>

          {/* City Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={16} color={colors.text.muted} />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                height: "36px",
                borderRadius: "8px",
                border: `1px solid ${colors.header.border}`,
                padding: "0 12px",
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                color: colors.text.primary,
                outline: "none",
                cursor: "pointer",
                background: "#FFFFFF",
              }}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "All" ? "All Cities" : city}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter pills */}
          {(selectedCity !== "All" || (fromDate && toDate)) && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {selectedCity !== "All" && (
                <span
                  style={{
                    background: "rgba(35,114,165,0.1)",
                    color: colors.brand.accent,
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  City: {selectedCity}
                </span>
              )}
              {fromDate && toDate && (
                <span
                  style={{
                    background: "rgba(244,188,67,0.15)",
                    color: colors.sidebar.bg,
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  {fromDate} → {toDate}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCity("All");
                  setFromDate("");
                  setToDate("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: colors.text.muted,
                  fontFamily: typography.fontFamily.sans,
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Right Side (End of Filters Card): Date Range Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {loading && (
            <span
              style={{
                fontSize: "12px",
                color: colors.text.muted,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              Updating...
            </span>
          )}

          {/* Date Range Picker Component */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#F8FAFC",
              border: `1px solid ${colors.header.border}`,
              borderRadius: "8px",
              padding: "5px 12px",
            }}
          >
            <Calendar size={15} color={colors.brand.accent} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: colors.text.muted,
                fontFamily: typography.fontFamily.sans,
                whiteSpace: "nowrap",
              }}
            >
              From
            </span>
            <input
              type="date"
              value={fromDate}
              max={toDate || todayStr()}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
                background: "transparent",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: colors.text.muted,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              To
            </span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              max={todayStr()}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
                background: "transparent",
                cursor: "pointer",
              }}
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  color: colors.text.muted,
                }}
                title="Clear date range"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Metric Stat Cards Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "18px",
        }}
      >
        {/* Card 1: Number of Admin (Clickable) */}
        <Link
          href="/admin"
          prefetch={true}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.brand.primary}`,
            textDecoration: "none",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          className="stat-card-hover"
        >
          <div>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: typography.fontWeight.medium,
                color: colors.text.muted,
                display: "block",
              }}
            >
              Number of Admin
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "28px",
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: "4px 0",
                display: "block",
              }}
            >
              {totalAdminsCount}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: colors.status.success,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <ShieldCheck size={14} /> Active Admins &bull; View All &rarr;
            </span>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(244, 188, 67, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={24} color={colors.sidebar.bg} />
          </div>
        </Link>

        {/* Card 2: Number of Admin Requests (Clickable) */}
        <Link
          href="/admin-requests?status=Pending"
          prefetch={true}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.brand.accent}`,
            textDecoration: "none",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          className="stat-card-hover"
        >
          <div>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: typography.fontWeight.medium,
                color: colors.text.muted,
                display: "block",
              }}
            >
              Number of Admin Requests
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "28px",
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: "4px 0",
                display: "block",
              }}
            >
              {pendingRequestsCount}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: colors.brand.accent,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Action Required &bull; Review Now &rarr;
            </span>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(35, 114, 165, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={24} color={colors.brand.accent} />
          </div>
        </Link>

        {/* Card 3: Upcoming renewal (Clickable) */}
        <Link
          href="/renewal"
          prefetch={true}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.status.warning}`,
            textDecoration: "none",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          className="stat-card-hover"
        >
          <div>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: typography.fontWeight.medium,
                color: colors.text.muted,
                display: "block",
              }}
            >
              Upcoming Renewal
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "28px",
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: "4px 0",
                display: "block",
              }}
            >
              {upcomingRenewalsCount}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: colors.status.warning,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Due Soon &bull; View Dues &rarr;
            </span>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(244, 188, 67, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={24} color={colors.brand.primary} />
          </div>
        </Link>

        {/* Card 4: Total Earnings */}
        <div
          style={{
            background: colors.sidebar.bg,
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 14px rgba(12, 42, 66, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: typography.fontWeight.medium,
                color: "rgba(255, 255, 255, 0.7)",
                display: "block",
              }}
            >
              Total Earnings
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "26px",
                fontWeight: typography.fontWeight.bold,
                color: colors.brand.primary,
                margin: "4px 0",
                display: "block",
              }}
            >
              ₹{totalEarnings.toLocaleString("en-IN")}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: colors.status.success,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <ArrowUpRight size={14} /> Annual Recurring Revenue
            </span>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(244, 188, 67, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IndianRupee size={24} color={colors.brand.primary} />
          </div>
        </div>
      </div>

      {/* ── Dashboard Interactive Charts ── */}
      <DashboardCharts
        earnings={dashboard?.earnings}
        cityRevenue={dashboard?.cityRevenue ?? []}
      />

      {/* ── Dynamic Breakdown Table ── */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          overflow: "hidden",
          border: `1px solid ${colors.header.border}`,
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${colors.header.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.bold,
                fontSize: "16px",
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Active Administrators Overview
            </h3>
            <span style={{ fontSize: "13px", color: colors.text.muted }}>
              Showing {Math.min(filteredAdmins.length, 5)} of{" "}
              {filteredAdmins.length} admins &bull; Filtered by City:{" "}
              <strong>{selectedCity}</strong>
            </span>
          </div>
          <Link
            href="/admin"
            prefetch={true}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: colors.brand.accent,
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              border: `1px solid ${colors.header.border}`,
              background: "#FFFFFF",
              transition: "all 0.18s ease",
            }}
            className="view-all-link"
          >
            View All →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontFamily: typography.fontFamily.sans,
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: `1px solid ${colors.header.border}`,
                  color: colors.text.muted,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "14px 20px" }}>Admin Name</th>
                <th style={{ padding: "14px 20px" }}>Contact</th>
                <th style={{ padding: "14px 20px" }}>City</th>
                <th style={{ padding: "14px 20px" }}>Sub-Domain</th>
                <th style={{ padding: "14px 20px" }}>Joined Date</th>
                <th style={{ padding: "14px 20px" }}>Next Renewal</th>
                <th style={{ padding: "14px 20px" }}>Renewal Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: colors.text.muted,
                    }}
                  >
                    No admins found matching current filters.
                  </td>
                </tr>
              ) : (
                [...filteredAdmins]
                  .sort(
                    (a, b) =>
                      new Date(b.joinedDate).getTime() -
                      new Date(a.joinedDate).getTime(),
                  )
                  .slice(0, 5)
                  .map((admin) => (
                    <tr
                      key={admin.id}
                      style={{
                        borderBottom: `1px solid ${colors.header.border}`,
                        transition: "background 0.15s ease",
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: "14px 20px", fontWeight: 600 }}>
                        {admin.name}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div>{admin.email}</div>
                        <div
                          style={{ fontSize: "12px", color: colors.text.muted }}
                        >
                          {admin.phone}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            background: colors.bg.page,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: colors.brand.accent,
                          }}
                        >
                          {admin.city}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          color: colors.brand.accent,
                          fontWeight: 500,
                        }}
                      >
                        {admin.subdomain ?? "-"}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          color: colors.text.muted,
                        }}
                      >
                        {new Date(admin.joinedDate).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: 500 }}>
                        {admin.nextRenewal
                          ? new Date(admin.nextRenewal).toLocaleDateString(
                            "en-IN",
                          )
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          fontWeight: 700,
                          color: colors.text.primary,
                        }}
                      >
                        {admin.renewalAmount
                          ? `₹${Number(admin.renewalAmount).toLocaleString("en-IN")}`
                          : "-"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: #F8FAFC !important;
        }
        .view-all-link:hover {
          background: ${colors.bg.page} !important;
          color: ${colors.sidebar.bg} !important;
        }
        .stat-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}
