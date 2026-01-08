import { CTA } from '../components/CTA';
import { Features } from '../components/Features';
import { Hero } from '../components/Hero';
import { Testimonials } from '../components/Testimonials';
import { ToursGrid } from '../components/ToursGrid';
import { Reveal } from '../components/Reveal';
import { SEO } from '../components/SEO';
import { useToursData } from '../hooks/useTours';

export function HomePage() {
  const { tours, loading, error } = useToursData();

  return (
    <>
      <SEO
        title="Home"
        description="Discover curated tours, cultural experiences, and mountain adventures across Kyrgyzstan."
      />
      <Hero />
      <Reveal>
        <Features />
      </Reveal>
      <Reveal delayMs={100}>
        <ToursGrid tours={tours} loading={loading} error={error} />
      </Reveal>
      <Reveal delayMs={150}>
        <Testimonials />
      </Reveal>
      <Reveal delayMs={200}>
        <CTA />
      </Reveal>
    </>
  );
}
