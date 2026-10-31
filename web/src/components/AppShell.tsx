import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { SiteFooter } from './SiteFooter';
import { useSession } from '../lib/use-session';
import logo from '@assets/logo.png';

type AppShellProps = { children: ReactNode; cartCount?: number };

const customerNav = [
  { href: '#showcase', label: 'The showcase' },
  { href: '#builder', label: 'Build yours' },
  { href: '/portfolio', label: 'Portfolio' },
];

// The storefront's frame: top bar and footer. The studio side has its own layout (see admin/AdminLayout).
export function AppShell({ children, cartCount = 0 }: AppShellProps) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useSession();

  // These sections only exist on the homepage. From anywhere else, go there first, then scroll.
  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (location !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLink = (href: string, label: string, className: string, onNavigate?: () => void) =>
    href.startsWith('#') ? (
      <a key={href} href={`/${href}`} onClick={(event) => { event.preventDefault(); goToSection(href.slice(1)); }} className={className} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
        {label}
      </a>
    ) : (
      <Link key={href} href={href} onClick={onNavigate} className={className} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
        {label}
      </Link>
    );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5 lg:px-8">
        <div className="mx-auto flex h-20 max-w-[1080px] items-center justify-between rounded-full border border-border bg-card/95 px-3 backdrop-blur-md sm:px-5">
          <Link href="/" className="flex items-center" data-testid="link-brand">
            <img src={logo} alt="Dzilicious Bakery & More" className="h-[4.5rem] w-auto object-contain mix-blend-multiply" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {customerNav.map(({ href, label }) => navLink(href, label, 'text-sm text-muted-foreground transition-colors hover:text-foreground'))}
          </nav>

          <div className="flex items-center gap-2">
            {session && (
              <Link href="/admin" className="hidden items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70 sm:flex" data-testid="link-back-to-studio">
                Back to studio
              </Link>
            )}
            <Link href="/invoice" className="relative flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm hover:bg-muted" data-testid="link-invoice">
              <ClipboardList size={15} strokeWidth={1.7} />
              <span className="hidden sm:inline">Your quote</span>
              {cartCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground" data-testid="text-cart-count">{cartCount}</span>}
            </Link>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Open menu" data-testid="button-mobile-menu">
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mt-2 max-w-[1080px] rounded-2xl border border-border bg-card/95 px-5 py-2 backdrop-blur-md md:hidden"
            >
              {customerNav.map(({ href, label }) => navLink(href, label, 'block border-b border-border/70 py-3 text-sm last:border-0', () => setMobileOpen(false)))}
              {session && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-muted-foreground" data-testid="link-mobile-back-to-studio">
                  Back to studio
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
