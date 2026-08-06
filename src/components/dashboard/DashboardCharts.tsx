"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { colors, typography } from "@/lib/theme";
import { TrendingUp, Building2, Calendar, DollarSign, Layers } from "lucide-react";

// Mock Data for Past Years & Annual Earnings Growth
const ANNUAL_EARNINGS_DATA = [
  { year: "2021", earnings: 320000, admins: 2, label: "₹3.20 Lakhs" },
  { year: "2022", earnings: 450000, admins: 3, label: "₹4.50 Lakhs" },
  { year: "2023", earnings: 620000, admins: 5, label: "₹6.20 Lakhs" },
  { year: "2024", earnings: 780000, admins: 8, label: "₹7.80 Lakhs" },
  { year: "2025", earnings: 940000, admins: 10, label: "₹9.40 Lakhs" },
  { year: "2026 (YTD)", earnings: 685000, admins: 12, label: "₹6.85 Lakhs" },
];

// Mock Data for Current Year Monthly Revenue Breakdown
const MONTHLY_REVENUE_DATA = [
  { month: "Jan", revenue: 55000 },
  { month: "Feb", revenue: 62000 },
  { month: "Mar", revenue: 78000 },
  { month: "Apr", revenue: 45000 },
  { month: "May", revenue: 82000 },
  { month: "Jun", revenue: 95000 },
  { month: "Jul", revenue: 110000 },
  { month: "Aug", revenue: 158000 }, // Current month
  { month: "Sep (Proj)", revenue: 85000 },
  { month: "Oct (Proj)", revenue: 90000 },
  { month: "Nov (Proj)", revenue: 105000 },
  { month: "Dec (Proj)", revenue: 120000 },
];

// Mock Data for City Revenue & Admin Count Distribution
const CITY_DISTRIBUTION_DATA = [
  { name: "Jaipur", revenue: 178000, count: 3, color: "#0C2A42" },
  { name: "Udaipur", revenue: 169000, count: 2, color: "#F4BC43" },
  { name: "Jodhpur", revenue: 140000, count: 2, color: "#10B981" },
  { name: "Delhi", revenue: 110000, count: 2, color: "#3B82F6" },
  { name: "Mumbai", revenue: 246000, count: 3, color: "#8B5CF6" },
];

export default function DashboardCharts() {
  const [viewMode, setViewMode] = useState<"annual" | "monthly">("annual");

  const formatCurrency = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Top Charts Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        {/* ── Main Chart: Past Years & Annual Earnings Overview ── */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            padding: "20px 24px",
            border: `1px solid ${colors.header.border}`,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Chart Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={20} color={colors.sidebar.bg} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: typography.fontWeight.bold,
                    fontFamily: typography.fontFamily.sans,
                    color: colors.text.primary,
                  }}
                >
                  {viewMode === "annual" ? "Past Years Annual Earnings" : "2026 Monthly Revenue Breakdown"}
                </h3>
              </div>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: colors.text.muted,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {viewMode === "annual"
                  ? "Track annual platform revenue performance & historical growth"
                  : "Detailed month-by-month earnings & projected revenue for 2026"}
              </p>
            </div>

            {/* Toggle View Mode */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#F1F5F9",
                borderRadius: "8px",
                padding: "3px",
                gap: "2px",
              }}
            >
              <button
                onClick={() => setViewMode("annual")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: typography.fontFamily.sans,
                  cursor: "pointer",
                  background: viewMode === "annual" ? colors.sidebar.bg : "transparent",
                  color: viewMode === "annual" ? "#FFFFFF" : colors.text.muted,
                  transition: "all 0.18s ease",
                }}
              >
                Past Years
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: typography.fontFamily.sans,
                  cursor: "pointer",
                  background: viewMode === "monthly" ? colors.sidebar.bg : "transparent",
                  color: viewMode === "monthly" ? "#FFFFFF" : colors.text.muted,
                  transition: "all 0.18s ease",
                }}
              >
                2026 Monthly
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "10px 14px",
              background: "#F8FAFC",
              borderRadius: "8px",
              border: `1px solid ${colors.header.border}`,
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: colors.text.muted, display: "block" }}>
                {viewMode === "annual" ? "Highest Annual Revenue" : "Peak Monthly Revenue"}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: colors.sidebar.bg }}>
                {viewMode === "annual" ? "₹9.40 Lakhs (2025)" : "₹1.58 Lakhs (Aug)"}
              </span>
            </div>
            <div style={{ width: "1px", height: "24px", background: colors.header.border }} />
            <div>
              <span style={{ fontSize: "11px", color: colors.text.muted, display: "block" }}>
                Growth Rate (YoY)
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#10B981" }}>
                +24.5% Growth
              </span>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "annual" ? (
                <AreaChart data={ANNUAL_EARNINGS_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.brand.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.brand.primary} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: colors.text.muted }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: colors.text.muted }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        return (
                          <div
                            style={{
                              background: colors.sidebar.bg,
                              color: "#FFFFFF",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              fontSize: "12px",
                              fontFamily: typography.fontFamily.sans,
                            }}
                          >
                            <div style={{ fontWeight: 600, color: colors.brand.primary }}>{label}</div>
                            <div style={{ marginTop: "4px" }}>
                              Earnings: <strong>₹{val.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke={colors.sidebar.bg}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#earningsGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: colors.text.muted }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: colors.text.muted }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        return (
                          <div
                            style={{
                              background: colors.sidebar.bg,
                              color: "#FFFFFF",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              fontSize: "12px",
                              fontFamily: typography.fontFamily.sans,
                            }}
                          >
                            <div style={{ fontWeight: 600, color: colors.brand.primary }}>Month: {label}</div>
                            <div style={{ marginTop: "4px" }}>
                              Revenue: <strong>₹{val.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill={colors.sidebar.bg} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Secondary Chart: Revenue & Admin Distribution by City ── */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            padding: "20px 24px",
            border: `1px solid ${colors.header.border}`,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={20} color={colors.brand.primary} />
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.sans,
                  color: colors.text.primary,
                }}
              >
                City Revenue Share
              </h3>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "12px",
                  color: colors.text.muted,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Platform earnings distributed across active cities
              </p>
            </div>
          </div>

          {/* Donut Chart */}
          <div style={{ width: "100%", height: 180, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CITY_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="revenue"
                >
                  {CITY_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            background: colors.sidebar.bg,
                            color: "#FFFFFF",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontFamily: typography.fontFamily.sans,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{data.name}</div>
                          <div>Revenue: ₹{data.revenue.toLocaleString("en-IN")}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: "11px", color: colors.text.muted, fontWeight: 500 }}>5 Cities</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: colors.text.primary }}>₹8.43L</div>
            </div>
          </div>

          {/* City Legend list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            {CITY_DISTRIBUTION_DATA.map((city) => (
              <div
                key={city.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: city.color,
                    }}
                  />
                  <span style={{ fontWeight: 500, color: colors.text.primary }}>{city.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: colors.text.primary }}>
                  ₹{city.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
