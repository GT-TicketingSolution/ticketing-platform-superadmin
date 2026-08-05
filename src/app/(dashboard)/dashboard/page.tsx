"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import {
  INITIAL_ADMINS,
  INITIAL_PENDING_REQUESTS,
  INITIAL_RENEWALS,
  AdminUser,
  PendingRequest,
  RenewalItem,
} from "@/types/superadmin";
import { useRouter } from "next/navigation";
import { exportToXLS } from "@/lib/exportUtils";

export default function DashboardPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // State for mock data
  const [admins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [pendingRequests] = useState<PendingRequest[]>(INITIAL_PENDING_REQUESTS);
  const [renewals] = useState<RenewalItem[]>(INITIAL_RENEWALS);

  // Filters State
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cities list derived from admins + renewals
  const cities = useMemo(() => {
    const set = new Set<string>();
    admins.forEach((a) => set.add(a.city));
    renewals.forEach((r) => set.add(r.city));
    return ["All", ...Array.from(set)];
  }, [admins, renewals]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesCity = selectedCity === "All" || admin.city === selectedCity;
      const matchesSearch =
        searchQuery === "" ||
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.subDomain.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [admins, selectedCity, searchQuery]);

  // Filtered Pending Requests
  const filteredPendingRequests = useMemo(() => {
    return pendingRequests.filter((req) => {
      const matchesCity = selectedCity === "All" || req.city === selectedCity;
      const matchesSearch =
        searchQuery === "" ||
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [pendingRequests, selectedCity, searchQuery]);

  // Filtered Renewals
  const filteredRenewals = useMemo(() => {
    return renewals.filter((item) => {
      const matchesCity = selectedCity === "All" || item.city === selectedCity;
      const matchesSearch =
        searchQuery === "" ||
        item.businessName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [renewals, selectedCity, searchQuery]);

  // Key Metrics Calculations
  const totalAdminsCount = filteredAdmins.length;
  const pendingRequestsCount = filteredPendingRequests.filter(
    (r) => r.status === "Pending" || r.status === "In-progress"
  ).length;
  const upcomingRenewalsCount = filteredRenewals.length;

  const totalEarnings = useMemo(() => {
    return filteredAdmins.reduce((sum, admin) => sum + admin.renewalAmount, 0);
  }, [filteredAdmins]);

  // Handle Export XLS
  const handleExportXLS = () => {
    const exportData = filteredAdmins.map((a) => ({
      "Admin Name": a.name,
      Phone: a.phone,
      Email: a.email,
      City: a.city,
      "Sub Domain": a.subDomain,
      "Renewal Amount": `₹${a.renewalAmount.toLocaleString("en-IN")}`,
      "Joined Date": a.joinedDate,
      "Last Renewal Date": a.lastRenewalDate,
      "Next Renewal Date": a.nextRenewalDate,
      Status: a.status,
    }));

    exportToXLS(`SuperAdmin_Dashboard_Report_${selectedCity}`, exportData);
  };

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
                City: {city}
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
        {/* Card 1: Number of Admin */}
        <div
          onClick={() => router.push("/admin")}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow:
              hoveredCard === 1
                ? "0 12px 28px rgba(0, 0, 0, 0.22)"
                : "0 2px 10px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.22s ease",
            transform: hoveredCard === 1 ? "translateY(-4px)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.brand.primary}`,
          }}
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
              <ShieldCheck size={14} /> Active Platform Admins
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
        </div>

        {/* Card 2: Number of Pending Requests */}
        <div
          onClick={() => router.push("/pending-requests")}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow:
              hoveredCard === 2
                ? "0 12px 28px rgba(0, 0, 0, 0.22)"
                : "0 2px 10px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.22s ease",
            transform: hoveredCard === 2 ? "translateY(-4px)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.brand.accent}`,
          }}
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
              }}
            >
              Action Required
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
        </div>

        {/* Card 3: Upcoming renewal */}
        <div
          onClick={() => router.push("/renewal")}
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow:
              hoveredCard === 3
                ? "0 12px 28px rgba(0, 0, 0, 0.22)"
                : "0 2px 10px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.22s ease",
            transform: hoveredCard === 3 ? "translateY(-4px)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.status.warning}`,
          }}
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
              }}
            >
              Due within 30-90 Days
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
        </div>

        {/* Card 4: Total Earnings */}
        <div
          onClick={() => router.push("/admin")}
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "20px",
            boxShadow:
              hoveredCard === 4
                ? "0 12px 28px rgba(0, 0, 0, 0.22)"
                : "0 2px 10px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.22s ease",
            transform: hoveredCard === 4 ? "translateY(-4px)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderLeft: `4px solid ${colors.status.success}`,
          }}
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
              Total Earnings
            </span>
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: "26px",
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
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
              }}
            >
              Platform Annual Revenue
            </span>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(34, 197, 94, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IndianRupee size={24} color={colors.status.success} />
          </div>
        </div>
      </div>

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
              Active Administrators Overview ({filteredAdmins.length})
            </h3>
            <span style={{ fontSize: "13px", color: colors.text.muted }}>
              Filtered by City: <strong>{selectedCity}</strong>
            </span>
          </div>
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
                filteredAdmins.map((admin) => (
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
                      <div style={{ fontSize: "12px", color: colors.text.muted }}>
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
                      {admin.subDomain}
                    </td>
                    <td style={{ padding: "14px 20px", color: colors.text.muted }}>
                      {admin.joinedDate}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: 500 }}>
                      {admin.nextRenewalDate}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontWeight: 700,
                        color: colors.text.primary,
                      }}
                    >
                      ₹{admin.renewalAmount.toLocaleString("en-IN")}
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
      `}</style>
    </div>
  );
}
