import { Request, Response, NextFunction } from "express";
import { verifySupabaseToken } from "../lib/supabase";
import { errors } from "../lib/errors";

declare global {
  namespace Express {
    interface Request {
      supabaseUserId?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw errors.unauthorized("No token provided");
    }

    const token = authHeader.substring(7);
    const user = await verifySupabaseToken(token);

    if (!user) {
      throw errors.unauthorized("Invalid or expired token");
    }

    req.supabaseUserId = user.id;

    next();
  } catch (error) {
    next(error);
  }
}
