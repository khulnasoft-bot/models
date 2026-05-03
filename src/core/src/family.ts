export const Families = [
  "qwen",
  "llama",
  "claude",
  "gpt",
  "gemini",
  "mistral",
  "grok",
  "deepseek",
  "command",
  "glm",
  "doubao",
  "stable-diffusion",
  "flux"
] as const;

export type Family = typeof Families[number];
