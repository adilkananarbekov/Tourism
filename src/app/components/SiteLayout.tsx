import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FloatingContact } from './FloatingContact';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollToTop } from './ScrollToTop';
import { AppToaster } from './AppToaster';
import { PageTransition } from './PageTransition';
import { EventTracker } from './EventTracker';
import { StickyLeadCTA } from './StickyLeadCTA';

export function SiteLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <EventTracker />
      <ScrollToTop />
      <main className="flex-1">
        <PageTransition key={pathname}>
          <Suspense
            fallback={
              <div className="min-h-[calc(100vh-4rem)] px-4 py-16 text-center text-muted-foreground">
                Loading…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
      <StickyLeadCTA />
      <FloatingContact />
      <AppToaster />
    </div>
  );
}
