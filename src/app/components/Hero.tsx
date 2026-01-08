import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function Hero() {
  return (
    <section className="relative min-h-[520px] sm:min-h-[600px] md:min-h-[680px] lg:min-h-[760px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 hero-parallax"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6">
          Discover the Heart of Central Asia
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
          Experience unforgettable adventures through Kyrgyzstan's majestic mountains, pristine lakes, and nomadic culture
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link to="/tours">Find Tours</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="btn-micro bg-white/10 hover:bg-white/20 text-white border-white hover:border-white px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg backdrop-blur-sm w-full sm:w-auto"
          >
            <Link to="/custom-tour">Create Your Tour</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
