import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock, Compass, MapPin, Mic, Newspaper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { Button } from '../components/ui/button';
import { blogPath, fallbackBlogPosts, sortPublishedBlogPosts } from '../data/blogPosts';
import { fetchBlogPosts, type BlogPost } from '../lib/dataStore';
import { breadcrumbJsonLd } from '../lib/seo';
import { withBasePath } from '../lib/assets';

const ALL_TYPES = 'all';
const ALL_TOPICS = 'All topics';

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

function joinLabels(labels: string[]) {
  if (labels.length <= 1) {
    return labels[0] || '';
  }
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

interface StoryType {
  id: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  /** Lowercased category values that mean the same thing as this format, so we
   *  never offer a topic chip that just repeats the selected story type. */
  aliases: string[];
}

// The four editorial formats the magazine is organized around. Posts don't
// carry an explicit story-type field yet, so we infer one from the existing
// free-text `category`. Unmatched categories fall back to "tips" — the
// dominant format in the current guide library.
const STORY_TYPES: StoryType[] = [
  {
    id: 'places',
    label: 'Places',
    icon: MapPin,
    blurb: 'Grounded stories about specific valleys, lakes and towns, checked against reliable sources and local context.',
    aliases: ['place', 'places'],
  },
  {
    id: 'tips',
    label: 'Travel Tips',
    icon: Compass,
    blurb: 'Practical advice on routes, seasons, gear and getting around, with changing details clearly marked.',
    aliases: ['tip', 'tips', 'travel tip', 'travel tips'],
  },
  {
    id: 'interviews',
    label: 'Interviews',
    icon: Mic,
    blurb: 'A format for conversations with local guides, herders and hosts, kept in their own words. Nothing published here yet.',
    aliases: ['interview', 'interviews'],
  },
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
    blurb: 'A format for dated updates on road conditions, seasonal changes and other travel notes. Nothing published here yet.',
    aliases: ['news', 'travel news', 'update', 'updates'],
  },
];

function resolveStoryType(category?: string): string {
  const value = (category || '').toLowerCase();
  if (value.includes('interview')) return 'interviews';
  if (value.includes('news') || value.includes('update')) return 'news';
  if (value.includes('place') || value.includes('destination')) return 'places';
  return 'tips';
}

