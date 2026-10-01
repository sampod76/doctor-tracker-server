import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

/**
 * validateRequestZod — run a Zod schema against the request and replace the
 * validated pieces back onto `req`. Throws ZodError which the global error
 * handler turns into a 400 response.
 */
const validateRequestZod =
  (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      if (parsed?.body) req.body = parsed.body;
      if (parsed?.query) req.query = parsed.query;
      if (parsed?.params) req.params = parsed.params;
      if (parsed?.cookies) req.cookies = parsed.cookies;
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequestZod;