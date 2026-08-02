import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { errors } from "../lib/errors";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        const messages = error.errors.map(
          (err: any) => `${err.path.join(".")}: ${err.message}`
        );
        next(errors.badRequest(messages.join(", "), "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };
}
