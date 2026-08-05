"use client";

import { useState } from "react";
import {
  Calendar,
  Building2,
  Search,
  Send,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { INITIAL_RENEWALS, RenewalItem } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmNotify } from "@/lib/notify";
import { DataTable, Column } from "@/components/ui/DataTable";

export default function RenewalPage() {
  const { showToast } = useToast();
  const [renewals, setRenewals] = useState<RenewalItem[]>(INITIAL_RENEWALS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRenewals = renewals.filter(
    (r) =>
      r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendNotification = async (id: string, businessName: string) => {
    const confirmed = await confirmNotify(businessName);
    if (!confirmed) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRenewals(
      renewals.map((r) =>
        r.id === id ? { ...r, lastNotificationSent: now } : r
      )
    );
    showToast(
      `Renewal reminder sent to "${businessName}" at ${now}`,
      "info"
    );
  };

  const columns: Column<RenewalItem>[] = [
    {
      header: "Business Name",
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
            <div style={{ fontWeight: 600 }}>{r.businessName}</div>
            <div style={{ fontSize: "12px", color: colors.brand.accent }}>
              {r.city} • ID: {r.id}
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
      header: "Amount",
      cell: (r) => (
        <span style={{ fontWeight: 700, fontSize: "15px", color: colors.text.primary }}>
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
            onClick={() => handleSendNotification(r.id, r.businessName)}
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
            Track tenant renewal dates, upcoming subscription dues, and send instant notification reminders to administrators.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          maxWidth: "420px",
        }}
      >
        <Search size={18} color={colors.text.muted} />
        <input
          type="text"
          placeholder="Search renewal by business name or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: "14px",
            fontFamily: typography.fontFamily.sans,
          }}
        />
      </div>

      {/* ── Reusable DataTable UI (with S.No & 5 items pagination) ── */}
      <DataTable
        columns={columns}
        data={filteredRenewals}
        keyExtractor={(r) => r.id}
        pageSize={5}
        emptyMessage="No renewal records found."
      />
    </div>
  );
}
