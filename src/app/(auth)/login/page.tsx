"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import {
  loginSchema,
  LoginFormData,
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "./schema";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Login form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  // Forgot password form
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    // Simulate API authentication
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/dashboard");
  };

  const onForgotSubmit = async (data: ForgotPasswordFormData) => {
    setForgotSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setForgotSubmitting(false);
    setForgotSuccess(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotSuccess(false);
    resetForgot();
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        overflow: "hidden",
        fontFamily: typography.fontFamily.sans,
        boxSizing: "border-box",
        padding: "64px 16px 24px 16px",
      }}
    >
      {/* Background Image Layer */}
      <div
        style={{
          position: "absolute",
          inset: "-10px",
          backgroundImage: `url('/Assets/images/bg-img.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* Top Bar: Language Picker */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setLangDropdownOpen((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(8px)",
              borderRadius: "20px",
              border: "1px solid rgba(23, 63, 99, 0.15)",
              cursor: "pointer",
              color: colors.login.langText,
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.medium,
              fontSize: "14px",
              padding: "6px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Globe size={18} color={colors.login.langText} strokeWidth={1.8} />
            <span>{selectedLang}</span>
            <ChevronDown
              size={16}
              color={colors.login.langText}
              style={{
                transform: langDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {langDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "#FFFFFF",
                borderRadius: "10px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                border: "1px solid #E5E7EB",
                padding: "6px 0",
                minWidth: "120px",
                zIndex: 30,
              }}
            >
              {["English", "Hindi"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang);
                    setLangDropdownOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    background: lang === selectedLang ? colors.bg.page : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: colors.login.title,
                    fontWeight: lang === selectedLang ? 600 : 400,
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Card */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            background: colors.login.cardBg,
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(1, 27, 47, 0.14)",
            padding: "32px 28px 28px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Logo Circle */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: colors.login.avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0, 42, 69, 0.22)",
              flexShrink: 0,
              border: `3px solid ${colors.brand.primary}`,
            }}
          >
            <ShieldCheck size={36} color={colors.brand.primary} strokeWidth={1.8} />
          </div>

          {/* ─── LOGIN FORM ─────────────────────────────────────────────────── */}
          {!showForgotPassword ? (
            <>
              <h1
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: "24px",
                  lineHeight: "30px",
                  color: colors.login.title,
                  margin: "0 0 6px 0",
                  textAlign: "center",
                }}
              >
                Super Admin Portal
              </h1>

              <p
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontWeight: typography.fontWeight.normal,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: colors.login.subtitle,
                  margin: "0 0 24px 0",
                  textAlign: "center",
                  maxWidth: "320px",
                }}
              >
                Sign in to manage administrators, renewals, and platform-wide settings
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Email/Username Field */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    htmlFor="emailOrUsername"
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.medium,
                      fontSize: "13px",
                      color: colors.login.title,
                    }}
                  >
                    Email / Username
                  </label>

                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      height: "44px",
                      border: `1.5px solid ${errors.emailOrUsername ? colors.status.error : colors.login.inputBorder}`,
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      padding: "0 12px",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <Mail
                      size={18}
                      color={colors.login.inputIcon}
                      style={{ flexShrink: 0, marginRight: "10px" }}
                    />
                    <input
                      id="emailOrUsername"
                      type="text"
                      placeholder="admin@company.com or username"
                      {...register("emailOrUsername")}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontFamily: typography.fontFamily.sans,
                        fontSize: "14px",
                        color: colors.login.inputText,
                      }}
                    />
                  </div>

                  {errors.emailOrUsername && (
                    <span
                      style={{
                        fontFamily: typography.fontFamily.sans,
                        fontSize: "12px",
                        color: colors.status.error,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={13} />
                      {errors.emailOrUsername.message}
                    </span>
                  )}
                </div>

                {/* Password Field */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.medium,
                      fontSize: "13px",
                      color: colors.login.title,
                    }}
                  >
                    Password
                  </label>

                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      height: "44px",
                      border: `1.5px solid ${errors.password ? colors.status.error : colors.login.inputBorderActive}`,
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      padding: "0 12px",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <Lock
                      size={18}
                      color={colors.login.inputIcon}
                      style={{ flexShrink: 0, marginRight: "10px" }}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontFamily: typography.fontFamily.sans,
                        fontSize: "14px",
                        color: colors.login.inputText,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "3px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.login.inputIcon,
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {errors.password && (
                    <span
                      style={{
                        fontFamily: typography.fontFamily.sans,
                        fontSize: "12px",
                        color: colors.status.error,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={13} />
                      {errors.password.message}
                    </span>
                  )}

                  {/* Forgot Password Link */}
                  <div style={{ textAlign: "right", marginTop: "2px" }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        fontFamily: typography.fontFamily.sans,
                        fontWeight: typography.fontWeight.medium,
                        fontSize: "13px",
                        color: colors.login.forgotPassword,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Login Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    height: "44px",
                    background: colors.login.btnBg,
                    color: colors.login.btnText,
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: typography.fontFamily.sans,
                    fontWeight: typography.fontWeight.bold,
                    fontSize: "16px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "background 0.2s ease, transform 0.1s ease",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
                  }}
                  className="login-btn"
                >
                  <ShieldCheck size={18} />
                  {isSubmitting ? "Signing in..." : "Sign In as Super Admin"}
                </button>
              </form>
            </>
          ) : (
            /* ─── FORGOT PASSWORD FLOW ──────────────────────────────────────── */
            <>
              {!forgotSuccess ? (
                <>
                  {/* Back to login button */}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: colors.brand.accent,
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.medium,
                      fontSize: "13px",
                      marginBottom: "8px",
                      padding: 0,
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to Sign In
                  </button>

                  <h1
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: "22px",
                      color: colors.login.title,
                      margin: "0 0 8px 0",
                      textAlign: "center",
                    }}
                  >
                    Reset Your Password
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      color: colors.login.subtitle,
                      textAlign: "center",
                      margin: "0 0 24px 0",
                      fontFamily: typography.fontFamily.sans,
                      maxWidth: "320px",
                    }}
                  >
                    Enter the email address linked to your Super Admin account. We&apos;ll send a password reset link.
                  </p>

                  <form
                    onSubmit={handleForgotSubmit(onForgotSubmit)}
                    style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label
                        htmlFor="forgotEmail"
                        style={{
                          fontFamily: typography.fontFamily.sans,
                          fontWeight: typography.fontWeight.medium,
                          fontSize: "13px",
                          color: colors.login.title,
                        }}
                      >
                        Admin Email Address
                      </label>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "44px",
                          border: `1.5px solid ${forgotErrors.email ? colors.status.error : colors.login.inputBorder}`,
                          borderRadius: "8px",
                          background: "#FFFFFF",
                          padding: "0 12px",
                          boxSizing: "border-box",
                        }}
                      >
                        <Mail
                          size={18}
                          color={colors.login.inputIcon}
                          style={{ flexShrink: 0, marginRight: "10px" }}
                        />
                        <input
                          id="forgotEmail"
                          type="email"
                          placeholder="admin@company.com"
                          {...registerForgot("email")}
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontFamily: typography.fontFamily.sans,
                            fontSize: "14px",
                            color: colors.login.inputText,
                          }}
                        />
                      </div>

                      {forgotErrors.email && (
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
                          {forgotErrors.email.message}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={forgotSubmitting}
                      style={{
                        width: "100%",
                        height: "44px",
                        background: colors.login.btnBg,
                        color: colors.login.btnText,
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: typography.fontFamily.sans,
                        fontWeight: typography.fontWeight.bold,
                        fontSize: "15px",
                        cursor: forgotSubmitting ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
                      }}
                      className="login-btn"
                    >
                      {forgotSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>
                </>
              ) : (
                /* ─── SUCCESS STATE ─────────────────────────────────────────── */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    textAlign: "center",
                    padding: "12px 0",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "#F0FDF4",
                      border: `2px solid ${colors.status.success}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={32} color={colors.status.success} />
                  </div>

                  <h2
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: "20px",
                      color: colors.login.title,
                      margin: 0,
                    }}
                  >
                    Reset Link Sent!
                  </h2>

                  <p
                    style={{
                      fontFamily: typography.fontFamily.sans,
                      fontSize: "14px",
                      color: colors.login.subtitle,
                      margin: 0,
                      maxWidth: "300px",
                    }}
                  >
                    A password reset link has been sent to your admin email address. Please check your inbox.
                  </p>

                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      height: "44px",
                      background: colors.login.btnBg,
                      color: colors.login.btnText,
                      border: "none",
                      borderRadius: "8px",
                      fontFamily: typography.fontFamily.sans,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: "15px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    className="login-btn"
                  >
                    <ArrowLeft size={18} />
                    Back to Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Button hover effect */}
      <style>{`
        .login-btn:hover {
          background: ${colors.login.btnHoverBg} !important;
        }
        .login-btn:active {
          transform: scale(0.99);
        }
      `}</style>
    </div>
  );
}
