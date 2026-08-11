import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Reveal } from './Reveal';

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 mt-12 mb-12">
      <div className="absolute inset-0 bg-primary z-0" />
      
      {/* Decorative background shapes */}
      <div className="cta-orb cta-orb--sunset absolute -top-24 -right-24 w-96 h-96 bg-secondary/30 rounded-full blur-3xl z-0" />
      <div className="cta-orb cta-orb--mist absolute -bottom-24 -left-24 w-72 h-72 bg-white/20 rounded-full blur-3xl z-0" />
      <div className="cta-route" aria-hidden="true">
        <span className="cta-route__marker" />
      </div>

      <Reveal>
        <div className="mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6 font-heading">
            Ready to Explore the Mountains of Tien Shan?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Whether you want a challenging trek to Ala-Kul or a relaxing stay at a yurt camp in Song-Kul, we'll organize the perfect private tour for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="h-14 bg-secondary hover:bg-secondary/90 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <Link to="/feedback">
                Plan My Trip <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-full px-8 py-6 text-lg backdrop-blur-md transition-all">
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
