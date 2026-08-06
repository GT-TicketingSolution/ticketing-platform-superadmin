"use client";

import { useState } from "react";
import { AlignRight, Bell, ChevronDown, Settings, LogOut } from "lucide-react";
import { colors, typography, spacing } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import { useNotifications } from "@/hooks/useNotifications";

interface HeaderProps {
  title?: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
  sidebarWidth?: number;
}


// ── Main Header
export default function Header({
  title = "Super Admin Panel",
  isMobile = false,
  onMenuClick,
  sidebarWidth = spacing.sidebarWidth,
}: HeaderProps) {
  const router = useRouter();
  const { profile, openEditModal } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const { badgeLabel, hasNotifications } = useNotifications();

  return (
    <header
      style={{
        height: `${spacing.headerHeight}px`,
        background: colors.header.bg,
        borderBottom: `1px solid ${colors.header.border}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: isMobile ? "16px" : "32px",
        paddingRight: "24px",
        position: "fixed",
        top: 0,
        left: isMobile ? 0 : sidebarWidth,
        right: 0,
        zIndex: 40,
        boxShadow: colors.header.shadow,
        boxSizing: "border-box",
        gap: "12px",
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: "6px",
            flexShrink: 0,
            transition: "background 0.18s ease",
          }}
          className="header-icon-btn"
        >
          <AlignRight size={22} color={colors.sidebar.bg} />
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right-side actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "10px" : "16px",
          flexShrink: 0,
        }}
      >
        {/*Bell icon → navigates to /notifications page */}
        <button
          id="header-notification-btn"
          onClick={() => router.push("/notifications")}
          aria-label="Notifications"
          style={{
            position: "relative",
            background: "transparent",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "35px",
            height: "35px",
            transition: "background 0.15s ease, border-color 0.15s ease",
            flexShrink: 0,
          }}
          className="header-bell-btn"
        >
          <Bell size={22} color={colors.header.iconColor} />

          {/* Badge */}
          {hasNotifications && (
            <span
              style={{
                position: "absolute",
                top: "-3px",
                right: "-5px",
                minWidth: "14px",
                height: "18px",
                borderRadius: "9px",
                background: "#EF4444",
                color: "#fff",
                fontSize: "10px",
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.sans,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                border: "2px solid #fff",
                lineHeight: 1,
                pointerEvents: "none",
              }}
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </div>

      {/* Scoped styles */}
      <style>{`
        .header-icon-btn:hover {
          background: ${colors.bg.page} !important;
        }
        .header-bell-btn:hover {
          background: ${colors.bg.page} !important;
          border-color: ${colors.brand.accent} !important;
        }
        .header-profile-btn:hover {
          background: ${colors.bg.page} !important;
        }
        .dropdown-item-btn:hover {
          background: ${colors.bg.page} !important;
        }
        .dropdown-logout-btn:hover {
          background: rgba(239, 68, 68, 0.08) !important;
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
