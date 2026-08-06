"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { changePasswordSchema, ChangePasswordFormData } from "./schema";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setSuccess(true);
    reset();
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  const handleClose = () => {
    reset();
    setSuccess(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(1, 27, 47, 0.65)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(1, 27, 47, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "modalSlideIn 0.22s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: colors.sidebar.bg,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(244, 188, 67, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={20} color={colors.brand.primary} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: "17px",
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
                Change Password
              </h2>
              <p
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                Super Admin Security Settings
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "background 0.18s ease",
            }}
          >
            <X size={18} color="#FFFFFF" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Success Message */}
          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: "#F0FDF4",
                border: `1px solid ${colors.status.success}`,
                borderRadius: "10px",
                color: colors.status.success,
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.semibold,
                fontSize: "14px",
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>Password updated successfully!</span>
            </div>
          )}

          {/* Current Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              Current Password <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                border: `1.5px solid ${errors.currentPassword ? colors.status.error : colors.login.inputBorder}`,
                borderRadius: "8px",
                padding: "0 12px",
                height: "44px",
                transition: "border-color 0.2s ease",
              }}
            >
              <Lock size={16} color={colors.login.inputIcon} style={{ marginRight: "10px", flexShrink: 0 }} />
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                {...register("currentPassword")}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: typography.fontFamily.sans,
                  color: colors.text.primary,
                  background: "transparent",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.login.inputIcon,
                  display: "flex",
                  padding: "4px",
                }}
              >
                {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <span
                style={{
                  fontSize: "12px",
                  color: colors.status.error,
                  fontFamily: typography.fontFamily.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertCircle size={13} />
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          {/* New Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              New Password <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                border: `1.5px solid ${errors.newPassword ? colors.status.error : colors.login.inputBorder}`,
                borderRadius: "8px",
                padding: "0 12px",
                height: "44px",
                transition: "border-color 0.2s ease",
              }}
            >
              <Lock size={16} color={colors.login.inputIcon} style={{ marginRight: "10px", flexShrink: 0 }} />
              <input
                type={showNew ? "text" : "password"}
                placeholder="Min. 8 chars, upper, lower & number"
                {...register("newPassword")}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: typography.fontFamily.sans,
                  color: colors.text.primary,
                  background: "transparent",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.login.inputIcon,
                  display: "flex",
                  padding: "4px",
                }}
              >
                {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <span
                style={{
                  fontSize: "12px",
                  color: colors.status.error,
                  fontFamily: typography.fontFamily.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertCircle size={13} />
                {errors.newPassword.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
              }}
            >
              Confirm New Password <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                border: `1.5px solid ${errors.confirmPassword ? colors.status.error : colors.login.inputBorder}`,
                borderRadius: "8px",
                padding: "0 12px",
                height: "44px",
                transition: "border-color 0.2s ease",
              }}
            >
              <Lock size={16} color={colors.login.inputIcon} style={{ marginRight: "10px", flexShrink: 0 }} />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                {...register("confirmPassword")}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: typography.fontFamily.sans,
                  color: colors.text.primary,
                  background: "transparent",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.login.inputIcon,
                  display: "flex",
                  padding: "4px",
                }}
              >
                {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span
                style={{
                  fontSize: "12px",
                  color: colors.status.error,
                  fontFamily: typography.fontFamily.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertCircle size={13} />
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Password requirements hint */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
              lineHeight: "1.6",
            }}
          >
            <strong style={{ color: colors.text.primary }}>Password requirements:</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              <li>At least 8 characters long</li>
              <li>At least one uppercase letter (A–Z)</li>
              <li>At least one lowercase letter (a–z)</li>
              <li>At least one number (0–9)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                height: "44px",
                border: `1px solid ${colors.login.inputBorder}`,
                borderRadius: "8px",
                background: "#FFFFFF",
                color: colors.text.primary,
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.semibold,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              style={{
                flex: 1,
                height: "44px",
                border: "none",
                borderRadius: "8px",
                background: colors.brand.primary,
                color: colors.sidebar.activeText,
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.bold,
                fontSize: "14px",
                cursor: isSubmitting || success ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
                opacity: isSubmitting || success ? 0.8 : 1,
              }}
            >
              {isSubmitting ? "Saving..." : success ? "✓ Saved!" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
