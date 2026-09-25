import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Reveal } from './Reveal';

export function CTASection() {
  return (
    <section className="relative my-12 overflow-hidden border-y border-white/10 bg-[var(--site-surface-dark)] px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-4xl relative z-10 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-green-on-dark)]">
            One route, planned around you
          </p>
          <h2 className="mb-6 font-heading text-3xl font-bold text-[var(--site-text-on-dark)] md:text-5xl">
            Ready to Explore the Mountains of Tien Shan?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--site-muted-on-dark)] md:text-xl">
            Whether you want a challenging trek to Ala-Kul or a relaxing stay at a yurt camp in Song-Kul, we'll organize the perfect private tour for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="btn-action h-14 rounded px-8 py-6 text-base transition-all hover:-translate-y-1 hover:shadow-xl">
              <Link to="/feedback">
                Plan My Trip <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded border-white/30 bg-white/5 px-8 py-6 text-base text-white transition-all hover:bg-white/10 hover:text-white">
              <Link to="/tours">
                View All Tours
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
