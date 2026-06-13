import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Corsair
  CORSAIR_KEK: z
    .string()
    .min(30, "CORSAIR_KEK must be at least 32 characters for AES-256"),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // AI
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${missing}`);
  }

  return parsed.data;
}

// Validate once at import time — crashes loudly on startup rather than at runtime.
export const env = validateEnv();
