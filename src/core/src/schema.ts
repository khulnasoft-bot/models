import { z } from 'zod';

export const ProviderSchema = z.object({
  name: z.string(),
  env: z.array(z.string()),
  npm: z.string().optional(),
  doc: z.string().url().optional(),
  api: z.string().url().optional(),
});

export const ModelSchema = z.object({
  name: z.string(),
  family: z.string(),
  release_date: z.string(),
  last_updated: z.string(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  knowledge: z.string(),
  tool_call: z.boolean(),
  open_weights: z.boolean(),
  cost: z.object({
    input: z.number(),
    output: z.number(),
    reasoning: z.number().optional(),
  }),
  limit: z.object({
    context: z.number(),
    output: z.number(),
  }),
  modalities: z.object({
    input: z.array(z.string()),
    output: z.array(z.string()),
  }),
});

export type Provider = z.infer<typeof ProviderSchema>;
export type Model = z.infer<typeof ModelSchema>;
