import { useEffect, useState } from 'react';
import { SEO } from '../components/SEO';
import { fetchBlogPosts } from '../lib/firestore';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  createdAt?: string;
}

const travelVideos = [
  {
    id: 'VJ5xZWVb4MI',
    title: 'Horse Trekking to Song Kol Lake',
    description: 'A glimpse into nomadic life and the high-alpine pastures of Song Kol.',
  },
  {
    id: 'u6v8T3q7wPc',
    title: 'Kyrgyzstan Travel Guide',
    description: 'Highlights from Issyk-Kul, Ala-Archa, and the Silk Road heritage.',
  },
];

export function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBlogPosts();
        setPosts(data);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to load blog posts.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Blogs"
        description="Read Kyrgyz Riders travel stories, guides, and the latest tourism news."
      />
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4">Travel Stories & News</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Stories, guides, and updates curated by our Kyrgyz adventure specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <p className="text-muted-foreground">Loading blog posts...</p>
          ) : errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">No blog posts yet.</p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="bg-card border border-border rounded-lg overflow-hidden">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-6 space-y-3">
                  <h2 className="text-2xl text-foreground">{post.title}</h2>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl text-foreground mb-2">Travel Videos</h2>
            <p className="text-muted-foreground">
              Watch Kyrgyzstan travel vlogs and get inspired for your next adventure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {travelVideos.map((video) => (
              <div key={video.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="w-full aspect-video">
                  <iframe
                    className="w-full h-full rounded-md"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div>
                  <p className="text-foreground font-medium">{video.title}</p>
                  <p className="text-muted-foreground text-sm">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
