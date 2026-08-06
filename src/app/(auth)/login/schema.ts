import * as z from "zod";

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, "Email or Username is required")
    .refine(
      (val) => {
        if (val.includes("@")) {
          return z.string().email().safeParse(val).success;
        }
        return val.length >= 3;
      },
      { message: "Enter a valid email address or username (min 3 characters)" }
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ── Forgot Password schema ────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
