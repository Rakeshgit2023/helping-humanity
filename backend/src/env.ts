import z from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.string().optional(),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
});

const createEnv = (env: NodeJS.ProcessEnv) => {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
};

export const env = createEnv(process.env);
