import { MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export function StickyLeadCTA() {
  const { pathname } = useLocation();
  const hiddenRoutes = ['/feedback', '/custom-tour', '/admin', '/auth', '/dashboard'];
  const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Need help choosing?</p>
            <p className="truncate text-xs text-muted-foreground">Leave Telegram or phone.</p>
          </div>
        </div>
        <Button asChild className="btn-micro btn-action shrink-0">
          <Link
            to="/feedback"
            data-track-event="sticky_mobile_lead_click"
            data-track-label="Mobile sticky lead CTA"
          >
            Request
          </Link>
        </Button>
      </div>
    </div>
  );
}
