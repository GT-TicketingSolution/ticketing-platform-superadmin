"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  RefreshCw,
  IndianRupee,
  FileSpreadsheet,
  Filter,
  Search,
  Building2,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { exportMultiSectionXLS, XLSSection } from "@/lib/exportUtils";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

type DashboardAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  subdomain: string | null;
  joinedDate: string;
  nextRenewal: string | null;
  renewalAmount: string | null;
};

type DashboardData = {
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    pendingRequests: number;
    upcomingRenewals: number;
    totalEarnings: string;
  };

  earnings: {
    yearly: {
      year: number;
      amount: string;
    }[];

    monthly: {
      year: number;
      data: {
        month: number;
        monthName: string;
        amount: string;
      }[];
    };

    highestAnnualRevenue: {
      year: number;
      amount: string;
    } | null;

    growthRate: number;
  };

  cityRevenue: {
    city: string;
    amount: string;
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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [upcomingRenewals, setUpcomingRenewals] =
    useState<UpcomingRenewalsData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardResponse, renewalsResponse] = await Promise.all([
          fetch("/api/dashboard", {
            method: "GET",
            credentials: "include",
          }),

          fetch("/api/dashboard/upcoming-renewals?days=15", {
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
    };

    fetchDashboard();
  }, []);

  // API data
  const admins = dashboard?.activeAdmins ?? [];
  const renewals = upcomingRenewals?.renewals ?? [];

  // Filters State
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const cities = useMemo(() => {
    const set = new Set<string>();
    admins.forEach((a) => set.add(a.city));
    renewals.forEach((r) => set.add(r.city));
    return ["All", ...Array.from(set)];
  }, [admins, renewals]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesCity = selectedCity === "All" || admin.city === selectedCity;

      const search = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search) ||
        (admin.subdomain ?? "").toLowerCase().includes(search);

      return matchesCity && matchesSearch;
    });
  }, [admins, selectedCity, searchQuery]);

  const filteredRenewals = useMemo(() => {
    return renewals.filter((item) => {
      const matchesCity = selectedCity === "All" || item.city === selectedCity;

      const search = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        item.adminName.toLowerCase().includes(search) ||
        item.adminEmail.toLowerCase().includes(search) ||
        item.city.toLowerCase().includes(search);

      return matchesCity && matchesSearch;
    });
  }, [renewals, selectedCity, searchQuery]);

  const totalAdminsCount = dashboard?.stats.totalAdmins ?? 0;

  const pendingRequestsCount = dashboard?.stats.pendingRequests ?? 0;

  const upcomingRenewalsCount = upcomingRenewals?.summary.total ?? 0;

  const totalEarnings = Number(dashboard?.stats.totalEarnings ?? 0);

  // Handle Export XLS (Exports full platform dashboard data: Stats + Admins + Pending Requests + Renewals)
  const handleExportXLS = () => {
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
          ["Selected City Filter", selectedCity],
          ["Active Search Query", searchQuery || "None"],
          ["Export Generated At", new Date().toLocaleString()],
        ],
      },
      {
        title: "2. ACTIVE ADMINISTRATORS DIRECTORY",
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
        title: "4. SUBSCRIPTION & LICENSE RENEWALS TRACKER",

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

        rows: filteredRenewals.map((r) => [
          r.id,
          r.adminName,
          r.adminEmail,
          r.adminPhone,
          r.city,
          new Date(r.dueDate).toLocaleDateString("en-IN"),
          `₹${Number(r.amount).toLocaleString("en-IN")}`,
          r.status,
          r.paymentStatus,
        ]),
      },
    ];

    exportMultiSectionXLS(
      `SuperAdmin_Full_Dashboard_Report_${selectedCity}`,
      sections,
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.text.muted,
        }}
      >
        Loading dashboard...
      </div>
    );
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
            background: "#107C41", // Excel green accent
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
          padding: "16px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
        }}
      >
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

        {/* Date Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={16} color={colors.text.muted} />
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            style={{
              height: "38px",
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
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* City Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={16} color={colors.text.muted} />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              height: "38px",
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

        {/* Search Field */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: `1px solid ${colors.header.border}`,
            borderRadius: "8px",
            padding: "0 12px",
            height: "38px",
            flex: 1,
            minWidth: "200px",
            background: "#FFFFFF",
          }}
        >
          <Search size={16} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Search by name, email, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontFamily: typography.fontFamily.sans,
              fontSize: "13px",
              color: colors.text.primary,
              background: "transparent",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.text.muted,
                fontSize: "12px",
              }}
            >
              Clear
            </button>
          )}
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

        {/* Card 2: Number of Pending Requests (Clickable) */}
        <Link
          href="/pending-requests?status=Pending"
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
              Number of Pending Requests
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
                        ₹
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
