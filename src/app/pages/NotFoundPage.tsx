import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SEO } from '../components/SEO';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title="Page Not Found" description="The requested page could not be found." />
      <div className="text-center max-w-md">
        <h1 className="text-3xl sm:text-4xl mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you are looking for does not exist. Let us take you back to the journey.
        </p>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
