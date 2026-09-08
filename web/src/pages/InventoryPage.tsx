import { AnimatePresence, motion } from 'framer-motion';
import { Boxes, Check, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useCreateInventory, useDeleteInventory, useListInventory, useUpdateInventory } from '@workspace/api-client-react';
import type { InventoryInput, InventoryItem } from '@workspace/api-client-react';
import { fallbackInventory, money } from '../lib/bakery-data';
import { ConfirmDialog } from '../components/ConfirmDialog';

type FormState = InventoryInput & { measureUnit: string; unitsPerMeasure: number };

const blankForm: FormState = { name: '', category: 'Dry goods', unit: 'kg', quantity: 0, reorderAt: 1, cost: 0, measureUnit: '', unitsPerMeasure: 0 };
const PAGE_SIZE = 12;

function itemToForm(item: InventoryItem): FormState {
  return {
    name: item.name,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    reorderAt: item.reorderAt,
    cost: item.cost,
    measureUnit: item.measureUnit ?? '',
    unitsPerMeasure: item.unitsPerMeasure ?? 0,
  };
}

export function InventoryPage() {
  const inventoryQuery = useListInventory();
  const createInventory = useCreateInventory();
  const updateInventory = useUpdateInventory();
  const deleteInventory = useDeleteInventory();
  const [items, setItems] = useState<InventoryItem[]>(fallbackInventory);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const liveItems = inventoryQuery.data ?? items;
  const categories = useMemo(() => ['All', ...Array.from(new Set(liveItems.map((item) => item.category))).sort()], [liveItems]);
  const filtered = useMemo(() => liveItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || item.status === filter.toLowerCase()) && (categoryFilter === 'All' || item.category === categoryFilter)), [categoryFilter, filter, liveItems, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filter, categoryFilter]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const openAdd = () => {
    setEditingItem(null);
    setForm(blankForm);
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm(itemToForm(item));
    setShowForm(true);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const { measureUnit, unitsPerMeasure, ...input } = form;
    const payload = { ...input, measureUnit: measureUnit || undefined, unitsPerMeasure: unitsPerMeasure || undefined };
    if (editingItem) {
      updateInventory.mutate({ id: editingItem.id, data: payload }, { onSuccess: () => inventoryQuery.refetch() });
    } else {
      const isLow = form.reorderAt > 0 && form.quantity <= form.reorderAt;
      const localItem: InventoryItem = { ...payload, id: Date.now(), status: isLow ? 'low' : 'healthy' };
      setItems((current) => [localItem, ...current]);
      createInventory.mutate({ data: payload }, { onSuccess: () => inventoryQuery.refetch() });
    }
    setForm(blankForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const removeItem = (item: InventoryItem) => {
    setItems((current) => current.filter((existing) => existing.id !== item.id));
    deleteInventory.mutate({ id: item.id }, { onSuccess: () => inventoryQuery.refetch() });
  };

  const confirmRemove = () => {
    if (deleteTarget) removeItem(deleteTarget);
    setDeleteTarget(null);
  };

  const saving = createInventory.isPending || updateInventory.isPending;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><Boxes size={17} /> Pantry ledger</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Inventory</h1>
          <p className="mt-3 text-sm text-muted-foreground">Know what’s on the shelf before the first whisk.</p>
        </div>
        <button onClick={openAdd} className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="button-add-inventory"><Plus size={16} /> Add ingredient</button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ingredients" className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" data-testid="input-search-inventory" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          {['All', 'Low', 'Critical'].map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-xs transition-colors ${filter === value ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground/35'}`} data-testid={`button-filter-${value.toLowerCase()}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Category</span>
        {categories.map((value) => (
          <button key={value} onClick={() => setCategoryFilter(value)} className={`rounded-full px-3 py-2 text-xs transition-colors ${categoryFilter === value ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground/35'}`} data-testid={`button-category-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-border bg-card p-14 text-center">
          <p className="font-display text-2xl">Nothing on that shelf.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another ingredient or category.</p>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-border bg-muted/50">
              <tr className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                <th className="px-5 py-4">Ingredient</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">On hand</th>
                <th className="px-5 py-4">Reorder at</th>
                <th className="px-5 py-4">Unit cost</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={item.id}
                  className="border-b border-border last:border-0"
                  data-testid={`row-inventory-${item.id}`}
                >
                  <td className="px-5 py-4 text-sm font-semibold">{item.name}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{item.category}</td>
                  <td className="px-5 py-4 font-mono-ui text-xs">{item.quantity} {item.unit}</td>
                  <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{item.reorderAt} {item.unit}</td>
                  <td className="px-5 py-4 font-mono-ui text-xs" data-testid={`text-inventory-cost-${item.id}`}>
                    {money(item.cost)}
                    {item.previousCost != null && item.previousCost !== item.cost && (
                      <span className="ml-1.5 text-muted-foreground/60 line-through">{money(item.previousCost)}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">{item.status !== 'healthy' && <StatusPill status={item.status} />}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="text-muted-foreground hover:text-foreground" data-testid={`button-edit-inventory-${item.id}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} aria-label={`Remove ${item.name}`} className="text-muted-foreground hover:text-destructive" data-testid={`button-delete-inventory-${item.id}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-inventory-count">{filtered.length} ingredient{filtered.length === 1 ? '' : 's'}{filtered.length !== liveItems.length ? ` (of ${liveItems.length})` : ''}</span>
        {pageCount > 1 && (
          <div className="flex items-center gap-3">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30" aria-label="Previous page" data-testid="button-inventory-prev-page">
              <ChevronLeft size={14} />
            </button>
            <span data-testid="text-inventory-page">Page {page} of {pageCount}</span>
            <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30" aria-label="Next page" data-testid="button-inventory-next-page">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-5 backdrop-blur-sm" role="dialog" onClick={() => setShowForm(false)}>
            <motion.form
              initial={{ opacity: 0, y: 14, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: .98 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={save}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg text-primary">{editingItem ? 'Update line item' : 'New line item'}</p>
                  <h2 className="mt-1 font-display font-medium text-2xl">{editingItem ? `Edit ${editingItem.name}` : 'Add to the pantry'}</h2>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground" aria-label="Close form" data-testid="button-close-inventory-form"><X size={18} /></button>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field label="Ingredient name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
                <Field label="Bought by (unit)" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
                <NumberField label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
                <NumberField label="Reorder at" value={form.reorderAt} onChange={(value) => setForm({ ...form, reorderAt: value })} />
                <NumberField label="Unit cost (GHS)" value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} step="0.01" />
              </div>
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs font-semibold text-muted-foreground">Recipe measurement (optional)</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">If this is bought one way (like kg) but measured another way in a recipe (like cups), fill this in so the cost calculator can convert.</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Measured in a recipe as" value={form.measureUnit} onChange={(value) => setForm({ ...form, measureUnit: value })} />
                  <NumberField label={`${form.measureUnit || 'measures'} per ${form.unit || 'unit'}`} value={form.unitsPerMeasure} onChange={(value) => setForm({ ...form, unitsPerMeasure: value })} />
                </div>
              </div>
              <button disabled={saving} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-inventory">
                {saving ? 'Saving…' : <><Check size={16} /> {editingItem ? 'Save changes' : 'Save ingredient'}</>}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Remove ${deleteTarget?.name}?`}
        description="This takes it off the inventory list for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const critical = status === 'critical';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${critical ? 'bg-destructive/10 text-destructive' : status === 'low' ? 'bg-accent/25 text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
    </span>
  );
}
function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-xs font-semibold">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></label>;
}
function NumberField({ label, value, onChange, step = '0.1' }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return <label className="text-xs font-semibold">{label}<input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></label>;
}
