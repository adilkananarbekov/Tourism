import { SeasonalHomeExperience } from '../components/SeasonalHomeExperience';
import { AboutMe } from '../components/AboutMe';
import { Reveal } from '../components/Reveal';
import { SectionTransition } from '../components/SectionTransition';
import { SEO } from '../components/SEO';
import { localeAlternates } from '../lib/locale';
import { breadcrumbJsonLd, organizationJsonLd } from '../lib/seo';

export function RussianHomePage() {
  return (
    <>
      <SEO
        title="Туры по Кыргызстану — частные поездки и горные маршруты"
        description="Частные туры по Кыргызстану: Иссык-Куль, Сон-Куль, Кель-Суу, конные маршруты, юрты и горные автопутешествия с локальной организацией."
        path="/ru"
        language="ru"
        alternates={localeAlternates('/')}
        jsonLd={[
          organizationJsonLd(),
          breadcrumbJsonLd([{ name: 'Главная', path: '/ru' }]),
        ]}
      />

      <div className="home-flow">
        <SeasonalHomeExperience />

        <Reveal className="section-reveal">
          <SectionTransition />
          <AboutMe />
        </Reveal>
      </div>
    </>
  );
}
