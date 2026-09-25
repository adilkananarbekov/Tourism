import { Map, MessageCircle, Route, Search, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ResponsiveImage } from './ResponsiveImage';
import { HeroAtmosphere } from './HeroAtmosphere';

export function Hero() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const trustItems = [
    { icon: MessageCircle, label: 'Direct contact' },
    { icon: Route, label: 'Flexible dates' },
    { icon: Map, label: 'Local planning' },
    { icon: Send, label: 'Telegram follow-up' },
  ];

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/tours?q=${encodeURIComponent(query)}` : '/tours');
  };

  return (
    <section className="hero-surface relative min-h-[560px] sm:min-h-[600px] md:min-h-[660px] lg:min-h-[720px] flex items-center justify-center overflow-hidden">
      <ResponsiveImage
        src="/images/go-kyrgyzstan-hero.webp"
        variants={[
          { src: '/images/go-kyrgyzstan-hero-720.webp', width: 720 },
          { src: '/images/go-kyrgyzstan-hero-1080.webp', width: 1080 },
        ]}
        mobileVariants={[
          { src: '/images/go-kyrgyzstan-hero-720.webp', width: 720 },
        ]}
        sizes="100vw"
        alt=""
        width={1080}
        height={1080}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover hero-parallax hero-main-photo"
      />
      <div className="hero-wash absolute inset-0" />
      <HeroAtmosphere />

      {/* Content */}
      <div className="hero-content relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
        <div className="hero-copy">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6">
            Private Kyrgyzstan Tours & Mountain Trips
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
            Flexible tours for international travelers: mountain lakes, nomad culture,
            horse riding, Silk Road routes, and road trips from Bishkek or Osh.
          </p>
        </div>
        <form
          className="hero-search mx-auto mt-8 max-w-2xl rounded-2xl p-2 flex flex-col sm:flex-row gap-2"
          onSubmit={handleSearch}
          role="search"
        >
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="hero-search-icon h-5 w-5" />
            </div>
            <input
              type="text"
              aria-label="Search Kyrgyzstan tours"
              placeholder="Where do you want to go? (e.g. Issyk Kul, Song Kul)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="hero-search-input w-full h-12 sm:h-14 bg-transparent border-none focus:ring-0 px-12 outline-none text-base sm:text-lg"
            />
          </div>
          <Button
            type="submit"
            className="h-12 sm:h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg rounded-xl shrink-0 transition-transform active:scale-95"
          >
            Find Tours
          </Button>
        </form>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/85">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.label}
                className="hero-trust-chip inline-flex min-h-[36px] items-center gap-2 rounded-full px-3 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
