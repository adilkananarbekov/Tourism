import seedBlogPosts from '../../../data/seed_blog_posts.json';
import type { BlogPost } from '../lib/dataStore';

export const fallbackBlogPosts = seedBlogPosts as BlogPost[];

export function blogPath(post: BlogPost) {
  return `/blogs/${post.slug || post.id}`;
}

export function sortPublishedBlogPosts(posts: BlogPost[]) {
  return [...posts]
    .filter((post) => post.status !== 'draft' && post.status !== 'archived')
    .sort((a, b) =>
      String(b.publishedAt || b.createdAt || '').localeCompare(
        String(a.publishedAt || a.createdAt || '')
      )
    );
}

export function findBlogPost(posts: BlogPost[], slug: string | undefined) {
  if (!slug) {
    return null;
  }
  return posts.find((post) => (post.slug || post.id) === slug) || null;
}
