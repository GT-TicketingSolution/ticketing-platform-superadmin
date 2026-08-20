import * as z from "zod";

export const addAdminSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  city: z.string().min(1, "City is required"),
  subDomain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9-]+$/.test(val),
      "Sub-domain can only contain lowercase letters, numbers, and hyphens"
    ),
  renewalAmount: z
    .number({ message: "Renewal amount must be a number" })
    .min(1000, "Minimum renewal amount is ₹1,000")
    .max(10000000, "Amount seems too large"),
  rolesAccess: z.array(z.string()),
  joinedDate: z.string().optional(),
  nextRenewalDate: z.string().optional(),
});

export type AddAdminFormData = z.infer<typeof addAdminSchema>;
