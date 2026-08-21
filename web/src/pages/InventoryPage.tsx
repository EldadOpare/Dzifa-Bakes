import { AnimatePresence, motion } from 'framer-motion';
import { Boxes, Check, CircleAlert, Plus, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useCreateInventory, useListInventory } from '@workspace/api-client-react';
import type { InventoryInput, InventoryItem } from '@workspace/api-client-react';
import { fallbackInventory, money } from '../lib/bakery-data';

// --- Ingredient image imports ---
import imgCocoa       from '@assets/generated_images/ingredient-cocoa.jpg';
import imgButter      from '@assets/generated_images/ingredient-butter.jpg';
import imgVanilla     from '@assets/generated_images/ingredient-vanilla.jpg';
import imgGoldLeaf    from '@assets/generated_images/ingredient-gold-leaf.jpg';
import imgCakeBoards  from '@assets/generated_images/ingredient-cake-boards.jpg';
import imgCream       from '@assets/generated_images/ingredient-cream.jpg';
import imgFlour       from '@assets/generated_images/ingredient-flour.jpg';
import imgSugar       from '@assets/generated_images/ingredient-sugar.jpg';
import imgEggs        from '@assets/generated_images/ingredient-eggs.jpg';
import imgCreamCheese from '@assets/generated_images/ingredient-cream-cheese.jpg';
import imgRosewater   from '@assets/generated_images/ingredient-rosewater.jpg';
import imgPistachio   from '@assets/generated_images/ingredient-pistachio.jpg';

const blankForm: InventoryInput = { name: '', category: 'Dry goods', unit: 'kg', quantity: 0, reorderAt: 1, cost: 0 };

/** Return the best matching photo for a given ingredient name + category. */
function ingredientImage(name: string, category: string): string | null {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes('cocoa') || n.includes('chocolate')) return imgCocoa;
  if (n.includes('butter'))                           return imgButter;
  if (n.includes('vanilla'))                          return imgVanilla;
  if (n.includes('gold leaf'))                        return imgGoldLeaf;
  if (n.includes('board') || n.includes('box') || n.includes('pack')) return imgCakeBoards;
  if (n.includes('cream') && !n.includes('cheese') && !n.includes('buttercream')) return imgCream;
  if (n.includes('flour'))                            return imgFlour;
  if (n.includes('sugar') || n.includes('icing'))     return imgSugar;
  if (n.includes('egg'))                              return imgEggs;
  if (n.includes('cream cheese'))                     return imgCreamCheese;
  if (n.includes('rose') && !n.includes('petal'))     return imgRosewater;
  if (n.includes('rose petal') || n.includes('edible rose')) return imgRosewater;
  if (n.includes('pistachio'))                        return imgPistachio;
  if (n.includes('elderflower'))                      return imgRosewater;
  // Category-level fallbacks
  if (c.includes('chill') || c.includes('dairy'))    return imgCream;
  if (c.includes('dry'))                              return imgFlour;
  if (c.includes('flavour') || c.includes('flavor')) return imgVanilla;
  if (c.includes('finish') || c.includes('decor'))   return imgGoldLeaf;
  if (c.includes('pack'))                             return imgCakeBoards;
  return null;
}

export function InventoryPage() {
  const inventoryQuery = useListInventory();
  const createInventory = useCreateInventory();
  const [items, setItems] = useState<InventoryItem[]>(fallbackInventory);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InventoryInput>(blankForm);
  const liveItems = inventoryQuery.data ?? items;
  const filtered = useMemo(() => liveItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || item.status === filter.toLowerCase())), [filter, liveItems, search]);
  const needsAttention = useMemo(() => liveItems.filter((item) => item.status === 'low' || item.status === 'critical'), [liveItems]);
  const save = (event: FormEvent) => {
    event.preventDefault();
    const localItem: InventoryItem = { ...form, id: Date.now(), status: form.quantity <= form.reorderAt ? 'low' : 'healthy' };
    setItems((current) => [localItem, ...current]);
    createInventory.mutate({ data: form }, { onSuccess: () => inventoryQuery.refetch() });
    setForm(blankForm);
    setShowForm(false);
  };
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><Boxes size={17} /> Pantry ledger</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Inventory</h1>
          <p className="mt-3 text-sm text-muted-foreground">Know what’s on the shelf before the first whisk.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="button-add-inventory"><Plus size={16} /> Add ingredient</button>
      </div>

      {needsAttention.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent-foreground"><CircleAlert size={15} /> Needs attention</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needsAttention.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .4, delay: index * .07 }}
                className={`rounded-2xl border p-5 ${item.status === 'critical' ? 'border-destructive/40 bg-destructive/5' : 'border-accent/50 bg-accent/10'}`}
                data-testid={`spotlight-inventory-${item.id}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">On hand</span>
                  <span className="font-mono-ui">{item.quantity} {item.unit}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Reorder at</span>
                  <span className="font-mono-ui">{item.reorderAt} {item.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ingredients" className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" data-testid="input-search-inventory" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          {['All', 'Low', 'Critical'].map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-xs transition-colors ${filter === value ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground/35'}`} data-testid={`button-filter-${value.toLowerCase()}`}>{value}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-border bg-card p-14 text-center">
          <p className="font-display text-2xl">Nothing on that shelf.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another ingredient or category.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, index) => {
            const photo = ingredientImage(item.name, item.category);
            return (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ duration: .4, delay: index * .04 }}
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
                data-testid={`card-inventory-${item.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {photo ? (
                    <img
                      src={photo}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Boxes size={36} strokeWidth={1.2} className="text-muted-foreground/40" />
                    </div>
                  )}
                  {(item.status === 'low' || item.status === 'critical') && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${item.status === 'critical' ? 'bg-destructive' : 'bg-accent'}`} />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <StatusPill status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">On hand</span><span className="font-mono-ui">{item.quantity} {item.unit}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Reorder at</span><span className="font-mono-ui">{item.reorderAt} {item.unit}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Unit cost</span><span className="font-mono-ui">{money(item.cost)}</span></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-inventory-count">{filtered.length} of {liveItems.length} ingredients</span>
        <span>Last synced just now</span>
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
                  <p className="font-display text-lg text-primary">New line item</p>
                  <h2 className="mt-1 font-display font-medium text-2xl">Add to the pantry</h2>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground" aria-label="Close form" data-testid="button-close-inventory-form"><X size={18} /></button>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field label="Ingredient name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
                <Field label="Unit" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
                <NumberField label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
                <NumberField label="Reorder at" value={form.reorderAt} onChange={(value) => setForm({ ...form, reorderAt: value })} />
                <NumberField label="Unit cost (GHS)" value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} />
              </div>
              <button disabled={createInventory.isPending} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-inventory">
                {createInventory.isPending ? 'Saving…' : <><Check size={16} /> Save ingredient</>}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
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
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-semibold">{label}<input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></label>;
}
