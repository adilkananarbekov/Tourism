import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { blogPath, fallbackBlogPosts, sortPublishedBlogPosts } from '../data/blogPosts';
import { fetchBlogPosts, type BlogPost } from '../lib/dataStore';
import { breadcrumbJsonLd } from '../lib/seo';
import { withBasePath } from '../lib/assets';

function formatDate(value?: string) {
  if (!value) {
    return '';
  }
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>(fallbackBlogPosts);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let active = true;
    fetchBlogPosts()
      .then((data) => {
        if (active) {
          setPosts(data);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh guides.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const publishedPosts = useMemo(() => sortPublishedBlogPosts(posts), [posts]);
  const featuredPost = publishedPosts.find((post) => post.featured) || publishedPosts[0];
  const categories = useMemo(
    () => ['All', ...new Set(publishedPosts.map((post) => post.category || 'Travel Guide'))],
    [publishedPosts]
  );
  const visiblePosts = publishedPosts.filter(
    (post) => activeCategory === 'All' || (post.category || 'Travel Guide') === activeCategory
  );

  return (
    <section className="bg-background">
      <SEO
        title="Kyrgyzstan Travel Guide"
        description="Practical Kyrgyzstan travel guides for Song-Kul, Issyk-Kul, Ala-Archa, horse riding, road trips, seasons, and private tour planning."
        path="/blogs"
        type="website"
        jsonLd={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Travel Guide', path: '/blogs' },
        ])}
      />

      <div className="border-b border-border bg-muted/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Plan with local context</p>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl text-foreground sm:text-5xl">
                Kyrgyzstan travel guides built for real route planning
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Clear, practical advice about seasons, mountain roads, yurt stays, hiking,
                horse riding, and the places that fit together in one trip.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <BookOpen className="mb-3 h-6 w-6 text-secondary" />
              <p className="font-medium text-foreground">Need a route, not just inspiration?</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Send your dates and interests. We will turn the useful parts of these guides into
                a realistic private itinerary.
              </p>
              <Button asChild className="mt-4">
                <Link to="/feedback">Ask for a trip plan</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        {featuredPost && (
          <article className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
            <img
              src={withBasePath(featuredPost.coverImage || '/images/go-kyrgyzstan-hero-1080.webp')}
              alt={featuredPost.title}
              width={1080}
              height={720}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full min-h-72 w-full object-cover"
            />
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">
                  {featuredPost.category || 'Travel Guide'}
                </span>
                <span>{featuredPost.readTime || 'Practical guide'}</span>
              </div>
              <h2 className="text-3xl text-foreground">{featuredPost.title}</h2>
              <p className="mt-4 leading-7 text-muted-foreground">{featuredPost.excerpt}</p>
              <Link
                to={blogPath(featuredPost)}
                className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:underline"
              >
                Read the full guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl text-foreground">All guides</h2>
              <p className="mt-2 text-muted-foreground">
                Start with a destination or choose the activity you care about most.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filter guides by category">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={activeCategory === category ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Showing the built-in guides. Live refresh was unavailable: {errorMessage}
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className="group interactive-card card-hover flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <Link to={blogPath(post)} className="overflow-hidden">
                  <img
                    src={withBasePath(post.coverImage || '/images/go-kyrgyzstan-hero-720.webp')}
                    alt={post.title}
                    width={960}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="card-media h-52 w-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-secondary">{post.category || 'Travel Guide'}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime || 'Guide'}
                    </span>
                    {formatDate(post.publishedAt || post.createdAt) && (
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-2xl text-foreground">
                    <Link to={blogPath(post)} className="card-title-link">
                      {post.title}
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </h3>
                  <p className="mt-3 flex-1 leading-7 text-muted-foreground">{post.excerpt}</p>
                  <Link
                    to={blogPath(post)}
                    className="card-cta mt-5 text-sm font-medium text-primary"
                  >
                    Read guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
