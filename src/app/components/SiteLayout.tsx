import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollToTop } from './ScrollToTop';
import { AppToaster } from './AppToaster';
import { PageTransition } from './PageTransition';

export function SiteLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <ScrollToTop />
      <main className="flex-1">
        <PageTransition key={pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <AppToaster />
    </div>
  );
}
