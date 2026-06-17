import OpenAI from "openai";
import { env } from "@/config/env";

export const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: env.OPENAI_API_KEY,
});

// https://integrate.api.nvidia.com/v1

// https://generativelanguage.googleapis.com/v1beta/openai/
