"use client";

import React from "react";

/* ─── Base pulse animation ─────────────────────────────────────────────────── */
const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: "6px",
};

export function SkeletonBox({
  width = "100%",
  height = "16px",
  borderRadius = "6px",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <div
        style={{
          ...shimmerStyle,
          width,
          height,
          borderRadius,
          flexShrink: 0,
          ...style,
        }}
      />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

/* ─── Skeleton stat card ───────────────────────────────────────────────────── */
export function SkeletonStatCard() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: "4px solid #E5E7EB",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <SkeletonBox width="120px" height="13px" />
        <SkeletonBox width="70px" height="28px" borderRadius="8px" />
        <SkeletonBox width="90px" height="11px" />
      </div>
      <SkeletonBox width="44px" height="44px" borderRadius="10px" />
    </div>
  );
}

/* ─── Skeleton table row ───────────────────────────────────────────────────── */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
      <td style={{ padding: "16px", textAlign: "center", width: "60px" }}>
        <SkeletonBox width="28px" height="14px" style={{ margin: "0 auto" }} />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkeletonBox width={i === 0 ? "120px" : i % 2 === 0 ? "90px" : "140px"} height="14px" />
            {i === 0 && <SkeletonBox width="80px" height="11px" />}
          </div>
        </td>
      ))}
    </tr>
  );
}

/* ─── Skeleton full table ──────────────────────────────────────────────────── */
export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        overflow: "hidden",
        border: "1px solid #E5E7EB",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
              <th style={{ padding: "14px 16px", width: "60px", textAlign: "center" }}>
                <SkeletonBox width="32px" height="12px" style={{ margin: "0 auto" }} />
              </th>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} style={{ padding: "14px 20px" }}>
                  <SkeletonBox width={i === 0 ? "100px" : "70px"} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Skeleton filter bar ──────────────────────────────────────────────────── */
export function SkeletonFilterBar() {
  return (
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
      <SkeletonBox width="60px" height="14px" />
      <SkeletonBox width="160px" height="36px" borderRadius="8px" />
      <SkeletonBox width="140px" height="36px" borderRadius="8px" />
      <SkeletonBox width="220px" height="36px" borderRadius="8px" />
      <div style={{ marginLeft: "auto" }}>
        <SkeletonBox width="130px" height="38px" borderRadius="8px" />
      </div>
    </div>
  );
}

/* ─── Skeleton page header ─────────────────────────────────────────────────── */
export function SkeletonPageHeader({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonBox width="260px" height="28px" borderRadius="8px" />
        <SkeletonBox width="360px" height="14px" />
      </div>
      {hasAction && <SkeletonBox width="148px" height="40px" borderRadius="8px" />}
    </div>
  );
}

/* ─── Dashboard skeleton ───────────────────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          height: "260px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <SkeletonBox width="200px" height="20px" borderRadius="8px" />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
            padding: "0 8px",
          }}
        >
          {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50, 95, 40].map((h, i) => (
            <SkeletonBox
              key={i}
              width="100%"
              height={`${h}%`}
              borderRadius="6px 6px 0 0"
            />
          ))}
        </div>
      </div>
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

/* ─── Admin page skeleton ──────────────────────────────────────────────────── */
export function AdminPageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

/* ─── Admin Requests skeleton ──────────────────────────────────────────────── */
export function AdminRequestsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}

/* ─── Renewal skeleton ─────────────────────────────────────────────────────── */
export function RenewalSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SkeletonPageHeader hasAction={false} />
      <SkeletonFilterBar />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}

/* ─── Notification card skeleton ───────────────────────────────────────────── */
export function SkeletonNotifCard({ index = 0 }: { index?: number }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E5E7EB",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <SkeletonBox width="46px" height="46px" borderRadius="12px" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <SkeletonBox width="180px" height="14px" />
          <SkeletonBox width="60px" height="18px" borderRadius="6px" />
          <SkeletonBox width="60px" height="18px" borderRadius="6px" />
        </div>
        <SkeletonBox width="320px" height="13px" />
        <SkeletonBox width="100px" height="11px" />
      </div>
      <SkeletonBox width="24px" height="24px" borderRadius="50%" style={{ flexShrink: 0 }} />
    </div>
  );
}

/* ─── Notifications page skeleton ──────────────────────────────────────────── */
export function NotificationsSkeleton() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonBox width="220px" height="28px" borderRadius="8px" />
          <SkeletonBox width="300px" height="13px" />
        </div>
        <SkeletonBox width="110px" height="36px" borderRadius="8px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <SkeletonBox width="80px" height="12px" />
            <SkeletonBox width="50px" height="24px" borderRadius="8px" />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {[80, 110, 110].map((w, i) => (
          <SkeletonBox key={i} width={`${w}px`} height="34px" borderRadius="8px" />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonNotifCard key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
