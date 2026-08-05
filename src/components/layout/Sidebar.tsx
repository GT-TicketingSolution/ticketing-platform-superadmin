"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Shield,
  Clock,
  RefreshCw,
  KeyRound,
  LogOut,
  AlignRight,
  X,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

// ─── Nav items for Super Admin ───────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Pending Requests", href: "/pending-requests", icon: Clock },
  { label: "Renewal", href: "/renewal", icon: RefreshCw },
];

function PortalTooltip({
  label,
  anchorRef,
  visible,
}: {
  label: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  visible: boolean;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
  }, [visible, anchorRef]);

  if (!visible || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        transform: "translateY(-50%)",
        background: colors.sidebar.tooltipBg,
        color: colors.sidebar.tooltipText,
        fontFamily: typography.fontFamily.sans,
        fontSize: "13px",
        fontWeight: typography.fontWeight.medium,
        padding: "6px 12px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 99999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <span
        style={{
          position: "absolute",
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "5px",
          borderStyle: "solid",
          borderColor: `transparent ${colors.sidebar.tooltipBg} transparent transparent`,
        }}
      />
      {label}
    </div>,
    document.body
  );
}

function NavItem({
  label,
  href,
  icon: Icon,
  isActive,
  isIconOnly,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
  isIconOnly: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Link
        href={href}
        style={{ textDecoration: "none", display: "block", padding: "4px 12px" }}
      >
        <div
          ref={anchorRef as React.RefObject<HTMLDivElement>}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: isIconOnly ? 0 : "12px",
            padding: isIconOnly ? "10px 0" : "10px 14px",
            borderRadius: "8px",
            background: isActive
              ? colors.sidebar.activeBg
              : hovered
                ? colors.sidebar.hoverBg
                : "transparent",
            transition: "background 0.18s ease",
            cursor: "pointer",
            justifyContent: isIconOnly ? "center" : "flex-start",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              flexShrink: 0,
            }}
          >
            <Icon
              size={18}
              color={isActive ? colors.sidebar.activeIconColor : colors.sidebar.iconColor}
              strokeWidth={isActive ? 2.2 : 1.6}
            />
          </span>

          {!isIconOnly && (
            <span
              style={{
                fontFamily: typography.fontFamily.sans,
                fontWeight: isActive
                  ? typography.fontWeight.bold
                  : typography.fontWeight.medium,
                fontSize: "14px",
                lineHeight: "20px",
                color: isActive ? colors.sidebar.activeText : colors.sidebar.itemText,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {label}
            </span>
          )}
        </div>
      </Link>

      {isIconOnly && (
        <PortalTooltip
          label={label}
          anchorRef={anchorRef as React.RefObject<HTMLElement | null>}
          visible={hovered}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Sidebar Actions (Change Password & Logout)
// ─────────────────────────────────────────────────────────────────────────────
function BottomActions({
  isIconOnly,
  onChangePassword,
}: {
  isIconOnly: boolean;
  onChangePassword: () => void;
}) {
  const router = useRouter();
  const [passHovered, setPassHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);

  const passRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div
      style={{
        padding: "12px",
        borderTop: `1px solid ${colors.sidebar.divider}`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {/* Change Password */}
      <div
        ref={passRef}
        onClick={onChangePassword}
        onMouseEnter={() => setPassHovered(true)}
        onMouseLeave={() => setPassHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isIconOnly ? 0 : "12px",
          padding: isIconOnly ? "10px 0" : "10px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          background: passHovered ? colors.sidebar.hoverBg : "transparent",
          transition: "background 0.18s ease",
          justifyContent: isIconOnly ? "center" : "flex-start",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flexShrink: 0,
          }}
        >
          <KeyRound size={18} color={colors.sidebar.iconColor} strokeWidth={1.6} />
        </span>
        {!isIconOnly && (
          <span
            style={{
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.medium,
              fontSize: "14px",
              color: colors.sidebar.itemText,
              whiteSpace: "nowrap",
            }}
          >
            Change Password
          </span>
        )}
      </div>

      {isIconOnly && (
        <PortalTooltip
          label="Change Password"
          anchorRef={passRef as React.RefObject<HTMLElement | null>}
          visible={passHovered}
        />
      )}

      {/* Logout */}
      <div
        ref={logoutRef}
        onClick={handleLogout}
        onMouseEnter={() => setLogoutHovered(true)}
        onMouseLeave={() => setLogoutHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isIconOnly ? 0 : "12px",
          padding: isIconOnly ? "10px 0" : "10px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          background: logoutHovered ? "rgba(239, 68, 68, 0.2)" : "transparent",
          transition: "background 0.18s ease",
          justifyContent: isIconOnly ? "center" : "flex-start",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flexShrink: 0,
          }}
        >
          <LogOut size={18} color="#EF4444" strokeWidth={1.8} />
        </span>
        {!isIconOnly && (
          <span
            style={{
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.medium,
              fontSize: "14px",
              color: "#EF4444",
              whiteSpace: "nowrap",
            }}
          >
            Logout
          </span>
        )}
      </div>

      {isIconOnly && (
        <PortalTooltip
          label="Logout"
          anchorRef={logoutRef as React.RefObject<HTMLElement | null>}
          visible={logoutHovered}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Main Component
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  drawerOpen: boolean;
  isMobile: boolean;
  onDesktopToggle: () => void;
  onDrawerClose: () => void;
}

export default function Sidebar({
  collapsed,
  drawerOpen,
  isMobile,
  onDesktopToggle,
  onDrawerClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const closeDrawer = useCallback(onDrawerClose, [onDrawerClose]);
  useEffect(() => {
    if (isMobile && drawerOpen) closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const desktopWidth = collapsed
    ? colors.sidebar.collapsedWidth
    : colors.sidebar.width;

  const isIconOnly = !isMobile && collapsed;

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        width: `${colors.sidebar.width}px`,
        minWidth: `${colors.sidebar.width}px`,
        height: "100vh",
        background: colors.sidebar.bg,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: drawerOpen ? 0 : `-${colors.sidebar.width}px`,
        top: 0,
        zIndex: 60,
        overflowY: "auto",
        overflowX: "hidden",
        transition: "left 0.28s cubic-bezier(0.4,0,0.2,1)",
      }
    : {
        width: `${desktopWidth}px`,
        minWidth: `${desktopWidth}px`,
        height: "100vh",
        background: colors.sidebar.bg,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
        overflowY: "auto",
        overflowX: isIconOnly ? "visible" : "hidden",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      };

  return (
    <>
      {isMobile && drawerOpen && (
        <div
          onClick={onDrawerClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 59,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside style={sidebarStyle}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isIconOnly ? "center" : "space-between",
            padding: "16px 18px",
            minHeight: "76px",
            flexShrink: 0,
          }}
        >
          {!isIconOnly && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: colors.sidebar.activeBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.sidebar.activeText,
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                SA
              </div>
              <span
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: "16px",
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                }}
              >
                Super Admin
              </span>
            </div>
          )}

          {isMobile ? (
            <button
              onClick={onDrawerClose}
              aria-label="Close sidebar"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
              className="sidebar-toggle-btn"
            >
              <X size={22} color={colors.sidebar.iconColor} />
            </button>
          ) : (
            <button
              onClick={onDesktopToggle}
              aria-label="Toggle sidebar"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
              className="sidebar-toggle-btn"
            >
              <AlignRight size={24} color={colors.sidebar.iconColor} />
            </button>
          )}
        </div>

        <div
          style={{
            height: "1px",
            background: colors.sidebar.divider,
            flexShrink: 0,
          }}
        />

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (item.href === "/dashboard" && pathname === "/");

            return (
              <NavItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                isActive={isActive}
                isIconOnly={isIconOnly}
              />
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <BottomActions
          isIconOnly={isIconOnly}
          onChangePassword={() => setChangePasswordOpen(true)}
        />

        <style>{`
          .sidebar-toggle-btn:hover {
            background: ${colors.sidebar.hoverBg} !important;
          }
          aside::-webkit-scrollbar { width: 3px; }
          aside::-webkit-scrollbar-track { background: transparent; }
          aside::-webkit-scrollbar-thumb {
            background: ${colors.sidebar.divider};
            border-radius: 4px;
          }
        `}</style>
      </aside>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}
