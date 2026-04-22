import { AboutMe } from '../components/AboutMe';
import { CTA } from '../components/CTA';
import { ContactStrip } from '../components/ContactStrip';
import { FAQ } from '../components/FAQ';
import { Features } from '../components/Features';
import { Hero } from '../components/Hero';
import { GallerySection } from '../components/GallerySection';
import { Highlights } from '../components/Highlights';
import { HowItWorks } from '../components/HowItWorks';
import { JourneyStory } from '../components/JourneyStory';
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
        <JourneyStory />
      </Reveal>
      <Reveal delayMs={150}>
        <Features />
      </Reveal>
      <Reveal delayMs={200}>
        <Highlights />
      </Reveal>
      <Reveal delayMs={250}>
        <GallerySection />
      </Reveal>
      <Reveal delayMs={300}>
        <ToursGrid tours={tours} loading={loading} error={error} />
      </Reveal>
      <Reveal delayMs={350}>
        <HowItWorks />
      </Reveal>
      <Reveal delayMs={400}>
        <FAQ />
      </Reveal>
      <Reveal delayMs={450}>
        <CTA />
      </Reveal>
      <Reveal delayMs={500}>
        <ContactStrip />
      </Reveal>
    </>
  );
}
