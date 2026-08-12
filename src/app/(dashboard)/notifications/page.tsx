"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  RefreshCw,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  CalendarClock,
  ClipboardList,
  Hourglass,
  Layers,
  ChevronRight,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import {
  useNotifications,
  type Notification,
  type NotificationType,
} from "@/hooks/useNotifications";

//  Types
type FilterTab = "all" | NotificationType;
type PriorityFilter = "all" | Notification["urgency"];

function getNotificationType(type: NotificationType) {
  switch (type) {
    case "renewal":
      return "Renewal";

    case "request":
      return "Admin Request";

    case "system":
      return "System";

    case "security":
      return "Security";

    default:
      return "Notification";
  }
}

// Urgency config
const URGENCY_CONFIG: Record<
  Notification["urgency"],
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  high: {
    label: "High",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    Icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    Icon: Clock,
  },
  low: {
    label: "Low",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
    Icon: CheckCircle2,
  },
};

// ── Status badge for requests ─────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Overdue: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
  },

  "Due Soon": {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
  },

  New: {
    color: "#2372A5",
    bg: "rgba(35,114,165,0.1)",
  },

  Info: {
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
  },
};

// ── Single Notification Card ───────────────────────────────────────────────────
function NotifCard({
  notif,
  index,
  markAsRead,
}: {
  notif: Notification;
  index: number;
  markAsRead: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const urg = URGENCY_CONFIG[notif.urgency];
  const UrgIcon = urg.Icon;
  const isRenewal = notif.type === "renewal";

  // Parse raw title to derive status label
  const rawStatus =
    notif.type === "renewal"
      ? notif.status === "OVERDUE"
        ? "Overdue"
        : "Due Soon"
      : notif.status === "INFO"
        ? "Info"
        : notif.status === "NEW"
          ? "New"
          : notif.status;

  const statusStyle = STATUS_STYLE[rawStatus] ?? {
    color: colors.text.muted,
    bg: colors.bg.page,
  };

  return (
    <div
      onClick={async () => {
        if (!notif.isRead) {
          await markAsRead(notif.id);
        }

        router.push(notif.targetUrl);
      }}
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: `1px solid ${colors.header.border}`,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        animation: `cardSlide 0.22s ease-out both`,
        animationDelay: `${index * 0.04}s`,
        transition:
          "box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease",
        cursor: "pointer",
      }}
      className="notif-card"
    >
      {/* Left icon circle */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "12px",
          background: isRenewal
            ? notif.urgency === "high"
              ? "rgba(239,68,68,0.1)"
              : "rgba(244,188,67,0.12)"
            : "rgba(35,114,165,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isRenewal ? (
          notif.urgency === "high" ? (
            <AlertTriangle size={22} color="#EF4444" />
          ) : (
            <Bell size={22} color="#F4BC43" />
          )
        ) : notif.urgency === "medium" ? (
          <ClipboardList size={22} color="#2372A5" />
        ) : (
          <Hourglass size={22} color="#2372A5" />
        )}
      </div>

      {/* Middle content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            {notif.title}
          </span>

          {/* Status pill */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: typography.fontWeight.semibold,
              color: statusStyle.color,
              background: statusStyle.bg,
              borderRadius: "6px",
              padding: "2px 8px",
              fontFamily: typography.fontFamily.sans,
            }}
          >
            {rawStatus}
          </span>

          {/* Type pill */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: typography.fontWeight.medium,
              color: isRenewal ? "#2372A5" : "#7C3AED",
              background: isRenewal
                ? "rgba(35,114,165,0.08)"
                : "rgba(124,58,237,0.08)",
              borderRadius: "6px",
              padding: "2px 8px",
              fontFamily: typography.fontFamily.sans,
            }}
          >
            {isRenewal ? "Renewal" : "Request"}
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "13px",
            color: colors.text.muted,
            fontFamily: typography.fontFamily.sans,
            margin: 0,
            lineHeight: "19px",
          }}
        >
          {notif.message}
        </p>
      </div>

      {/* Right urgency badge */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: urg.bg,
            borderRadius: "8px",
            padding: "5px 10px",
          }}
        >
          <UrgIcon size={13} color={urg.color} />
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: typography.fontWeight.bold,
              color: urg.color,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            {urg.label} Priority
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: colors.text.muted,
            fontFamily: typography.fontFamily.sans,
          }}
        >
          {new Date(notif.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Chevron indicator */}
      <ChevronRight
        size={18}
        color={colors.text.muted}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  bg,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  Icon: React.ElementType;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: `1px solid ${colors.header.border}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: "140px",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "10px",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: typography.fontWeight.bold,
            color,
            fontFamily: typography.fontFamily.sans,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: colors.text.muted,
            fontFamily: typography.fontFamily.sans,
            marginTop: "3px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const {
    notifications,
    totalCount,
    badgeLabel,
    markAsRead,
    refresh,
    loading,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const renewalCount = notifications.filter((n) => n.type === "renewal").length;
  const requestCount = notifications.filter((n) => n.type === "request").length;
  const highCount = notifications.filter((n) => n.urgency === "high").length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    const typeMatch = activeTab === "all" || n.type === activeTab;
    const priorityMatch =
      priorityFilter === "all" || n.urgency === priorityFilter;
    return typeMatch && priorityMatch;
  });

  // ── Tab config ────────────────────────────────────────────────────────────
  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "renewal", label: "Renewal Alerts", count: renewalCount },
    { key: "request", label: "Admin Requests", count: requestCount },
  ];

  const URGENCY_TABS: {
    key: PriorityFilter;
    label: string;
    color: string;
  }[] = [
    { key: "all", label: "All Priority", color: colors.text.muted },
    { key: "high", label: "High", color: "#EF4444" },
    { key: "medium", label: "Medium", color: "#F59E0B" },
    { key: "low", label: "Low", color: "#22C55E" },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "rgba(35,114,165,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color={colors.brand.accent} />
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
                margin: 0,
              }}
            >
              Notifications
            </h1>
            {totalCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: typography.fontWeight.bold,
                  color: "#fff",
                  background: "#EF4444",
                  borderRadius: "8px",
                  padding: "3px 10px",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {badgeLabel} new
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "13px",
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
              margin: 0,
            }}
          >
            Renewal alerts and recent admin requests that need your attention.
          </p>
        </div>

        {/* Refresh button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "10px",
            border: `1px solid ${colors.header.border}`,
            background: "#fff",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            fontFamily: typography.fontFamily.sans,
            transition: "background 0.15s",
          }}
          className="refresh-btn"
        >
          <RefreshCw size={14} color={colors.text.muted} />
          Refresh
        </button>
      </div>

      {/* ── Stats row*/}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <StatCard
          label="Total Notifications"
          value={totalCount}
          color={colors.brand.accent}
          bg="rgba(35,114,165,0.1)"
          Icon={Layers}
        />
        <StatCard
          label="Renewal Alerts"
          value={renewalCount}
          color="#F59E0B"
          bg="rgba(245,158,11,0.1)"
          Icon={CalendarClock}
        />
        <StatCard
          label="Admin Requests"
          value={requestCount}
          color="#7C3AED"
          bg="rgba(124,58,237,0.1)"
          Icon={ClipboardList}
        />
        <StatCard
          label="High Priority"
          value={highCount}
          color="#EF4444"
          bg="rgba(239,68,68,0.1)"
          Icon={AlertTriangle}
        />
      </div>

      {/*Filter bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: `1px solid ${colors.header.border}`,
          padding: "14px 16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Type tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: active
                    ? typography.fontWeight.bold
                    : typography.fontWeight.medium,
                  fontFamily: typography.fontFamily.sans,
                  background: active ? colors.sidebar.bg : "transparent",
                  color: active ? "#fff" : colors.text.muted,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: typography.fontWeight.bold,
                      background: active
                        ? colors.brand.primary
                        : colors.bg.page,
                      color: active ? colors.text.primary : colors.text.muted,
                      borderRadius: "6px",
                      padding: "1px 6px",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Urgency filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {URGENCY_TABS.map((u) => {
            const active = priorityFilter === u.key;

            return (
              <button
                key={u.key}
                onClick={() => setPriorityFilter(u.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: `1.5px solid ${
                    active ? u.color : colors.header.border
                  }`,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.sans,
                  background: active ? `${u.color}15` : "transparent",
                  color: active ? u.color : colors.text.muted,
                  transition: "all 0.15s",
                }}
              >
                {u.label}
              </button>
            );
          })}
        </div>
      </div>

      {/*Notification cards*/}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            border: `1px solid ${colors.header.border}`,
            padding: "56px 24px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              background: "rgba(34,197,94,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <CheckCircle2 size={32} color="#22C55E" />
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.sans,
              marginBottom: "6px",
            }}
          >
            All caught up!
          </div>
          <div
            style={{
              fontSize: "13px",
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            No notifications match the selected filters.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((n, i) => (
            <NotifCard key={n.id} notif={n} index={i} markAsRead={markAsRead} />
          ))}
        </div>
      )}

      {/*Legend*/}
      <div
        style={{
          marginTop: "20px",
          padding: "12px 18px",
          background: "#fff",
          borderRadius: "12px",
          border: `1px solid ${colors.header.border}`,
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.muted,
            fontFamily: typography.fontFamily.sans,
          }}
        >
          Priority Legend:
        </span>
        {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
          <span
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              color: cfg.color,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            <cfg.Icon size={13} color={cfg.color} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Scoped styles */}
      <style>{`
        @keyframes cardSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .notif-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important;
          transform: translateY(-1px) !important;
        }
        .refresh-btn:hover {
          background: ${colors.bg.page} !important;
        }
      `}</style>
    </div>
  );
}
