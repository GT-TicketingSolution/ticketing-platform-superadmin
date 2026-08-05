"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { colors, typography } from "@/lib/theme";

// Types
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// Context 
const ToastContext = createContext<ToastContextValue>({
  showToast: () => { },
});

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  return useContext(ToastContext);
}

// Icon helper
function ToastIcon({ type }: { type: ToastType }) {
  const iconProps = { size: 18, strokeWidth: 2, style: { flexShrink: 0 } };
  switch (type) {
    case "success":
      return <CheckCircle2 {...iconProps} color="#16A34A" />;
    case "error":
      return <XCircle {...iconProps} color="#DC2626" />;
    case "warning":
      return <AlertTriangle {...iconProps} color="#D97706" />;
    default:
      return <Info {...iconProps} color="#2563EB" />;
  }
}

// Style map
const TOAST_STYLES: Record<
  ToastType,
  { bg: string; border: string; color: string; bar: string }
> = {
  success: {
    bg: "#F0FDF4",
    border: "#86EFAC",
    color: "#14532D",
    bar: "#16A34A",
  },
  error: {
    bg: "#FEF2F2",
    border: "#FCA5A5",
    color: "#7F1D1D",
    bar: "#DC2626",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FCD34D",
    color: "#78350F",
    bar: "#D97706",
  },
  info: {
    bg: "#EFF6FF",
    border: "#93C5FD",
    color: "#1E3A5F",
    bar: "#2563EB",
  },
};

// Single Toast Item
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const style = TOAST_STYLES[toast.type];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "12px",
        padding: "12px 14px 12px 14px",
        minWidth: "280px",
        maxWidth: "360px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
        animation: "toastIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}
    >
      {/* Left colour bar */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: style.bar,
          borderRadius: "12px 0 0 12px",
        }}
      />

      {/* Icon */}
      <span style={{ marginLeft: "8px", marginTop: "1px" }}>
        <ToastIcon type={toast.type} />
      </span>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontFamily: typography.fontFamily.sans,
          fontSize: "13.5px",
          fontWeight: 500,
          color: style.color,
          lineHeight: "1.45",
          paddingRight: "4px",
        }}
      >
        {toast.message}
      </span>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          color: style.color,
          opacity: 0.6,
          flexShrink: 0,
          marginTop: "1px",
        }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// Container
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          0%   { opacity: 0; transform: translateX(40px) scale(0.92); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </>
  );
}
