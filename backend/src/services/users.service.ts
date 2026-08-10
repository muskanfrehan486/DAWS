import { prisma } from "../prisma";

class UsersService {
  async listAssignableUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  }
}

export const usersService = new UsersService();
