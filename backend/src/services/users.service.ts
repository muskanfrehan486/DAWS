import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { storageService } from "../lib/supabase.storage";

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

  private signaturePathForUser(userId: string, mimetype: string) {
    const extension = mimetype === "image/jpeg" ? "jpg" : "png";
    return `${userId}.${extension}`;
  }

  async uploadSignature(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { signatureStoragePath: true },
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    const nextPath = this.signaturePathForUser(userId, file.mimetype);

    if (user.signatureStoragePath && user.signatureStoragePath !== nextPath) {
      await storageService.deleteSignature(user.signatureStoragePath);
    }

    await storageService.uploadSignature(nextPath, file.buffer, file.mimetype);

    await prisma.user.update({
      where: { id: userId },
      data: { signatureStoragePath: nextPath },
    });

    return { signatureStoragePath: nextPath };
  }

  async getSignature(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { signatureStoragePath: true },
    });

    if (!user?.signatureStoragePath) {
      throw errors.notFound("No saved signature found");
    }

    const buffer = await storageService.downloadSignature(user.signatureStoragePath);

    return {
      buffer,
      contentType: storageService.getSignatureContentType(user.signatureStoragePath),
    };
  }

  async deleteSignature(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { signatureStoragePath: true },
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    if (user.signatureStoragePath) {
      await storageService.deleteSignature(user.signatureStoragePath);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { signatureStoragePath: null },
    });

    return { message: "Signature removed" };
  }
}

export const usersService = new UsersService();
