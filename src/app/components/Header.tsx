import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { localizedPath, useSiteLocale } from '../lib/locale';
import { cn } from './ui/utils';
import { BrandMark } from './BrandMark';
import { useTheme } from '../hooks/useTheme';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const locale = useSiteLocale();
  const { mode } = useTheme();
  const isRussian = locale === 'ru';
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/ru';
  const usesOverlayLogo = isHome && !isScrolled && !mobileMenuOpen;
  const logoVariant = usesOverlayLogo || mode === 'dark' ? 'white' : 'color';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: isRussian ? 'Направления' : 'Destinations', to: localizedPath('/destinations/song-kul', locale) },
    { label: isRussian ? 'Сезонные туры' : 'Seasonal trips', to: localizedPath('/tours', locale) },
    ...(isRussian ? [] : [{ label: 'Travel planning', to: '/blogs' }]),
    ...(isRussian ? [] : [{ label: 'Gallery', to: '/gallery' }]),
  ];

  return (
    <header
      className={cn(
        'site-header z-50 transition-all',
        isHome ? 'site-header--home fixed inset-x-0 top-0' : 'sticky top-0',
        isScrolled || !isHome
          ? 'bg-card/95 border-b border-border shadow-sm'
          : 'site-header--transparent border-b border-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn('flex items-center justify-between transition-all', isScrolled ? 'h-16' : 'h-[76px]')}>
          {/* Logo */}
          <Link to={localizedPath('/', locale)} className="site-brand flex items-center" aria-label={isRussian ? 'kyrgyz.tours — главная' : 'kyrgyz.tours — home'}>
            <BrandMark variant={logoVariant} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-5 lg:flex xl:gap-7">
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
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to={localizedPath('/feedback', locale)} className="site-header-cta">
              {isRussian ? 'Спланировать тур' : 'Plan my trip'}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 text-current hover:opacity-80"
            aria-label={mobileMenuOpen ? (isRussian ? 'Закрыть меню' : 'Close menu') : (isRussian ? 'Открыть меню' : 'Open menu')}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="site-mobile-menu lg:hidden border-t border-border py-4">
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
              <div className="px-4">
                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
              <div className="px-4">
                <Link
                  to={localizedPath('/feedback', locale)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="site-header-cta w-full justify-center"
                >
                  {isRussian ? 'Спланировать тур' : 'Plan my trip'}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
