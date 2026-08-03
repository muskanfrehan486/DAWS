import { supabaseAnon, supabaseAdmin } from "../lib/supabase";
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { LoginInput, SignUpInput, RefreshTokenInput } from "../schemas/auth.schema";

class AuthService {
  async createAdmin() {
    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: "admin@example.com",
        password: "StrongPassword123!",
        email_confirm: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const authUser = data.user;

    const department = await prisma.department.findFirst({
      where: {
        name: "Human Resources",
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    const user = await prisma.user.create({
      data: {
        id: authUser.id,
        firstName: "Admin",
        lastName: "User",
        email: authUser.email!,
        departmentId: department.id,
        loginRole: "ADMINISTRATOR",
      },
    });

    return user;
  }
  async login(input: LoginInput) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw errors.unauthorized(error.message);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }

  async signUp(input: SignUpInput) {
    const { email, password, firstName, lastName, departmentId } = input;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw errors.badRequest("Department not found");
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      throw errors.badRequest(authError.message);
    }

    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          firstName,
          lastName,
          departmentId,
          loginRole: "USER",
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
        },
      });

      return {
        user,
        message: "User created successfully",
      };
    } catch (error: any) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      if (error.code === "P2002") {
        throw errors.conflict("User with this email already exists");
      }
      throw error;
    }
  }

  async refresh(input: RefreshTokenInput) {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: input.refreshToken,
    });

    if (error || !data.session) {
      throw errors.unauthorized(error?.message || "Failed to refresh token");
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loginRole: true,
        signatureStoragePath: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
