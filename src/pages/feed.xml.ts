import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog');
  const sortedPosts = blog.sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site || 'https://unendev.github.io',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.pubDate),
      description: post.data.description,
      categories: [post.data.pillar, ...(post.data.tags || [])],
      author: post.data.author || '渥奇',
      link: `/${post.data.legacySlug || post.slug}/`,
    })),
    customData: `<language>zh-cn</language>`,
  });
}
