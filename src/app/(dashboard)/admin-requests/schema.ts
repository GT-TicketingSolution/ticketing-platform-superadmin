import * as z from "zod";

export const addRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  desc: z
    .string()
    .min(1, "Request description is required")
    .min(10, "Description must be at least 10 characters"),
  notes: z.string().optional(),
  status: z.enum(["Pending", "In-progress", "Accepted", "Canceled"]),
  city: z.string().min(1, "City is required"),
});

export type AddRequestFormData = z.infer<typeof addRequestSchema>;
