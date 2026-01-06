import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { AuthStatus } from './AuthStatus';
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
    { label: 'Explore', to: '/explore' },
    { label: 'Join Tour', to: '/join-tour' },
    { label: 'Blogs', to: '/blogs' },
    { label: 'Feedback', to: '/feedback' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Submit Tour', to: '/create-tour' },
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
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground">KR</span>
            </div>
            <span className="text-xl text-foreground">Kyrgyz Riders</span>
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
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link to="/custom-tour">Plan Your Tour</Link>
            </Button>
            <ThemeToggle />
            <AuthStatus />
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
                  className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link to="/custom-tour" onClick={() => setMobileMenuOpen(false)}>
                    Plan Your Tour
                  </Link>
                </Button>
              </div>
              <div className="px-4">
                <ThemeToggle />
              </div>
              <div className="px-4">
                <AuthStatus />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
