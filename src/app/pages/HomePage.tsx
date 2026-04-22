import { AboutMe } from '../components/AboutMe';
import { CTA } from '../components/CTA';
import { ContactStrip } from '../components/ContactStrip';
import { FAQ } from '../components/FAQ';
import { Features } from '../components/Features';
import { Hero } from '../components/Hero';
import { GallerySection } from '../components/GallerySection';
import { Highlights } from '../components/Highlights';
import { HowItWorks } from '../components/HowItWorks';
import { Reveal } from '../components/Reveal';
import { SEO } from '../components/SEO';
import { ToursGrid } from '../components/ToursGrid';
import { useToursData } from '../hooks/useTours';

export function HomePage() {
  const { tours, loading, error } = useToursData();

  return (
    <>
      <SEO
        title="Home"
        description="Private guide and custom tours across Kyrgyzstan, from mountain treks to cultural stays."
      />
      <Hero />
      <Reveal>
        <AboutMe />
      </Reveal>
      <Reveal delayMs={100}>
        <Features />
      </Reveal>
      <Reveal delayMs={150}>
        <Highlights />
      </Reveal>
      <Reveal delayMs={200}>
        <GallerySection />
      </Reveal>
      <Reveal delayMs={250}>
        <ToursGrid tours={tours} loading={loading} error={error} />
      </Reveal>
      <Reveal delayMs={300}>
        <HowItWorks />
      </Reveal>
      <Reveal delayMs={350}>
        <FAQ />
      </Reveal>
      <Reveal delayMs={400}>
        <CTA />
      </Reveal>
      <Reveal delayMs={450}>
        <ContactStrip />
      </Reveal>
    </>
  );
}
