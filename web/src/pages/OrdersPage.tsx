import { format } from 'date-fns';
import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PiChecks, PiClock, PiReceipt, PiShoppingBagOpen } from 'react-icons/pi';
import { useDeleteOrder, useListOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { money } from '../lib/bakery-data';
import { isOpenOrder, orderStatuses, statusTone } from '../lib/order-status';

export function OrdersPage() {
  const ordersQuery = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const orders = useMemo<Order[]>(() => [...(ordersQuery.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [ordersQuery.data]);
  const filtered = useMemo(
    () => orders.filter((order) =>
      (filter === 'all' || order.status === filter) &&
      `${order.customerName} ${order.reference} ${order.phone}`.toLowerCase().includes(search.toLowerCase())),
    [orders, filter, search],
  );
  const selected = orders.find((order) => order.id === openId) ?? null;

  const counts = {
    open: orders.filter((order) => isOpenOrder(order.status)).length,
    fresh: orders.filter((order) => order.status === 'new').length,
    ready: orders.filter((order) => order.status === 'ready').length,
    done: orders.filter((order) => order.status === 'completed').length,
  };

  const setStatus = (order: Order, status: string) => updateStatus.mutate({ id: order.id, data: { status } }, { onSuccess: () => ordersQuery.refetch() });
  const confirmRemove = () => {
    if (deleteTarget) deleteOrder.mutate({ id: deleteTarget.id }, { onSuccess: () => ordersQuery.refetch() });
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${filtered.length} of ${orders.length} orders`} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Open" value={counts.open} icon={PiShoppingBagOpen} note="Not yet completed" delay={0} />
        <StatCard label="New" value={counts.fresh} icon={PiClock} tone={counts.fresh > 0 ? 'warning' : 'default'} note="Waiting for a reply" delay={60} />
        <StatCard label="Ready" value={counts.ready} icon={PiReceipt} note="Ready for collection" delay={120} />
        <StatCard label="Completed" value={counts.done} icon={PiChecks} note="All time" delay={180} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, reference or phone" className="pl-9" data-testid="input-order-search" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-48" data-testid="select-order-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {orderStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {ordersQuery.isLoading ? (
        <div className="rounded-2xl border border-border p-14 text-center text-sm text-muted-foreground">Loading orders…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden lg:table-cell">For</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => setOpenId(order.id)} data-testid={`card-order-${order.id}`}>
                  <TableCell>
                    <p className="text-sm font-medium">{order.reference}</p>
                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">{order.lineItems[0]?.label ?? 'Custom cake'}{order.lineItems.length > 1 ? ` +${order.lineItems.length - 1} more` : ''}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{order.customerName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{order.phone}</p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{order.eventDate || '—'}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{format(new Date(order.createdAt), 'd MMM, HH:mm')}</TableCell>
                  <TableCell><Badge tone={statusTone[order.status] ?? 'neutral'}>{order.status}</Badge></TableCell>
                  <TableCell className="text-right text-sm tabular-nums" data-testid={`text-order-total-${order.id}`}>{money(order.total)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-14 text-center">
                    <p className="font-display text-lg">{orders.length === 0 ? 'No orders yet.' : 'No orders match.'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{orders.length === 0 ? 'Orders show up here as soon as a customer sends one from checkout.' : 'Try a different search or status.'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={selected != null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.customerName}</DialogTitle>
                <DialogDescription>{selected.reference} · received {format(new Date(selected.createdAt), 'd MMM yyyy, HH:mm')}</DialogDescription>
              </DialogHeader>

              <div className="mb-5 flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Select value={selected.status} onValueChange={(status) => setStatus(selected, status)}>
                  <SelectTrigger className="h-9 w-44" data-testid={`select-order-status-${selected.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-muted/50 p-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{selected.phone}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="truncate">{selected.email || '—'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Event date</dt><dd>{selected.eventDate || '—'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Sent via</dt><dd className="capitalize">{selected.channel}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">{selected.fulfillment === 'delivery' ? 'Delivery to' : 'Collection'}</dt><dd>{selected.fulfillment === 'delivery' ? selected.address || 'Address to confirm' : 'Pickup at the Osu studio'}</dd></div>
              </dl>

              <div className="mt-5 divide-y divide-border">
                {selected.lineItems.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4 py-2.5 text-sm">
                    <span>{line.label}</span>
                    <span className="tabular-nums text-muted-foreground">{line.amount ? money(line.amount) : 'Included'}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{money(selected.subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Care & coordination</span><span className="tabular-nums">{money(selected.serviceFee)}</span></div>
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="tabular-nums">{money(selected.total)}</span></div>
              </div>
              {selected.notes && <p className="mt-4 rounded-xl border border-border p-3 text-sm"><span className="text-xs text-muted-foreground">Notes</span><br />{selected.notes}</p>}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => { setDeleteTarget(selected); setOpenId(null); }} data-testid={`button-delete-order-${selected.id}`}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete order
                </Button>
                <Button size="sm" onClick={() => setOpenId(null)}>Done</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Delete order ${deleteTarget?.reference}?`}
        description="This removes it from the order book for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
