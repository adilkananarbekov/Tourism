import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../app/components/ui/button';
import { PageTransition } from '../app/components/PageTransition';
import { clearAdminSession } from './auth';

const navItems = [
  { label: 'Overview', tab: 'overview', to: '/admin/dashboard' },
  { label: 'Tours', tab: 'tours', to: '/admin/dashboard?tab=tours' },
  { label: 'Sights', tab: 'sights', to: '/admin/dashboard?tab=sights' },
  { label: 'News', tab: 'blogs', to: '/admin/dashboard?tab=blogs' },
  { label: 'Requests', tab: 'requests', to: '/admin/dashboard?tab=requests' },
  { label: 'Bookings', tab: 'bookings', to: '/admin/dashboard?tab=bookings' },
  { label: 'Events', tab: 'events', to: '/admin/dashboard?tab=events' },
  { label: 'Feedback', tab: 'feedback', to: '/admin/dashboard?tab=feedback' },
  { label: 'Users', tab: 'users', to: '/admin/dashboard?tab=users' },
  { label: 'Content', tab: 'content', to: '/admin/dashboard?tab=content' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') ?? 'overview';

  const handleLogout = async () => {
    await clearAdminSession();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen admin-shell bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-card/95 border-b border-border/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="min-w-0 text-base text-foreground font-medium sm:text-lg">
            Go Kyrgyzstan Travel Admin
          </Link>
          <Button variant="outline" onClick={handleLogout} className="shrink-0">
            Sign Out
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 lg:gap-6">
        <aside className="admin-mobile-nav bg-card/80 border border-border rounded-lg p-2 lg:p-4 lg:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link block min-h-11 whitespace-nowrap px-3 py-3 rounded-md text-sm lg:min-h-0 lg:py-2 ${
                activeTab === item.tab ? 'admin-nav-link-active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0 bg-card/90 border border-border rounded-lg p-3 sm:p-5 lg:p-6">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
