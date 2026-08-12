import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { supabaseAdmin } from "../lib/supabase";
import type { UpdateAdminUserInput, CreateAdminUserInput } from "../schemas/admin.schema";

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

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (error) {
      throw errors.badRequest(error.message);
    }

    const authUser = data.user;

    if (!authUser) {
      throw errors.internal("Failed to create authentication user");
    }

    const user = await prisma.user.create({
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

    return user;
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

    const authUpdates: Record<string, string> = {};

    if (input.email) authUpdates.email = input.email;
    if (input.password) authUpdates.password = input.password;

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (error) {
        throw errors.badRequest(error.message);
      }
    }

    const updatedUser = await prisma.user.update({
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

    return updatedUser;
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
