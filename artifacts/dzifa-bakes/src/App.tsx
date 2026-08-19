import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppShell } from './components/AppShell';
import { AdminDashboard } from './pages/AdminDashboard';
import { EquipmentPage } from './pages/EquipmentPage';
import { InventoryPage } from './pages/InventoryPage';
import { InvoicePage } from './pages/InvoicePage';
import { Storefront } from './pages/Storefront';
import type { CakeQuote } from '@workspace/api-client-react';
import { readStoredCart, storeCart } from './lib/bakery-data';

const queryClient = new QueryClient();

function Router({ quote, setQuote }: { quote: CakeQuote | null; setQuote: (quote: CakeQuote | null) => void }) {
  return (
    <RoutedErrorBoundary>
      <AppShell cartCount={quote ? 1 : 0}>
        <Switch>
          <Route path="/" component={() => <Storefront onAddToCart={(nextQuote) => { setQuote(nextQuote); storeCart(nextQuote); }} />} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/inventory" component={InventoryPage} />
          <Route path="/admin/equipment" component={EquipmentPage} />
          <Route path="/invoice" component={() => <InvoicePage quote={quote} onClear={() => setQuote(null)} />} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [quote, setQuote] = useState<CakeQuote | null>(() => readStoredCart());
  useEffect(() => {
    if (quote) storeCart(quote);
  }, [quote]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router quote={quote} setQuote={setQuote} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
