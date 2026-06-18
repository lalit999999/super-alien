import OpenAI from "openai";
import { env } from "@/config/env";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1/",
  apiKey: env.OPENAI_API_KEY,
});

// https://integrate.api.nvidia.com/v1

// https://generativelanguage.googleapis.com/v1beta/openai/
// https://openrouter.ai/api/v1
