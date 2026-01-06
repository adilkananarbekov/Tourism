import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function CTA() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-white mb-6">
          Ready for Your Kyrgyz Adventure?
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-10 leading-relaxed">
          Whether you choose one of our signature tours or create a custom journey, we'll help you discover the wonders of Kyrgyzstan
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="btn-micro bg-white text-primary hover:bg-white/90 px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link to="/tours">Browse All Tours</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="btn-micro bg-transparent hover:bg-white/10 text-white border-2 border-white hover:border-white px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link to="/custom-tour">Design Your Tour</Link>
          </Button>
        </div>
        <p className="mt-8 text-white/80 text-sm">
          Have questions? Contact us at <a href="mailto:info@kyrgyzriders.com" className="underline hover:text-white">info@kyrgyzriders.com</a>
        </p>
      </div>
    </section>
  );
}
