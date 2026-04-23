import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from './ui/utils';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Tours', to: '/tours' },
    { label: 'Ideas', to: '/explore' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Contact', to: '/feedback' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur transition-all',
        isScrolled
          ? 'bg-card/95 border-b border-border shadow-sm'
          : 'bg-card/60 border-b border-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn('flex items-center justify-between transition-all', isScrolled ? 'h-14' : 'h-16')}>
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 via-emerald-700 to-orange-700 text-white shadow-md ring-1 ring-white/25">
              <span className="text-sm font-semibold">KT</span>
            </div>
            <span className="text-xl font-medium text-foreground">Kyrgyz Travel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn('nav-link text-sm', isActive && 'nav-link-active')
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button
              asChild
              className="btn-micro btn-action"
            >
              <Link
                to="/custom-tour"
                data-track-event="header_custom_request_click"
                data-track-label="Header custom request"
              >
                Custom Trip
              </Link>
            </Button>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 text-muted-foreground hover:text-foreground"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'text-left px-4 py-3 min-h-[44px] rounded-md transition-opacity text-base',
                      isActive
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground hover:opacity-80 hover:bg-muted'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="px-4 pt-2">
                <Button
                  asChild
                  className="w-full btn-micro btn-action"
                >
                  <Link
                    to="/custom-tour"
                    onClick={() => setMobileMenuOpen(false)}
                    data-track-event="mobile_custom_request_click"
                    data-track-label="Mobile custom request"
                  >
                    Custom Trip
                  </Link>
                </Button>
              </div>
              <div className="px-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
