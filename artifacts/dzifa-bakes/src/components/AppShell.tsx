import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Boxes, CakeSlice, ClipboardList, Factory, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

type AppShellProps = { children: ReactNode; cartCount?: number };

const customerLinks = [{ href: '/', label: 'Build a cake', icon: CakeSlice }];
const staffLinks = [
  { href: '/admin', label: 'Overview', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/equipment', label: 'Equipment', icon: Factory },
];

export function AppShell({ children, cartCount = 0 }: AppShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = location.startsWith('/admin');
  const links = isAdmin ? staffLinks : customerLinks;

  return (
    <div className="page-grain min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <CakeSlice size={17} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block font-display text-[19px] leading-none tracking-[-.02em]">Dzifa Bakes</span>
              <span className="font-mono-ui mt-1 block text-[9px] uppercase tracking-[.2em] text-muted-foreground">Accra · Since 2018</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${location === href ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={15} strokeWidth={1.8} /> {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Link href="/invoice" className="relative flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm hover:bg-muted" data-testid="link-invoice">
                <ClipboardList size={16} strokeWidth={1.7} />
                <span className="hidden sm:inline">Your quote</span>
                {cartCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground" data-testid="text-cart-count">{cartCount}</span>}
              </Link>
            )}
            <Link href={isAdmin ? '/' : '/admin'} className="hidden items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70 sm:flex" data-testid="link-mode-switch">
              {isAdmin ? 'Customer view' : 'Staff view'} <ArrowRight size={14} />
            </Link>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Open menu" data-testid="button-mobile-menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
              <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="border-t border-border px-5 py-3 md:hidden">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 border-b border-border/70 py-3 text-sm" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>
                  <Icon size={16} /> {label}
                </Link>
              ))}
              <Link href={isAdmin ? '/' : '/admin'} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 text-sm text-muted-foreground" data-testid="link-mobile-mode-switch">
                <ArrowRight size={16} /> {isAdmin ? 'Customer view' : 'Staff view'}
              </Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      {children}
    </div>
  );
}