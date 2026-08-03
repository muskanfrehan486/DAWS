import { Request, Response, NextFunction } from "express";
import { errors } from "../lib/errors";
import { prisma } from "../prisma";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.supabaseUserId! },
    select: { loginRole: true },
  });

  if (!user || user.loginRole !== "ADMINISTRATOR") {
    return next(errors.forbidden("Admin access required"));
  }

  next();
};