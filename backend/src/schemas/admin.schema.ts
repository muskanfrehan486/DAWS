import { z } from "zod";

export const updateAdminUserSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address")
        .optional(),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
      firstName: z.string().trim().min(1, "First name is required").optional(),
      lastName: z.string().trim().min(1, "Last name is required").optional(),
      departmentId: z
        .string()
        .trim()
        .min(1, "Department is required")
        .uuid("Please select a valid department")
        .optional(),
      loginRole: z.enum(["ADMINISTRATOR", "USER"], {
        message: "Role must be User or Administrator",
      }).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const createAdminUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    departmentId: z
      .string()
      .trim()
      .min(1, "Department is required")
      .uuid("Please select a valid department"),
    loginRole: z.enum(["ADMINISTRATOR", "USER"], {
      message: "Role must be User or Administrator",
    }),
  }),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>["body"];
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>["body"];
