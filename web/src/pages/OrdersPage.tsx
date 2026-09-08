import { motion } from 'framer-motion';
import { Mail, MessageCircle, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDeleteOrder, useListOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { money } from '../lib/bakery-data';
import { ConfirmDialog } from '../components/ConfirmDialog';

const statuses = ['new', 'confirmed', 'in progress', 'ready', 'completed', 'cancelled'];

export function OrdersPage() {
  const ordersQuery = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const [filter, setFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const confirmRemove = () => {
    if (deleteTarget) deleteOrder.mutate({ id: deleteTarget.id }, { onSuccess: () => ordersQuery.refetch() });
    setDeleteTarget(null);
  };
  const orders: Order[] = ordersQuery.data ?? [];
  const filtered = useMemo(
    () => (filter === 'All' ? orders : orders.filter((order) => order.status === filter)),
    [filter, orders],
  );

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><ShoppingBag size={17} /> Order book</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Orders</h1>
          <p className="mt-3 text-sm text-muted-foreground">Every quote a customer has sent, in one place.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Show</span>
        {['All', ...statuses].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-2 text-xs capitalize transition-colors ${filter === value ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground/35'}`}
            data-testid={`button-order-filter-${value.toLowerCase().replaceAll(' ', '-')}`}
          >
            {value}
          </button>
        ))}
      </div>

      {ordersQuery.isLoading ? (
        <div className="mt-7 rounded-2xl border border-border bg-card p-14 text-center">
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-border bg-card p-14 text-center">
          <p className="font-display text-2xl">No orders here yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Orders show up here as soon as a customer sends one from checkout.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-4">
          {filtered.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .35, delay: index * .04 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
              data-testid={`card-order-${order.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">{order.reference}</p>
                  <p className="mt-1 text-base font-semibold">{order.customerName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{order.phone}{order.email ? ` · ${order.email}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus.mutate({ id: order.id, data: { status: event.target.value } })}
                    className="h-9 rounded-full border border-border bg-background px-3 text-xs capitalize outline-none focus:border-primary"
                    data-testid={`select-order-status-${order.id}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setDeleteTarget(order)}
                    aria-label={`Delete order ${order.reference}`}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10"
                    data-testid={`button-delete-order-${order.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">{order.channel === 'whatsapp' ? <MessageCircle size={13} /> : <Mail size={13} />} Sent via {order.channel}</span>
                <span className="capitalize">{order.fulfillment}{order.fulfillment === 'delivery' && order.address ? `: ${order.address}` : ''}</span>
                {order.eventDate && <span>For {order.eventDate}</span>}
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>

              <div className="mt-4 divide-y divide-border border-t border-border">
                {order.lineItems.map((line) => (
                  <div key={line.label} className="flex justify-between py-2 text-sm">
                    <span>{line.label}</span>
                    <span className="font-mono-ui text-xs">{line.amount ? money(line.amount) : 'Included'}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono-ui" data-testid={`text-order-total-${order.id}`}>{money(order.total)}</span>
              </div>
              {order.notes && <p className="mt-3 text-xs text-muted-foreground">Notes: {order.notes}</p>}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Delete order ${deleteTarget?.reference}?`}
        description="This removes it from the order book for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
