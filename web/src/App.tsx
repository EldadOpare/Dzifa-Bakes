import { lazy, Suspense, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppShell } from './components/AppShell';
import { AdminLayout } from './components/admin/AdminLayout';
import { RequireAuth } from './components/RequireAuth';
import { InvoicePage } from './pages/InvoicePage';
import { LoginPage } from './pages/LoginPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProductPage } from './pages/ProductPage';
import { Storefront } from './pages/Storefront';
import { readStoredCart, storeCart, type CartEntry } from './lib/bakery-data';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));

const queryClient = new QueryClient();

function Router({ cart, setCart }: { cart: CartEntry | null; setCart: (cart: CartEntry | null) => void }) {
  const [location] = useLocation();
  const addToCart = (entry: CartEntry) => { setCart(entry); storeCart(entry); };

  // The studio side has its own layout: a sidebar instead of the storefront's top bar and footer.
  if (location.startsWith('/admin')) {
    return (
      <RoutedErrorBoundary>
        <RequireAuth>
          <AdminLayout>
            <Suspense fallback={<RouteFallback />}>
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/orders" component={OrdersPage} />
                <Route path="/admin/inventory" component={InventoryPage} />
                <Route path="/admin/calculator" component={CalculatorPage} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </AdminLayout>
        </RequireAuth>
      </RoutedErrorBoundary>
    );
  }

  return (
    <RoutedErrorBoundary>
      <AppShell cartCount={cart ? 1 : 0}>
        <Suspense fallback={<RouteFallback />}>
          <Switch>
            <Route path="/" component={() => <Storefront onAddToCart={addToCart} />} />
            <Route path="/cakes/:id" component={() => <ProductPage onAddToCart={addToCart} />} />
            <Route path="/portfolio" component={PortfolioPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/invoice" component={() => <InvoicePage cart={cart} onClear={() => setCart(null)} />} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RouteFallback() {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // A new page should start at the top, not wherever the last one was scrolled to.
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location]);
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [cart, setCart] = useState<CartEntry | null>(() => readStoredCart());
  useEffect(() => {
    if (cart) storeCart(cart);
  }, [cart]);
  useEffect(() => {
    document.getElementById('app-loader')?.classList.add('app-loader--hidden');
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router cart={cart} setCart={setCart} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
