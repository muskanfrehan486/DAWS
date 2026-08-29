import { prisma } from "../prisma";
import { AppError, errors } from "../lib/errors";
import { supabaseAdmin } from "../lib/supabase";
import { parseSpreadsheet } from "../utils/spreadsheet";
import type { UpdateAdminUserInput, CreateAdminUserInput } from "../schemas/admin.schema";
import { Prisma, type LoginRole } from "../generated/prisma/client";

function isDuplicateEmailAuthError(error: { message?: string; code?: string }): boolean {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return (
    code.includes("email_exists") ||
    code.includes("user_already_exists") ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

function throwFriendlyAuthError(error: { message: string; code?: string }): never {
  if (isDuplicateEmailAuthError(error)) {
    throw errors.conflict("A user with this email already exists");
  }
  throw errors.badRequest(error.message);
}

async function assertEmailAvailable(email: string, excludeUserId?: string) {
  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw errors.conflict("A user with this email already exists");
  }
}

type BulkUserImportFailure = {
  row: number;
  email?: string;
  error: string;
};

type SpreadsheetUpload = {
  buffer: Buffer;
  originalname: string;
};

function normalizeHeader(key: string): string {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function cell(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  return "";
}

function parseLoginRole(value: string): LoginRole | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "USER" || normalized === "ADMINISTRATOR") {
    return normalized;
  }
  return null;
}

class AdminService {
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loginRole: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async listDepartments() {
    return prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async createUser(input: CreateAdminUserInput) {
    const department = await prisma.department.findUnique({
      where: {
        id: input.departmentId,
      },
    });

    if (!department) {
      throw errors.badRequest("Department not found");
    }

    await assertEmailAvailable(input.email);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (error) {
      throwFriendlyAuthError(error);
    }

    const authUser = data.user;

    if (!authUser) {
      throw errors.internal("Failed to create authentication user");
    }

    try {
      return await prisma.user.create({
        data: {
          id: authUser.id,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          departmentId: input.departmentId,
          loginRole: input.loginRole,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          loginRole: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw errors.conflict("A user with this email already exists");
      }

      throw error;
    }
  }

  async bulkCreateUsers(file: SpreadsheetUpload) {
    const rows = parseSpreadsheet(file.buffer, file.originalname);

    if (rows.length === 0) {
      throw errors.badRequest("The spreadsheet contains no user rows");
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const departmentsByName = new Map(
      departments.map((department) => [department.name.trim().toLowerCase(), department])
    );

    const seenEmails = new Set<string>();
    const failed: BulkUserImportFailure[] = [];
    let created = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const raw = rows[index];
      const normalized: Record<string, string> = {};

      for (const [key, value] of Object.entries(raw)) {
        normalized[normalizeHeader(key)] = value.trim();
      }

      const firstName = cell(normalized, "firstname");
      const lastName = cell(normalized, "lastname");
      const email = cell(normalized, "email");
      const password = cell(normalized, "password");
      const departmentName = cell(normalized, "department", "departmentname");
      const roleValue = cell(normalized, "role", "loginrole");

      if (
        !firstName &&
        !lastName &&
        !email &&
        !password &&
        !departmentName &&
        !roleValue
      ) {
        continue;
      }

      try {
        if (!firstName) {
          throw errors.badRequest("First name is required");
        }
        if (!lastName) {
          throw errors.badRequest("Last name is required");
        }
        if (!email) {
          throw errors.badRequest("Email is required");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw errors.badRequest("Enter a valid email address");
        }
        if (!password) {
          throw errors.badRequest("Password is required");
        }
        if (password.length < 6) {
          throw errors.badRequest("Password must be at least 6 characters");
        }
        if (!departmentName) {
          throw errors.badRequest("Department is required");
        }
        if (!roleValue) {
          throw errors.badRequest("Role is required");
        }

        const emailKey = email.toLowerCase();
        if (seenEmails.has(emailKey)) {
          throw errors.conflict("A user with this email already exists in this file");
        }
        seenEmails.add(emailKey);

        const loginRole = parseLoginRole(roleValue);
        if (!loginRole) {
          throw errors.badRequest("Role must be USER or ADMINISTRATOR");
        }

        const department = departmentsByName.get(departmentName.toLowerCase());
        if (!department) {
          throw errors.badRequest(
            `Department "${departmentName}" was not found. Names must match an existing department.`
          );
        }

        await this.createUser({
          email,
          password,
          firstName,
          lastName,
          departmentId: department.id,
          loginRole,
        });
        created += 1;
      } catch (error) {
        failed.push({
          row: rowNumber,
          email: email || undefined,
          error: error instanceof AppError ? error.message : "Failed to create user",
        });
      }
    }

    if (created === 0 && failed.length === 0) {
      throw errors.badRequest("The spreadsheet contains no user rows");
    }

    return { created, failed };
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loginRole: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    return user;
  }

  async updateUser(userId: string, input: UpdateAdminUserInput) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw errors.notFound("User not found");
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });

      if (!department) {
        throw errors.badRequest("Department not found");
      }
    }

    if (input.email) {
      await assertEmailAvailable(input.email, userId);
    }

    const authUpdates: Record<string, string> = {};

    if (input.email) authUpdates.email = input.email;
    if (input.password) authUpdates.password = input.password;

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (error) {
        throwFriendlyAuthError(error);
      }
    }

    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.email ? { email: input.email } : {}),
          ...(input.firstName ? { firstName: input.firstName } : {}),
          ...(input.lastName ? { lastName: input.lastName } : {}),
          ...(input.departmentId ? { departmentId: input.departmentId } : {}),
          ...(input.loginRole ? { loginRole: input.loginRole } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          loginRole: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw errors.conflict("A user with this email already exists");
      }
      throw error;
    }
  }

  async deleteUser(userId: string, actorId: string) {
    if (userId === actorId) {
      throw errors.badRequest("You cannot delete your own account");
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginRole: true,
        _count: {
          select: {
            preparedDocuments: true,
            uploadedVersions: true,
            assignedChainSteps: true,
            approvalActions: true,
            documentComments: true,
          },
        },
      },
    });

    if (!existing) {
      throw errors.notFound("User not found");
    }

    if (existing.loginRole === "ADMINISTRATOR") {
      const adminCount = await prisma.user.count({
        where: { loginRole: "ADMINISTRATOR" },
      });

      if (adminCount <= 1) {
        throw errors.badRequest("Cannot delete the last administrator");
      }
    }

    const {
      preparedDocuments,
      uploadedVersions,
      assignedChainSteps,
      approvalActions,
      documentComments,
    } = existing._count;

    if (
      preparedDocuments > 0 ||
      uploadedVersions > 0 ||
      assignedChainSteps > 0 ||
      approvalActions > 0 ||
      documentComments > 0
    ) {
      throw errors.conflict(
        "Cannot delete this user because they have existing documents, approvals, or comments in the system."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { recipientId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw errors.internal(
        `User removed from application but failed to delete auth account: ${error.message}`
      );
    }

    return { message: "User deleted successfully" };
  }
}

export const adminService = new AdminService();
