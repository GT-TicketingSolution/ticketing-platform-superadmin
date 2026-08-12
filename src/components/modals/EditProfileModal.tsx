"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, ShieldCheck, Check } from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { useProfile } from "@/context/ProfileContext";
import { useToast } from "@/components/ui/Toast";

export default function EditProfileModal() {
  const { profile, updateProfile, isEditModalOpen, closeEditModal } =
    useProfile();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditModalOpen) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
      });
      setErrors({});
    }
  }, [isEditModalOpen, profile]);

  if (!isEditModalOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Invalid email format";
    }
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    if (!formData.role.trim()) errs.role = "Role is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update ProfileContext only after backend succeeds
      updateProfile({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        role: formData.role.trim(),
      });

      showToast(
        result.message || "Super Admin profile updated successfully!",
        "success",
      );

      closeEditModal();
    } catch (error) {
      console.error("UPDATE_PROFILE_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to update profile",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        padding: "16px",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={closeEditModal}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          border: `1px solid ${colors.header.border}`,
          overflow: "hidden",
          animation: "modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            background: colors.sidebar.bg,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: colors.sidebar.activeBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.sidebar.activeText,
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {profile.avatarInitials}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Edit Super Admin Profile
              </h3>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Update your account details
              </p>
            </div>
          </div>

          <button
            onClick={closeEditModal}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Full Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: "6px",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Full Name <span style={{ color: colors.status.error }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  color={colors.text.muted}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Super Admin"
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "38px",
                    paddingRight: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.name ? colors.status.error : colors.header.border}`,
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.sans,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {errors.name && (
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.status.error,
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {errors.name}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: "6px",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Email Address{" "}
                <span style={{ color: colors.status.error }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  color={colors.text.muted}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@superadmin.com"
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "38px",
                    paddingRight: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.email ? colors.status.error : colors.header.border}`,
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.sans,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {errors.email && (
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.status.error,
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: "6px",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Phone Number{" "}
                <span style={{ color: colors.status.error }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Phone
                  size={16}
                  color={colors.text.muted}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="text"
                  maxLength={10}
                  value={formData.phone}
                  onKeyDown={(e) => {
                    if (
                      e.key.length === 1 &&
                      !/\d/.test(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="9876543210"
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "38px",
                    paddingRight: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.phone ? colors.status.error : colors.header.border}`,
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.sans,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {errors.phone && (
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.status.error,
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {errors.phone}
                </span>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={closeEditModal}
              disabled={isSubmitting}
              style={{
                height: "38px",
                padding: "0 18px",
                borderRadius: "8px",
                border: `1px solid ${colors.header.border}`,
                background: "#FFFFFF",
                color: colors.text.primary,
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: typography.fontFamily.sans,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: "38px",
                padding: "0 22px",
                borderRadius: "8px",
                border: "none",
                background: colors.sidebar.activeBg,
                color: colors.sidebar.activeText,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: typography.fontFamily.sans,
                boxShadow: "0 2px 8px rgba(244, 188, 67, 0.3)",
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
