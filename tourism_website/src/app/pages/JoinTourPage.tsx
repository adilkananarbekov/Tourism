import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SEO } from '../components/SEO';

export function JoinTourPage() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Join Tour"
        description="Join a group tour, meet fellow travelers, and explore Kyrgyzstan together."
      />
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl text-foreground">Join a Group Tour</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Meet fellow travelers and share the journey. Choose a departure that fits your schedule,
          then request to join the group.
        </p>
        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 space-y-4">
          <p className="text-muted-foreground">
            Browse tours to see upcoming departures, or request a custom date and we will connect you
            with a small group.
          </p>
          <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/tours">Browse Tours</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
