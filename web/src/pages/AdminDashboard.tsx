import { format, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';
import { PiArrowRight, PiCalculator, PiCoins, PiPackage, PiReceipt, PiShoppingBagOpen, PiStorefront, PiWarningCircle } from 'react-icons/pi';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'wouter';
import { useListInventory, useListOrders } from '@workspace/api-client-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { money } from '../lib/bakery-data';
import { isOpenOrder, orderStatuses, statusTone } from '../lib/order-status';

const PRIMARY = 'hsl(172 32% 31%)';
const STATUS_COLOURS: Record<string, string> = {
  new: 'hsl(172 32% 31%)',
  confirmed: 'hsl(199 70% 50%)',
  'in progress': 'hsl(38 90% 55%)',
  ready: 'hsl(152 55% 42%)',
  completed: 'hsl(210 10% 70%)',
  cancelled: 'hsl(8 62% 55%)',
};

export function AdminDashboard() {
  const ordersQuery = useListOrders();
  const inventoryQuery = useListInventory();
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const items = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data]);

  const live = orders.filter((order) => order.status !== 'cancelled');
  const revenue = live.reduce((sum, order) => sum + order.total, 0);
  const open = orders.filter((order) => isOpenOrder(order.status));
  const fresh = orders.filter((order) => order.status === 'new').length;
  const lowStock = items.filter((item) => item.status !== 'healthy');
  const critical = lowStock.filter((item) => item.status === 'critical').length;
  const categoryCount = new Set(items.map((item) => item.category)).size;

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => startOfDay(subDays(new Date(), 6 - index)));
    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const total = live.filter((order) => format(new Date(order.createdAt), 'yyyy-MM-dd') === key).reduce((sum, order) => sum + order.total, 0);
      return { day: format(day, 'EEE'), revenue: total };
    });
  }, [live]);

  const byStatus = orderStatuses.map((status) => ({ name: status, value: orders.filter((order) => order.status === status).length })).filter((entry) => entry.value > 0);
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const failed = ordersQuery.isError || inventoryQuery.isError;

  return (
    <div>
      <PageHeader title="Studio overview" subtitle="Dzilicious Bakery & More · orders, stock and takings at a glance" />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/admin/orders"><PiReceipt className="mr-1.5 h-4 w-4" />View orders</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/admin/inventory"><PiPackage className="mr-1.5 h-4 w-4" />Update stock</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/admin/calculator"><PiCalculator className="mr-1.5 h-4 w-4" />Cost a cake</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/"><PiStorefront className="mr-1.5 h-4 w-4" />Storefront</Link></Button>
      </div>

      {failed && <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-testid="status-dashboard-data">Couldn’t load everything from the studio. Check your connection and refresh.</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Order value" value={money(revenue)} icon={PiCoins} note={`${live.length} order${live.length === 1 ? '' : 's'} so far`} delay={0} />
        <StatCard label="Open orders" value={open.length} icon={PiShoppingBagOpen} note={fresh > 0 ? `${fresh} new, waiting for you` : 'Nothing new waiting'} delay={60} />
        <StatCard label="Low stock" value={lowStock.length} icon={PiWarningCircle} tone={lowStock.length > 0 ? 'warning' : 'default'} note={critical > 0 ? `${critical} running out` : 'Shelves look fine'} delay={120} />
        <StatCard label="Ingredients" value={items.length} icon={PiPackage} note={`${categoryCount} categories`} delay={180} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-display text-base font-medium">Order value, last 7 days</h3>
            <span className="text-xs text-muted-foreground">By the day the order came in</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={week}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210 14% 91%)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} allowDecimals={false} />
              <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, border: '1px solid hsl(210 14% 91%)', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-4 font-display text-base font-medium">Orders by status</h3>
          {byStatus.length === 0 ? (
            <div className="grid h-[200px] place-items-center text-center text-sm text-muted-foreground">No orders yet.<br />They’ll show up here.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                    {byStatus.map((entry) => <Cell key={entry.name} fill={STATUS_COLOURS[entry.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(210 14% 91%)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {byStatus.map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1.5 capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOURS[entry.name] }} />{entry.name} {entry.value}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-medium">Latest orders</h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary hover:underline">All orders <PiArrowRight /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Orders appear here as soon as a customer sends one.</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((order) => (
                <Link key={order.id} href="/admin/orders" className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{order.customerName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{order.reference}{order.eventDate ? ` · for ${order.eventDate}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Badge tone={statusTone[order.status] ?? 'neutral'}>{order.status}</Badge>
                    <span className="w-24 text-right text-sm tabular-nums">{money(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-medium">Needs restocking</h3>
            <Link href="/admin/inventory" className="flex items-center gap-1 text-xs text-primary hover:underline">Inventory <PiArrowRight /></Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Everything is above its reorder level.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{item.quantity} {item.unit} left · reorder at {item.reorderAt}</p>
                  </div>
                  <Badge tone={item.status === 'critical' ? 'danger' : 'warning'}>{item.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
