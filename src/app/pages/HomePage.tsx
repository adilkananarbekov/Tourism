import { ContactStrip } from '../components/ContactStrip';
import { Hero } from '../components/Hero';
import { LandingNavigation } from '../components/LandingNavigation';
import { Reveal } from '../components/Reveal';
import { SEO } from '../components/SEO';

export function HomePage() {
  return (
    <>
      <SEO
        title="Home"
        description="Private Kyrgyzstan tours with fast website requests and personal follow-up on Telegram or by phone."
      />
      <Hero />
      <Reveal>
        <LandingNavigation />
      </Reveal>
      <Reveal delayMs={100}>
        <ContactStrip />
      </Reveal>
    </>
  );
}
