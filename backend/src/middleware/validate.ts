import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { errors } from "../lib/errors";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body ?? {},
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        next(errors.badRequest(messages.join(", "), "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };
}
