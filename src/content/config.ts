import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    pillar: z.enum(['engineering', 'ai_universe', 'narrative', 'tools']).default('engineering'),
    tags: z.array(z.string()).default([]),
    entities: z.array(z.string()).default([]),
    author: z.string().default('渥奇'),
    aiCompanion: z.string().default('Antigravity'),
    comments: z.boolean().default(true),
    layout: z.string().optional(),
    legacySlug: z.string().optional(),
  })
});

export const collections = {
  blog: blogCollection,
};
