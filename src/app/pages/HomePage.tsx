import { AboutMe } from '../components/AboutMe';
import { CTASection } from '../components/CTASection';
import { ContactStrip } from '../components/ContactStrip';
import { Hero } from '../components/Hero';
import { HotToursSection } from '../components/HotToursSection';
import { LandingNavigation } from '../components/LandingNavigation';
import { Reveal } from '../components/Reveal';
import { SectionTransition } from '../components/SectionTransition';
import { SEO } from '../components/SEO';
import { SEOContent } from '../components/SEOContent';
import { TripIdeas } from '../components/TripIdeas';
import { breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from '../lib/seo';
import { localeAlternates } from '../lib/locale';

export function HomePage() {
  return (
    <>
      <SEO
        title="Kyrgyzstan Tours & Private Trips"
        description="Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Ala-Archa, horse riding, yurt camps, Silk Road routes, private mountain trips, and canyon lake views."
        path="/"
        alternates={localeAlternates('/')}
        jsonLd={[
          organizationJsonLd(),
          websiteJsonLd(),
          breadcrumbJsonLd([{ name: 'Home', path: '/' }]),
        ]}
      />
      <div className="home-flow">
        <Hero />
        <Reveal className="section-reveal">
          <SectionTransition />
          <HotToursSection />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <TripIdeas />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition />
          <LandingNavigation />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <AboutMe />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition />
          <CTASection />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <SEOContent />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition />
          <ContactStrip />
        </Reveal>
      </div>
    </>
  );
}
