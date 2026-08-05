"use client";

import { useState } from "react";
import { Bell, AlignRight, ChevronDown, Settings, LogOut } from "lucide-react";
import { colors, typography, spacing } from "@/lib/theme";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
  sidebarWidth?: number;
}

export default function Header({
  title = "Super Admin Panel",
  isMobile = false,
  onMenuClick,
  sidebarWidth = spacing.sidebarWidth,
}: HeaderProps) {
  const router = useRouter();
  const [bellHovered, setBellHovered] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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


      {/* Spacer to push right-side actions to the right */}
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
        {/* Notification Bell */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            aria-label="Notifications"
            onMouseEnter={() => setBellHovered(true)}
            onMouseLeave={() => setBellHovered(false)}
            style={{
              background: "transparent",
              border: `1.5px solid ${colors.header.iconColor}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              padding: 0,
              borderRadius: "50%",
              transition: "background 0.18s ease, border-color 0.18s ease",
              flexShrink: 0,
              position: "relative",
            }}
            className="header-bell-btn"
          >
            <Bell size={16} color={colors.header.iconColor} strokeWidth={1.8} />
            {/* Notification dot */}
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: colors.status.error,
                border: "1.5px solid #FFFFFF",
              }}
            />
          </button>

          {bellHovered && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: colors.sidebar.tooltipBg,
                color: colors.sidebar.tooltipText,
                fontFamily: typography.fontFamily.sans,
                fontSize: "12px",
                fontWeight: typography.fontWeight.medium,
                padding: "4px 10px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 100,
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderWidth: "5px",
                  borderStyle: "solid",
                  borderColor: `transparent transparent ${colors.sidebar.tooltipBg} transparent`,
                }}
              />
              Notifications
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: "1px",
            height: "36px",
            background: colors.header.border,
            flexShrink: 0,
          }}
        />

        {/* User avatar + name/role + dropdown */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setProfileOpen((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              flexShrink: 0,
              padding: "4px 8px",
              borderRadius: "8px",
              transition: "background 0.15s ease",
            }}
            className="header-profile-btn"
          >
            {/* Avatar with SA initials */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: colors.sidebar.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `2px solid ${colors.brand.primary}`,
              }}
            >
              <span
                style={{
                  color: colors.brand.primary,
                  fontFamily: typography.fontFamily.sans,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                SA
              </span>
            </div>

            {!isMobile && (
              <>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: "14px",
                      lineHeight: "18px",
                      color: colors.header.userNameText,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Super Admin
                  </span>
                  <span
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.medium,
                      fontSize: "11px",
                      lineHeight: "14px",
                      color: colors.brand.primary,
                    }}
                  >
                    Full System Access
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  color={colors.text.muted}
                  style={{
                    transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: `1px solid ${colors.header.border}`,
                minWidth: "200px",
                zIndex: 100,
                overflow: "hidden",
                animation: "dropdownSlide 0.18s ease-out",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${colors.header.border}`,
                  background: "#F8FAFC",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Super Admin
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: colors.text.muted,
                    fontFamily: typography.fontFamily.sans,
                    marginTop: "2px",
                  }}
                >
                  admin@superadmin.com
                </div>
              </div>

              <div style={{ padding: "6px" }}>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/login");
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: typography.fontFamily.sans,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.status.error,
                    transition: "background 0.15s ease",
                  }}
                  className="dropdown-logout-btn"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