export function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>(fallbackBlogPosts);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(ALL_TOPICS);
  const [activeStoryType, setActiveStoryType] = useState(ALL_TYPES);

  useEffect(() => {
    let active = true;
    fetchBlogPosts(fallbackBlogPosts)
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

  const storyTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedPosts.forEach((post) => {
      const type = resolveStoryType(post.category);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [publishedPosts]);

  const storyScopedPosts = useMemo(
    () =>
      activeStoryType === ALL_TYPES
        ? publishedPosts
        : publishedPosts.filter((post) => resolveStoryType(post.category) === activeStoryType),
    [publishedPosts, activeStoryType]
  );

  const activeType = STORY_TYPES.find((type) => type.id === activeStoryType);

  // Topic refinement is a second, optional layer. It only earns its place once a
  // format is chosen and that format actually contains two or more topics that
  // say something the format label doesn't already say.
  const topicOptions = useMemo(() => {
    if (!activeType) {
      return [] as string[];
    }
    const aliases = new Set(activeType.aliases);
    const seen = new Set<string>();
    const options: string[] = [];
    storyScopedPosts.forEach((post) => {
      const label = (post.category || '').trim();
      const key = label.toLowerCase();
      if (!label || aliases.has(key) || seen.has(key)) {
        return;
      }
      seen.add(key);
      options.push(label);
    });
    return options;
  }, [activeType, storyScopedPosts]);

  const showTopicRefinement = topicOptions.length >= 2;
  const activeTopic =
    showTopicRefinement && topicOptions.includes(selectedTopic) ? selectedTopic : ALL_TOPICS;

  const visiblePosts = useMemo(
    () =>
      activeTopic === ALL_TOPICS
        ? storyScopedPosts
        : storyScopedPosts.filter((post) => (post.category || '').trim() === activeTopic),
    [storyScopedPosts, activeTopic]
  );

  // Every non-empty view gets a lead story, so the page keeps the same shape
  // when you switch formats instead of collapsing the featured slot.
  const leadPost = visiblePosts.find((post) => post.featured) || visiblePosts[0];
  const restPosts = leadPost ? visiblePosts.filter((post) => post !== leadPost) : [];

  const selectorBlurb = useMemo(() => {
    if (activeType) {
      return activeType.blurb;
    }
    const publishing = STORY_TYPES.filter((type) => (storyTypeCounts[type.id] || 0) > 0).map(
      (type) => type.label
    );
    const upcoming = STORY_TYPES.filter((type) => !(storyTypeCounts[type.id] || 0)).map(
      (type) => type.label
    );
    if (!publishing.length) {
      return 'Nothing is published yet. The four formats above are how we will organise the journal.';
    }
    if (!upcoming.length) {
      return `Publishing now: ${joinLabels(publishing)}.`;
    }
    return `Publishing now: ${joinLabels(publishing)}. Not published yet: ${joinLabels(upcoming)}.`;
  }, [activeType, storyTypeCounts]);

  function selectStoryType(id: string) {
    setActiveStoryType(id);
    setSelectedTopic(ALL_TOPICS);
  }

  const otherStockedTypes = STORY_TYPES.filter(
    (type) => type.id !== activeStoryType && (storyTypeCounts[type.id] || 0) > 0
  );

  let emptyHeading = 'Nothing to read in this view yet';
  let emptyBody = 'Pick another story type to see what is published.';
  if (activeTopic !== ALL_TOPICS) {
    emptyHeading = `Nothing under “${activeTopic}” yet`;
    emptyBody = `No story in this format is filed under “${activeTopic}”. Clearing the topic brings back everything in ${activeType ? activeType.label : 'this format'}.`;
  } else if (activeType?.id === 'interviews') {
    emptyHeading = 'No interviews published yet';
    emptyBody =
      'We have not published an interview yet. This format stays empty until we have a conversation we can publish in full, with the agreement of the person quoted.';
  } else if (activeType?.id === 'news') {
    emptyHeading = 'No travel updates published yet';
    emptyBody =
      'We have not published a travel update yet. When there is a dated change worth reporting — a road, a pass, a season — it will appear here.';
  } else if (activeType) {
    emptyHeading = `No ${activeType.label.toLowerCase()} published yet`;
    emptyBody = 'Nothing in this format has been published yet.';
  }

  const sectionHeading = activeType ? activeType.label : 'Latest stories';
  const sectionSubline = `${visiblePosts.length} published ${visiblePosts.length === 1 ? 'story' : 'stories'}${
    activeTopic === ALL_TOPICS ? '' : ` under “${activeTopic}”`
  }.`;

  return (
    <section className="editorial-content-page bg-background">
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

      <div className="page-editorial-hero border-b border-border bg-muted/60 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm uppercase tracking-[0.22em] text-secondary">Kyrgyzstan travel journal</p>

          {/* DOM order is the mobile order: headline, intro, story-type selector,
              then the planning CTA. On large screens the CTA moves into its own
              column so the left column stays a clean editorial masthead. */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            <div className="lg:col-start-1 lg:row-start-1">
              <h1 className="max-w-3xl text-3xl text-foreground sm:text-4xl lg:text-5xl">
                Stories, advice and local context for seeing Kyrgyzstan more deeply
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                A journal about travelling in Kyrgyzstan, written in four formats. Pick one to start
                reading.
              </p>
            </div>

            <div className="space-y-3 lg:col-start-1 lg:row-start-2">
              <h2
                id="story-type-heading"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Choose a story type
              </h2>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="story-type-heading">
                <Button
                  type="button"
                  variant={activeStoryType === ALL_TYPES ? 'default' : 'outline'}
                  aria-pressed={activeStoryType === ALL_TYPES}
                  onClick={() => selectStoryType(ALL_TYPES)}
                  className="min-h-11 rounded-md"
                >
                  All stories
                  <span className="text-xs tabular-nums opacity-75">{publishedPosts.length}</span>
                </Button>
                {STORY_TYPES.map((type) => {
                  const Icon = type.icon;
                  const count = storyTypeCounts[type.id] || 0;
                  const countLabel =
                    count === 0 ? 'none published yet' : count === 1 ? '1 story' : `${count} stories`;
                  return (
                    <Button
                      key={type.id}
                      type="button"
                      variant={activeStoryType === type.id ? 'default' : 'outline'}
                      aria-pressed={activeStoryType === type.id}
                      aria-label={`${type.label} — ${countLabel}`}
                      onClick={() => selectStoryType(type.id)}
                      className="min-h-11 gap-2 rounded-md"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {type.label}
                      <span className="text-xs tabular-nums opacity-75">{count}</span>
                    </Button>
                  );
                })}
              </div>
              <p
                className="min-h-12 max-w-2xl text-sm leading-6 text-muted-foreground"
                aria-live="polite"
              >
                {selectorBlurb}
              </p>
            </div>

            <aside className="flex items-center gap-3 rounded-md border border-border bg-card p-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mr-16 lg:flex-col lg:items-start lg:gap-0 lg:self-end lg:p-5 xl:mr-0">
              <BookOpen className="h-5 w-5 shrink-0 text-secondary lg:mb-3 lg:h-6 lg:w-6" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground lg:text-base">Prefer a finished plan?</p>
                <p className="mt-2 hidden text-sm leading-6 text-muted-foreground lg:block">
                  Once you've read enough, send your dates and interests. We'll turn the useful parts
                  into a realistic private itinerary.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="min-h-11 shrink-0 lg:hidden">
                <Link to="/feedback">Plan a trip</Link>
              </Button>
              <Button asChild className="mt-4 hidden min-h-11 lg:inline-flex">
                <Link to="/feedback">Ask for a trip plan</Link>
              </Button>
            </aside>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {errorMessage && (
          <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Showing the built-in guides. Live refresh was unavailable: {errorMessage}
          </p>
        )}

        {!leadPost ? (
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 sm:p-8">
            {activeType && (
              <activeType.icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            )}
            <h2 className="mt-3 text-xl text-foreground sm:text-2xl">{emptyHeading}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{emptyBody}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {activeTopic !== ALL_TOPICS ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => setSelectedTopic(ALL_TOPICS)}
                >
                  Show all {activeType ? activeType.label.toLowerCase() : 'stories'}
                </Button>
              ) : (
                otherStockedTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 gap-2"
                      onClick={() => selectStoryType(type.id)}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      Read {type.label} ({storyTypeCounts[type.id] || 0})
                    </Button>
                  );
                })
              )}
              {activeStoryType !== ALL_TYPES && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  onClick={() => selectStoryType(ALL_TYPES)}
                >
                  Browse all stories
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl text-foreground sm:text-3xl">{sectionHeading}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{sectionSubline}</p>
              </div>
              {showTopicRefinement && (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Refine ${sectionHeading} by topic`}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTopic === ALL_TOPICS ? 'default' : 'outline'}
                    aria-pressed={activeTopic === ALL_TOPICS}
                    onClick={() => setSelectedTopic(ALL_TOPICS)}
                    className="min-h-11"
                  >
                    {ALL_TOPICS}
                  </Button>
                  {topicOptions.map((topic) => (
                    <Button
                      key={topic}
                      type="button"
                      size="sm"
                      variant={activeTopic === topic ? 'default' : 'outline'}
                      aria-pressed={activeTopic === topic}
                      onClick={() => setSelectedTopic(topic)}
                      className="min-h-11"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <article className="grid overflow-hidden rounded-md border border-border bg-card shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
              <ResponsiveImage
                src={leadPost.coverImage || '/images/go-kyrgyzstan-hero-1080.webp'}
                alt={leadPost.coverImageAlt || leadPost.title}
                width={1080}
                height={720}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-80"
              />
              <div className="flex flex-col justify-center p-5 sm:p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  {leadPost.featured ? 'Featured story' : 'Most recent'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">
                    {leadPost.category || 'Travel Guide'}
                  </span>
                  <span>{leadPost.readTime || 'Practical guide'}</span>
                  {formatDate(leadPost.publishedAt || leadPost.createdAt) && (
                    <span>{formatDate(leadPost.publishedAt || leadPost.createdAt)}</span>
                  )}
                </div>
                <h3 className="mt-4 text-2xl text-foreground sm:text-3xl">{leadPost.title}</h3>
                <p className="mt-4 leading-7 text-muted-foreground">{leadPost.excerpt}</p>
                <Link
                  to={blogPath(leadPost)}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline"
                >
                  Read the full guide
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>

            {restPosts.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  More stories
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {restPosts.map((post) => {
                    const postType = STORY_TYPES.find((type) => type.id === resolveStoryType(post.category));
                    const PostIcon = postType?.icon;
                    return (
                      <article
                        key={post.id}
                        className="group interactive-card card-hover flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm"
                      >
                        <Link to={blogPath(post)} className="overflow-hidden">
                          <img
                            src={withBasePath(post.coverImage || '/images/go-kyrgyzstan-hero-720.webp')}
                            alt={post.coverImageAlt || post.title}
                            width={960}
                            height={640}
                            loading="lazy"
                            decoding="async"
                            className="card-media h-52 w-full object-cover"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 text-secondary">
                              {PostIcon && <PostIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                              {post.category || 'Travel Guide'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              {post.readTime || 'Guide'}
                            </span>
                            {formatDate(post.publishedAt || post.createdAt) && (
                              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                            )}
                          </div>
                          <h4 className="mt-3 text-2xl text-foreground">
                            <Link to={blogPath(post)} className="card-title-link">
                              {post.title}
                              <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </Link>
                          </h4>
                          <p className="mt-3 flex-1 leading-7 text-muted-foreground">{post.excerpt}</p>
                          <Link
                            to={blogPath(post)}
                            className="card-cta mt-5 min-h-11 text-sm font-medium text-primary"
                          >
                            Read guide
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
