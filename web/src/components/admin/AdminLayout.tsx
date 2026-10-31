import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PiBell, PiCalculator, PiCheckCircle, PiMagnifyingGlass, PiPackage, PiReceipt, PiSignOut, PiSquaresFour, PiStorefront } from 'react-icons/pi';
import { Link, useLocation } from 'wouter';
import { useListInventory, useListOrders } from '@workspace/api-client-react';
import { ErrorBoundary } from '../error-boundary';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/use-session';
import logo from '@assets/logo.png';

const navGroups = [
  { label: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: PiSquaresFour }] },
  {
    label: 'Studio',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: PiReceipt },
      { href: '/admin/inventory', label: 'Inventory', icon: PiPackage },
      { href: '/admin/calculator', label: 'Cost calculator', icon: PiCalculator },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items);
const isActive = (location: string, href: string) => (href === '/admin' ? location === '/admin' : location === href || location.startsWith(`${href}/`));

type Notice = { id: string; title: string; subtitle: string; at?: string; href: string };

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const [search, setSearch] = useState('');
  const [seen, setSeen] = useState<string[]>([]);
  const { session } = useSession();
  const orders = useListOrders();
  const inventory = useListInventory();

  useEffect(() => setSidebarOpen(false), [location]);

  const notices = useMemo<Notice[]>(() => {
    const fresh = (orders.data ?? [])
      .filter((order) => order.status === 'new')
      .slice(-4)
      .reverse()
      .map((order) => ({ id: `order-${order.id}`, title: 'New order', subtitle: `${order.customerName} · ${order.reference}`, at: order.createdAt, href: '/admin/orders' }));
    const low = (inventory.data ?? [])
      .filter((item) => item.status !== 'healthy')
      .slice(0, 3)
      .map((item) => ({ id: `stock-${item.id}`, title: item.status === 'critical' ? 'Running out' : 'Low stock', subtitle: `${item.name}: ${item.quantity} ${item.unit} left`, href: '/admin/inventory' }));
    return [...fresh, ...low];
  }, [orders.data, inventory.data]);
  const unread = notices.filter((notice) => !seen.includes(notice.id));

  const currentPage = allItems.find((item) => isActive(location, item.href));
  const filteredGroups = search.trim()
    ? navGroups.map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())) })).filter((group) => group.items.length > 0)
    : navGroups;
  const email = session?.user.email ?? 'Studio';

  return (
    <div className="relative flex h-screen overflow-hidden bg-muted/60 lg:gap-4 lg:p-4">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col bg-card shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-border/60 lg:shadow-sm`}
      >
        <button className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-[96px] shrink-0 items-center px-6">
          <Link href="/admin" className="flex items-center gap-3" data-testid="link-admin-brand">
            <img src={logo} alt="Dzilicious Bakery & More" className="h-14 w-auto object-contain mix-blend-multiply" />
          </Link>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto p-4" aria-label="Studio navigation">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(location, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      data-testid={`link-admin-${label.toLowerCase().replaceAll(' ', '-')}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" /> {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 p-4 pt-2">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground" data-testid="link-view-storefront">
            <PiStorefront className="h-[18px] w-[18px] shrink-0" /> View storefront
          </Link>
          <button
            onClick={() => { supabase?.auth.signOut(); navigate('/login'); }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            data-testid="button-sign-out"
          >
            <PiSignOut className="h-[18px] w-[18px] shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex w-full min-w-0 flex-1 flex-col">
        <header className="relative flex h-[72px] shrink-0 items-center justify-between px-3 lg:px-2">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground shadow-sm hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="group relative hidden sm:block">
              <PiMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search menu..."
                className="rounded-full border border-border bg-card/80 py-2.5 pl-11 pr-6 text-[13px] backdrop-blur-md placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card/80 px-5 py-2.5 shadow-sm backdrop-blur-md sm:flex">
              <span className="text-[12px] font-medium text-muted-foreground">Studio</span>
              {currentPage && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[12px] font-medium text-primary">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate rounded-full border border-border bg-card/80 px-4 py-2.5 text-[12px] text-muted-foreground shadow-sm md:block">{email}</span>
            <button
              onClick={() => setShowNotices((open) => !open)}
              aria-label="Notifications"
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${showNotices ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground'}`}
              data-testid="button-notifications"
            >
              <PiBell className="h-5 w-5" />
              {unread.length > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-muted" />}
            </button>

            <AnimatePresence>
              {showNotices && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotices(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(380px,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-8px_rgba(20,30,30,0.25)]"
                  >
                    <div className="flex items-center justify-between px-5 pb-3 pt-4">
                      <h3 className="font-display text-[15px] font-medium">Notifications</h3>
                      {unread.length > 0 && <button onClick={() => setSeen(notices.map((notice) => notice.id))} className="text-xs text-primary hover:underline">Mark all as read</button>}
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {notices.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                          <PiCheckCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">You’re all caught up</p>
                        </div>
                      ) : (
                        notices.map((notice) => (
                          <button
                            key={notice.id}
                            onClick={() => { setSeen((current) => [...current, notice.id]); setShowNotices(false); navigate(notice.href); }}
                            className="flex w-full gap-3 border-t border-border/50 px-5 py-3 text-left transition-colors first:border-t-0 hover:bg-muted/60"
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${seen.includes(notice.id) ? 'bg-transparent' : 'bg-primary'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className={`truncate text-[13px] ${seen.includes(notice.id) ? 'text-muted-foreground' : 'font-medium'}`}>{notice.title}</p>
                                {notice.at && <span className="shrink-0 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(notice.at), { addSuffix: true })}</span>}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{notice.subtitle}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border/60 bg-card shadow-[0_2px_12px_hsl(0_0%_72%_/_0.25)] lg:rounded-2xl">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <ErrorBoundary resetKey={location}>
              <div className="mx-auto max-w-[1500px] p-4 md:p-6 lg:p-8">{children}</div>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
