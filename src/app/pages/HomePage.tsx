import { AboutMe } from '../components/AboutMe';
import { ContactStrip } from '../components/ContactStrip';
import { LandingNavigation } from '../components/LandingNavigation';
import { Reveal } from '../components/Reveal';
import { SeasonalHomeExperience } from '../components/SeasonalHomeExperience';
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
        description="Book private Kyrgyzstan tours with local planning: Song-Kul, Issyk-Kul, Kel-Suu, horse riding, yurt camps, and flexible mountain road trips from Bishkek."
        path="/"
        alternates={localeAlternates('/')}
        jsonLd={[
          organizationJsonLd(),
          websiteJsonLd(),
          breadcrumbJsonLd([{ name: 'Home', path: '/' }]),
        ]}
      />
      <div className="home-flow">
        <SeasonalHomeExperience />
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <AboutMe />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition />
          <TripIdeas />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <LandingNavigation />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition />
          <SEOContent />
        </Reveal>
        <Reveal className="section-reveal">
          <SectionTransition className="section-transition--reverse" />
          <ContactStrip />
        </Reveal>
      </div>
    </>
  );
}
