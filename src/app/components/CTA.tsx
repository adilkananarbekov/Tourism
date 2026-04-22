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
          Ready to Request Your Kyrgyz Tour?
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-10 leading-relaxed">
          Choose a signature tour or describe your route. Your request goes to Kyrgyz Riders, then I or my managers contact you directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="btn-micro bg-white text-primary hover:bg-white/90 px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link to="/tours" data-track-event="cta_browse_tours_click" data-track-label="CTA browse tours">
              Browse All Tours
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="btn-micro bg-transparent hover:bg-white/10 text-white border-2 border-white hover:border-white px-6 py-4 text-base sm:px-8 sm:py-6 sm:text-lg w-full sm:w-auto"
          >
            <Link
              to="/custom-tour"
              data-track-event="cta_custom_request_click"
              data-track-label="CTA custom request"
            >
              Custom Request
            </Link>
          </Button>
        </div>
        <p className="mt-8 text-white/80 text-sm">
          Have questions? <Link to="/feedback" className="underline hover:text-white">Send a trip request</Link>
        </p>
      </div>
    </section>
  );
}
