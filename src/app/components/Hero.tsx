import { Map, MessageCircle, Route, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { withBasePath } from '../lib/assets';

export function Hero() {
  const heroImage = withBasePath('/images/hero.jpg');
  const trustItems = [
    { icon: MessageCircle, label: 'Direct contact' },
    { icon: Route, label: 'Flexible dates' },
    { icon: Map, label: 'Local planning' },
    { icon: Send, label: 'Telegram follow-up' },
  ];

  return (
    <section className="relative min-h-[500px] sm:min-h-[540px] md:min-h-[600px] lg:min-h-[640px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 hero-parallax"
        style={{
          backgroundImage: `url('${heroImage}')`,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6">
          Private Tours in Kyrgyzstan
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
          A local seller for flexible mountain, lake, culture, and road-trip routes. Choose a tour or send a quick request, then we contact you on Telegram or by phone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link to="/tours">See Available Tours</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="btn-micro bg-white/10 hover:bg-white/20 text-white border-white hover:border-white px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg backdrop-blur-sm w-full sm:w-auto"
          >
            <Link to="/feedback">Send Quick Request</Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/85">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.label}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
