import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiResponse } from "../types/api";

/**
 * Middleware untuk validasi input menggunakan Zod schema
 *
 * @param schema - Zod schema untuk validasi
 * @param source - Sumber data yang akan divalidasi (body, query, params)
 * @returns Express middleware untuk validasi
 */
export const validate = (
  schema: AnyZodObject,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validasi data dari request berdasarkan source
      const data = await schema.parseAsync(req[source]);

      // Simpan data yang sudah divalidasi ke request
      req[source] = data;

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};

        // Format error messages by field
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        const response: ApiResponse = {
          success: false,
          message: "Validation error",
          errors: formattedErrors,
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
};

/**
 * Helper untuk validasi dengan multiple schemas
 * Contoh: validasi kombinasi body, query dan params
 *
 * @param schemas - Object berisi schemas yang akan divalidasi
 * @returns Express middleware untuk validasi multiple
 */
export const validateMultiple = (schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate each source with its corresponding schema
      for (const [source, schema] of Object.entries(schemas)) {
        if (schema && source in req) {
          req[source as "body" | "query" | "params"] = await schema.parseAsync(
            req[source as "body" | "query" | "params"]
          );
        }
      }

      next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};

        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        const response: ApiResponse = {
          success: false,
          message: "Validation error",
          errors: formattedErrors,
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
};

/**
 * Contoh penggunaan:
 *
 * import { userSchema } from '../types/schemas/userSchema';
 *
 * router.post('/users', validate(userSchema), userController.createUser);
 *
 * atau dengan multiple schemas:
 *
 * router.get('/posts/:id/comments',
 *   validateMultiple({
 *     params: postParamsSchema,
 *     query: paginationQuerySchema
 *   }),
 *   postController.getComments
 * );
 */
