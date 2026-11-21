import fs from 'node:fs';
import path from 'node:path';

/**
 * Astro Rehype Plugin: Auto WebP Redirection & Performance Attribute Injection
 * 
 * 1. Checks if the <img> src points to /images/posts/.../*.png or *.jpg
 * 2. If the optimized .webp exists in the public/ folder, redirects the src to .webp
 * 3. Enforces loading="lazy" and decoding="async" for all blog article images
 */
export default function rehypeOptimizeImages() {
  const publicDir = path.resolve('public');

  function walk(node) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'element' && node.tagName === 'img' && node.properties) {
      const src = node.properties.src;
      if (typeof src === 'string' && src.startsWith('/images/posts/')) {
        // 自动注入性能属性
        if (!node.properties.loading) {
          node.properties.loading = 'lazy';
        }
        if (!node.properties.decoding) {
          node.properties.decoding = 'async';
        }

        // 检测是否存在同名 .webp
        const match = src.match(/^(\/images\/posts\/.+?)\.(png|jpe?g)$/i);
        if (match) {
          const webpRelPath = `${match[1]}.webp`;
          const webpDiskPath = path.join(publicDir, webpRelPath.replace(/^\//, ''));
          if (fs.existsSync(webpDiskPath)) {
            node.properties.src = webpRelPath;
          }
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  return (tree) => {
    walk(tree);
  };
}
