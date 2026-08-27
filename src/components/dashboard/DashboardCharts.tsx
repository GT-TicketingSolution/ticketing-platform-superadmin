"use client";

import { useState } from "react";
import {
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
import {
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  Layers,
} from "lucide-react";

type EarningsData = {
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

type CityRevenue = {
  city: string;
  amount: number | string;
};

interface DashboardChartsProps {
  earnings?: EarningsData;
  cityRevenue: CityRevenue[];
}

export default function DashboardCharts({
  earnings,
  cityRevenue,
}: DashboardChartsProps) {
  const [viewMode, setViewMode] = useState<"annual" | "monthly">("annual");

  const annualEarningsData =
    earnings?.yearly.map((item) => ({
      year: String(item.year),
      earnings: Number(item.amount),
    })) ?? [];

  const monthlyRevenueData =
    earnings?.monthly.data.map((item) => ({
      month: item.monthName.slice(0, 3),
      revenue: Number(item.amount),
    })) ?? [];

  const cityDistributionData = cityRevenue.map((item, index) => ({
    name: item.city,
    revenue: Number(item.amount),

    // Keep your existing chart colors.
    color: ["#0C2A42", "#F4BC43", "#10B981", "#3B82F6", "#8B5CF6"][index % 5],
  }));

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
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
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
                  {viewMode === "annual"
                    ? "Past Years Annual Earnings"
                    : `${earnings?.monthly.year ?? new Date().getFullYear()} Monthly Revenue Breakdown`}
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
                  background:
                    viewMode === "annual" ? colors.sidebar.bg : "transparent",
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
                  background:
                    viewMode === "monthly" ? colors.sidebar.bg : "transparent",
                  color: viewMode === "monthly" ? "#FFFFFF" : colors.text.muted,
                  transition: "all 0.18s ease",
                }}
              >
                {earnings?.monthly?.year ?? new Date().getFullYear()} Monthly
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
              <span
                style={{
                  fontSize: "11px",
                  color: colors.text.muted,
                  display: "block",
                }}
              >
                {viewMode === "annual"
                  ? "Highest Annual Revenue"
                  : "Peak Monthly Revenue"}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: colors.sidebar.bg,
                }}
              >
                {viewMode === "annual"
                  ? earnings?.highestAnnualRevenue
                    ? `₹${Number(
                        earnings.highestAnnualRevenue.amount,
                      ).toLocaleString(
                        "en-IN",
                      )} (${earnings.highestAnnualRevenue.year})`
                    : "-"
                  : earnings
                    ? (() => {
                        const peak = monthlyRevenueData.reduce(
                          (max, item) =>
                            item.revenue > max.revenue ? item : max,
                          { month: "-", revenue: 0 },
                        );

                        return `₹${peak.revenue.toLocaleString("en-IN")} (${peak.month})`;
                      })()
                    : "-"}
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "24px",
                background: colors.header.border,
              }}
            />
            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: colors.text.muted,
                  display: "block",
                }}
              >
                Growth Rate (YoY)
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color:
                    (earnings?.growthRate ?? 0) >= 0 ? "#10B981" : "#DC2626",
                }}
              >
                {earnings
                  ? `${earnings.growthRate >= 0 ? "+" : ""}${earnings.growthRate}% Growth`
                  : "-"}
              </span>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "annual" ? (
                <BarChart
                  data={annualEarningsData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barSize={50}
                  barCategoryGap="45%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    vertical={false}
                  />
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
                            <div
                              style={{
                                fontWeight: 600,
                                color: colors.brand.primary,
                              }}
                            >
                              Year: {label}
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              Earnings:{" "}
                              <strong>₹{val.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="earnings"
                    fill={colors.sidebar.bg}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={monthlyRevenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barSize={22}
                  barCategoryGap="35%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    vertical={false}
                  />
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
                            <div
                              style={{
                                fontWeight: 600,
                                color: colors.brand.primary,
                              }}
                            >
                              Month: {label}
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              Revenue:{" "}
                              <strong>₹{val.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={colors.sidebar.bg}
                    radius={[4, 4, 0, 0]}
                  />
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
                  data={cityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="revenue"
                >
                  {cityDistributionData.map((entry, index) => (
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
                          <div>
                            Revenue: ₹{data.revenue.toLocaleString("en-IN")}
                          </div>
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
              <div
                style={{
                  fontSize: "11px",
                  color: colors.text.muted,
                  fontWeight: 500,
                }}
              >
                {cityDistributionData.length}{" "}
                {cityDistributionData.length === 1 ? "City" : "Cities"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: colors.text.primary,
                }}
              >
                ₹
                {cityDistributionData
                  .reduce((sum, city) => sum + city.revenue, 0)
                  .toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* City Legend list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            {cityDistributionData.map((city) => (
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: city.color,
                    }}
                  />
                  <span style={{ fontWeight: 500, color: colors.text.primary }}>
                    {city.name}
                  </span>
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
