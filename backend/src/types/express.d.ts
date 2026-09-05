// types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
    }
  }
}

export {};
