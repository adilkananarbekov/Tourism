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
      <header className="bg-card/90 border-b border-border/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg text-foreground font-medium">
            Kyrgyz Riders Admin
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-card/80 border border-border rounded-lg p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link block px-3 py-2 rounded-md text-sm ${
                activeTab === item.tab ? 'admin-nav-link-active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="bg-card/90 border border-border rounded-lg p-6">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
