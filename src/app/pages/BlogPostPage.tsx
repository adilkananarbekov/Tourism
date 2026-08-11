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
import { tourPath } from '../lib/tourRoutes';
import blogSeoOverrides from '../../../data/blog_seo_overrides.json';

type BlogSeoOverride = {
  seoTitle?: string;
  seoDescription?: string;
  faq?: Array<{ question: string; answer: string }>;
};

const guideRouteLinks: Record<string, { eyebrow: string; title: string; description: string; links: Array<{ to: string; label: string }> }> = {
  'best-time-to-visit-kyrgyzstan': {
    eyebrow: 'Plan by season',
    title: 'Choose a route that fits your travel month',
    description: 'Summer highland plans need different access checks from a winter trip. Compare a Song-Kul route with a winter option, then confirm conditions before booking.',
    links: [
      { to: '/destinations/song-kul', label: 'Compare Song-Kul summer routes' },
      { to: '/blogs/kyrgyzstan-horse-riding-guide', label: 'Plan the right horse-riding season' },
      { to: tourPath(6), label: 'See the winter Song-Kul horse ride' },
    ],
  },
  'song-kul-lake-travel-guide': {
    eyebrow: 'Song-Kul routes',
    title: 'Compare horse treks and private road trips',
    description: 'Choose a Song-Kul route by your available days, riding experience and preferred pace, then confirm current access and yurt-camp availability with the local team.',
    links: [
      { to: '/destinations/song-kul', label: 'Explore the Song-Kul route hub' },
      { to: tourPath(4), label: 'Compare the 2-day horse ride' },
      { to: tourPath(2), label: 'Compare the 3-day horse trek' },
    ],
  },
  'issyk-kul-road-trip-guide': {
    eyebrow: 'Issyk-Kul routes',
    title: 'Choose a lake circuit with realistic driving days',
    description: 'Compare a compact three-day introduction with a slower four-day route for gorges and hot-spring areas.',
    links: [
      { to: '/destinations/issyk-kul', label: 'Compare private Issyk-Kul routes' },
      { to: tourPath(7), label: 'See the 3-day Issyk-Kul tour' },
      { to: tourPath(10), label: 'See the 4-day gorges and hot springs tour' },
    ],
  },
  'kyrgyzstan-horse-riding-guide': {
    eyebrow: 'Horse riding routes',
    title: 'Match the ride to your experience and available days',
    description: 'A two-day overnight ride and a three-day trek are different commitments. Compare the routes before sending your dates and riding experience.',
    links: [
      { to: tourPath(4), label: 'See the 2-day Song-Kul horse ride' },
      { to: tourPath(2), label: 'See the 3-day Kyzart horse trek' },
    ],
  },
  'ala-archa-day-trip-guide': {
    eyebrow: 'Plan a hike',
    title: 'Ask for a route that matches the day and the group',
    description: 'Send your dates, experience and preferred pace. We will check what is practical before suggesting a private mountain day.',
    links: [{ to: '/feedback', label: 'Request a private hiking plan' }],
  },
};

function formatArticleDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function BlogPostPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState<BlogPost[]>(fallbackBlogPosts);

  useEffect(() => {
    let active = true;
    fetchBlogPosts(fallbackBlogPosts)
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
  const routeLinks = guideRouteLinks[post.slug];
  const editorial = (blogSeoOverrides as Record<string, BlogSeoOverride>)[post.slug];
  const seoTitle = editorial?.seoTitle || post.seoTitle || post.title;
  const seoDescription = editorial?.seoDescription || post.seoDescription || post.excerpt;
  const publishedDate = formatArticleDate(post.publishedAt || post.createdAt);
  const updatedDate = formatArticleDate(post.updatedAt);
  const sanitizedContent = DOMPurify.sanitize(post.content, {
    ADD_ATTR: ['target', 'rel'],
  });
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: seoDescription,
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
  const faqJsonLd = editorial?.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: editorial.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : undefined;

  return (
    <article className="bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={post.coverImage}
        path={path}
        type="article"
        jsonLd={[
          articleJsonLd,
          ...(faqJsonLd ? [faqJsonLd] : []),
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
            <span>By Go Kyrgyzstan Travel</span>
            {updatedDate ? (
              <time dateTime={post.updatedAt}>Updated {updatedDate}</time>
            ) : publishedDate ? (
              <time dateTime={post.publishedAt || post.createdAt}>Published {publishedDate}</time>
            ) : null}
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
          className="blog-content mx-auto mt-10 max-w-3xl text-base leading-8 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-foreground [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:text-foreground [&_li]:mb-2 [&_p]:mb-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {editorial?.faq?.length ? (
          <section className="mx-auto mt-12 max-w-3xl" aria-labelledby="guide-faq-heading">
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Quick answers</p>
            <h2 id="guide-faq-heading" className="mt-2 text-3xl text-foreground">
              Frequently asked questions about Kyrgyzstan travel seasons
            </h2>
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5 shadow-sm sm:px-6">
              {editorial.faq.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg text-foreground marker:content-none">
                    <span>{item.question}</span>
                    <span className="mt-1 text-secondary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 pr-6 leading-7 text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {routeLinks && (
          <aside className="mx-auto mt-10 max-w-3xl rounded-2xl border border-secondary/30 bg-secondary/10 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">{routeLinks.eyebrow}</p>
            <h2 className="mt-2 text-2xl text-foreground">{routeLinks.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {routeLinks.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              {routeLinks.links.map((link) => (
                <Link key={link.to} to={link.to} className="card-cta text-sm font-medium text-primary">
                  {link.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ))}
            </div>
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
