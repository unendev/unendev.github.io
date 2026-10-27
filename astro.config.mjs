import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://unendev.github.io',
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
});
