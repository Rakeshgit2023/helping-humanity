// types/express.d.ts

import type { User } from "../app/comman/utils/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
      user: User;
    }
  }
}

export {};
