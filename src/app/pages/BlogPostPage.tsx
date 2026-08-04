import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import {
  blogPath,
  fallbackBlogPosts,
  findBlogPost,
  sortPublishedBlogPosts,
} from '../data/blogPosts';
import { fetchBlogPosts, type BlogPost } from '../lib/dataStore';
import { absoluteUrl, breadcrumbJsonLd } from '../lib/seo';
import { withBasePath } from '../lib/assets';

export function BlogPostPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState<BlogPost[]>(fallbackBlogPosts);

  useEffect(() => {
    let active = true;
    fetchBlogPosts()
      .then((data) => {
        if (active) {
          setPosts(data);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const publishedPosts = useMemo(() => sortPublishedBlogPosts(posts), [posts]);
  const post = findBlogPost(publishedPosts, slug);

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <SEO
          title="Guide Not Found"
          description="The requested Kyrgyzstan travel guide could not be found."
          noindex
        />
        <h1 className="text-3xl text-foreground">Guide not found</h1>
        <p className="mt-3 text-muted-foreground">
          It may have been unpublished or moved to a different address.
        </p>
        <Button asChild className="mt-6">
          <Link to="/blogs">Browse travel guides</Link>
        </Button>
      </section>
    );
  }

  const path = blogPath(post);
  const relatedPosts = publishedPosts.filter((item) => item.id !== post.id).slice(0, 3);
  const isSongKulGuide = post.slug === 'song-kul-lake-travel-guide';
  const sanitizedContent = DOMPurify.sanitize(post.content, {
    ADD_ATTR: ['target', 'rel'],
  });
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: absoluteUrl(post.coverImage || '/images/go-kyrgyzstan-hero.webp'),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    mainEntityOfPage: absoluteUrl(path),
    author: {
      '@type': 'Organization',
      name: 'Go Kyrgyzstan Travel',
      url: absoluteUrl('/'),
    },
    publisher: {
      '@id': `${absoluteUrl('/')}#organization`,
    },
  };

  return (
    <article className="bg-background">
      <SEO
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt}
        image={post.coverImage}
        path={path}
        type="article"
        jsonLd={[
          articleJsonLd,
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Travel Guide', path: '/blogs' },
            { name: post.title, path },
          ]),
        ]}
      />

      <header className="border-b border-border bg-muted/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            All travel guides
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">
              {post.category || 'Travel Guide'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime || 'Practical guide'}
            </span>
          </div>
          <h1 className="mt-5 text-4xl text-foreground sm:text-5xl">{post.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <img
          src={withBasePath(post.coverImage || '/images/go-kyrgyzstan-hero-1080.webp')}
          alt={post.title}
          width={1080}
          height={720}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="max-h-[560px] w-full rounded-2xl object-cover shadow-sm"
        />

        <div
          className="blog-content mx-auto mt-10 max-w-3xl text-base leading-8 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-foreground [&_li]:mb-2 [&_p]:mb-5 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {isSongKulGuide && (
          <aside className="mx-auto mt-10 max-w-3xl rounded-2xl border border-secondary/30 bg-secondary/10 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Song-Kul routes</p>
            <h2 className="mt-2 text-2xl text-foreground">Compare horse treks and private road trips</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Choose a Song-Kul route by your available days, riding experience and preferred pace,
              then confirm current access and yurt-camp availability with the local team.
            </p>
            <Link to="/destinations/song-kul" className="card-cta mt-5 text-sm font-medium text-primary">
              Explore Song-Kul tours
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        )}

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl text-foreground">Turn this guide into your own route</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Share your dates, group size, comfort level, and preferred pace. We will suggest a
            practical itinerary and explain what can be adjusted.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/feedback">Request a private itinerary</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tours">Compare tours</Link>
            </Button>
          </div>
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl text-foreground">Continue planning</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  to={blogPath(item)}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <p className="text-xs uppercase tracking-wide text-secondary">
                    {item.category || 'Travel Guide'}
                  </p>
                  <h3 className="mt-2 text-xl text-foreground">{item.title}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
                    Read guide
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
