import { AboutMe } from '../components/AboutMe';
import { ContactStrip } from '../components/ContactStrip';
import { Hero } from '../components/Hero';
import { LandingNavigation } from '../components/LandingNavigation';
import { Reveal } from '../components/Reveal';
import { SEO } from '../components/SEO';
import { SEOContent } from '../components/SEOContent';
import { TripIdeas } from '../components/TripIdeas';
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from '../lib/seo';

export function HomePage() {
  return (
    <>
      <SEO
        title="Kyrgyzstan Tours & Private Trips"
        description="Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Ala-Archa, horse riding, yurt camps, Silk Road routes, private mountain trips, and canyon lake views."
        path="/"
        jsonLd={[
          organizationJsonLd(),
          websiteJsonLd(),
          breadcrumbJsonLd([{ name: 'Home', path: '/' }]),
        ]}
      />
      <Hero />
      <Reveal>
        <LandingNavigation />
      </Reveal>
      <Reveal delayMs={100}>
        <TripIdeas />
      </Reveal>
      <Reveal delayMs={200}>
        <AboutMe />
      </Reveal>
      <Reveal delayMs={300}>
        <SEOContent />
      </Reveal>
      <Reveal delayMs={400}>
        <ContactStrip />
      </Reveal>
    </>
  );
}
