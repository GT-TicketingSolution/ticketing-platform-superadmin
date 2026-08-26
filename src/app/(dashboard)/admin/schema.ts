import * as z from "zod";

export const addAdminSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(50, "Business name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9 ]+$/,
      "Business name must contain only letters, numbers, and spaces"
    ),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City name must be at least 2 characters"),
  subDomain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(val),
      "Enter a valid sub-domain (e.g. domain.ticketingsolution.in)"
    ),
  renewalAmount: z
    .number({ message: "Renewal amount is required" }),
  rolesAccess: z.array(z.string()),
  joinedDate: z.string().optional(),
  nextRenewalDate: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

export type AddAdminFormData = z.infer<typeof addAdminSchema>;

