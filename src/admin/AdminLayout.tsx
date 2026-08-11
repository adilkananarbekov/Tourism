import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpenText,
  CalendarCheck2,
  ExternalLink,
  FileText,
  Image,
  LayoutDashboard,
  Map,
  MessageSquareText,
  Settings2,
  Users,
} from 'lucide-react';
import { Button } from '../app/components/ui/button';
import { PageTransition } from '../app/components/PageTransition';
import { clearAdminSession } from './auth';

const navItems = [
  { label: 'Overview', tab: 'overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Tours', tab: 'tours', to: '/admin/dashboard?tab=tours', icon: Map },
  { label: 'Sights', tab: 'sights', to: '/admin/dashboard?tab=sights', icon: Image },
  { label: 'Guides', tab: 'blogs', to: '/admin/dashboard?tab=blogs', icon: BookOpenText },
  { label: 'Custom leads', tab: 'requests', to: '/admin/dashboard?tab=requests', icon: FileText },
  { label: 'Bookings', tab: 'bookings', to: '/admin/dashboard?tab=bookings', icon: CalendarCheck2 },
  { label: 'Analytics', tab: 'events', to: '/admin/dashboard?tab=events', icon: BarChart3 },
  { label: 'Reviews', tab: 'feedback', to: '/admin/dashboard?tab=feedback', icon: MessageSquareText },
  { label: 'Users', tab: 'users', to: '/admin/dashboard?tab=users', icon: Users },
  { label: 'Site settings', tab: 'content', to: '/admin/dashboard?tab=content', icon: Settings2 },
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
          <div className="min-w-0">
            <Link to="/admin/dashboard" className="block truncate text-base font-medium text-foreground sm:text-lg">
              Go Kyrgyzstan Travel
            </Link>
            <p className="text-xs text-muted-foreground">Operations dashboard</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                View site
              </a>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 lg:gap-6">
        <aside className="admin-mobile-nav bg-card/80 border border-border rounded-lg p-2 lg:p-4 lg:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link flex min-h-11 items-center gap-2 whitespace-nowrap px-3 py-3 rounded-md text-sm lg:min-h-0 lg:py-2 ${
                activeTab === item.tab ? 'admin-nav-link-active' : ''
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
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
