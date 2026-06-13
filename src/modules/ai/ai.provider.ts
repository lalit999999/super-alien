import OpenAI from "openai";
import { env } from "@/config/env";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENAI_API_KEY,
});
