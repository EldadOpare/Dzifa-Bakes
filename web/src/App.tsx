import { lazy, Suspense, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppShell } from './components/AppShell';
import { InvoicePage } from './pages/InvoicePage';
import { ProductPage } from './pages/ProductPage';
import { Storefront } from './pages/Storefront';
import { readStoredCart, storeCart, type CartEntry } from './lib/bakery-data';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage })));
const EquipmentPage = lazy(() => import('./pages/EquipmentPage').then((m) => ({ default: m.EquipmentPage })));

const queryClient = new QueryClient();

function Router({ cart, setCart }: { cart: CartEntry | null; setCart: (cart: CartEntry | null) => void }) {
  return (
    <RoutedErrorBoundary>
      <AppShell cartCount={cart ? 1 : 0}>
        <Suspense fallback={<RouteFallback />}>
          <Switch>
            <Route path="/" component={() => <Storefront onAddToCart={(entry) => { setCart(entry); storeCart(entry); }} />} />
            <Route path="/cakes/:id" component={() => <ProductPage onAddToCart={(entry) => { setCart(entry); storeCart(entry); }} />} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/inventory" component={InventoryPage} />
            <Route path="/admin/calculator" component={CalculatorPage} />
            <Route path="/admin/equipment" component={EquipmentPage} />
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
