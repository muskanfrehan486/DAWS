import { z } from "zod";

export const updateAdminUserSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").optional(),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
      firstName: z.string().min(1, "First name is required").optional(),
      lastName: z.string().min(1, "Last name is required").optional(),
      departmentId: z.string().uuid("Invalid department ID").optional(),
      loginRole: z.enum(["ADMINISTRATOR", "USER"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const createAdminUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    departmentId: z.string().uuid("Invalid department ID"),
    loginRole: z.enum(["ADMINISTRATOR", "USER"]),
  }),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>["body"];
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>["body"];