import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PiCoins, PiPackage, PiWarning, PiWarningCircle } from 'react-icons/pi';
import { useCreateInventory, useDeleteInventory, useListInventory, useUpdateInventory } from '@workspace/api-client-react';
import type { InventoryInput, InventoryItem } from '@workspace/api-client-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadField } from '../components/ImageUploadField';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { money } from '../lib/bakery-data';
import { suggestCupsPerUnit } from '../lib/measures';

type FormState = InventoryInput & { measureUnit: string; unitsPerMeasure: number };

const blankForm: FormState = { name: '', category: 'Dry goods', unit: 'kg', quantity: 0, reorderAt: 1, cost: 0, imageUrl: '', measureUnit: '', unitsPerMeasure: 0 };
const PAGE_SIZE = 12;

const itemToForm = (item: InventoryItem): FormState => ({
  name: item.name,
  category: item.category,
  unit: item.unit,
  quantity: item.quantity,
  reorderAt: item.reorderAt,
  cost: item.cost,
  imageUrl: item.imageUrl ?? '',
  measureUnit: item.measureUnit ?? '',
  unitsPerMeasure: item.unitsPerMeasure ?? 0,
});

export function InventoryPage() {
  const inventoryQuery = useListInventory();
  const createInventory = useCreateInventory();
  const updateInventory = useUpdateInventory();
  const deleteInventory = useDeleteInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [suggestNote, setSuggestNote] = useState('');

  const items = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data]);
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items]);
  const filtered = useMemo(
    () => items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === 'all' || item.status === statusFilter) &&
      (categoryFilter === 'all' || item.category === categoryFilter)),
    [items, search, statusFilter, categoryFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, statusFilter, categoryFilter]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const low = items.filter((item) => item.status === 'low').length;
  const critical = items.filter((item) => item.status === 'critical').length;
  const repriced = items.filter((item) => item.previousCost != null && item.previousCost !== item.cost).length;

  const openAdd = () => { setEditingItem(null); setForm(blankForm); setSuggestNote(''); setShowForm(true); };
  const openEdit = (item: InventoryItem) => { setEditingItem(item); setForm(itemToForm(item)); setSuggestNote(''); setShowForm(true); };

  const suggestMeasure = () => {
    const cups = suggestCupsPerUnit(form.name, form.unit);
    if (cups == null) {
      setSuggestNote('Couldn’t guess that one. Enter the number yourself, for example by measuring a cup of it on the scale.');
      return;
    }
    setForm({ ...form, measureUnit: 'cup', unitsPerMeasure: cups });
    setSuggestNote(`A good starting point: about ${cups} cups per ${form.unit}. Adjust it if your cup holds more or less.`);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const { measureUnit, unitsPerMeasure, ...input } = form;
    const payload = { ...input, imageUrl: input.imageUrl || undefined, measureUnit: measureUnit || undefined, unitsPerMeasure: unitsPerMeasure || undefined };
    const done = { onSuccess: () => inventoryQuery.refetch() };
    if (editingItem) updateInventory.mutate({ id: editingItem.id, data: payload }, done);
    else createInventory.mutate({ data: payload }, done);
    setShowForm(false);
    setEditingItem(null);
  };

  const confirmRemove = () => {
    if (deleteTarget) deleteInventory.mutate({ id: deleteTarget.id }, { onSuccess: () => inventoryQuery.refetch() });
    setDeleteTarget(null);
  };

  const saving = createInventory.isPending || updateInventory.isPending;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Know what’s on the shelf before the first whisk."
        action={<Button onClick={openAdd} data-testid="button-add-inventory"><Plus className="mr-1.5 h-4 w-4" />Add ingredient</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Ingredients" value={items.length} icon={PiPackage} note={`${categories.length} categories`} delay={0} />
        <StatCard label="Low" value={low} icon={PiWarning} tone={low > 0 ? 'warning' : 'default'} note="At or under reorder level" delay={60} />
        <StatCard label="Critical" value={critical} icon={PiWarningCircle} tone={critical > 0 ? 'warning' : 'default'} note="Running out" delay={120} />
        <StatCard label="Price changes" value={repriced} icon={PiCoins} note="Cost updated since last time" delay={180} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ingredients" className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {inventoryQuery.isError && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">Couldn’t load the inventory. Check your connection and refresh.</p>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Ingredient</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead className="hidden md:table-cell">Reorder at</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item) => (
              <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover" /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><PiPackage className="h-4 w-4" /></div>}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm tabular-nums">{item.quantity} {item.unit}</TableCell>
                <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">{item.reorderAt} {item.unit}</TableCell>
                <TableCell className="text-sm tabular-nums" data-testid={`text-inventory-cost-${item.id}`}>
                  {money(item.cost)}
                  {item.previousCost != null && item.previousCost !== item.cost && <span className="ml-1.5 text-muted-foreground/60 line-through">{money(item.previousCost)}</span>}
                </TableCell>
                <TableCell><Badge tone={item.status === 'critical' ? 'danger' : item.status === 'low' ? 'warning' : 'success'}>{item.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-edit-inventory-${item.id}`}><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(item)} aria-label={`Remove ${item.name}`} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-inventory-${item.id}`}><Trash2 size={15} /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pageItems.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-14 text-center">
                  <p className="font-display text-lg">{inventoryQuery.isLoading ? 'Loading…' : 'Nothing on that shelf.'}</p>
                  {!inventoryQuery.isLoading && <p className="mt-1 text-sm text-muted-foreground">Try another ingredient or category.</p>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-inventory-count">{filtered.length} ingredient{filtered.length === 1 ? '' : 's'}{filtered.length !== items.length ? ` (of ${items.length})` : ''}</span>
        {pageCount > 1 && (
          <div className="flex items-center gap-3">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={14} /></button>
            <span data-testid="text-inventory-page">Page {page} of {pageCount}</span>
            <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-30" aria-label="Next page"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${editingItem.name}` : 'Add to the pantry'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update what’s on the shelf.' : 'A new ingredient for the inventory.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ingredient name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
              <Field label="Bought by (unit)" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
              <NumberField label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
              <NumberField label="Reorder at" value={form.reorderAt} onChange={(value) => setForm({ ...form, reorderAt: value })} />
              <NumberField label="Unit cost (GHS)" value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} step="0.01" />
              <ImageUploadField label="Photo (optional)" value={form.imageUrl ?? ''} onChange={(url) => setForm({ ...form, imageUrl: url })} testId="input-inventory-photo" />
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold">Cups &amp; spoons (optional)</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">If you buy it by the {form.unit || 'unit'} but recipes say “2 cups”, tell us how many cups are in one {form.unit || 'unit'}. The cost calculator then prices it by the cup, tablespoon and teaspoon.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={suggestMeasure}><Wand2 className="mr-1.5 h-3.5 w-3.5" />Suggest</Button>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Recipe measure" value={form.measureUnit} onChange={(value) => setForm({ ...form, measureUnit: value })} placeholder="cup" />
                <NumberField label={`${form.measureUnit || 'measures'} per ${form.unit || 'unit'}`} value={form.unitsPerMeasure} onChange={(value) => setForm({ ...form, unitsPerMeasure: value })} />
              </div>
              {suggestNote && <p className="mt-2 text-[11px] text-muted-foreground">{suggestNote}</p>}
            </div>
            <Button type="submit" disabled={saving} className="mt-6 w-full" data-testid="button-save-inventory">{saving ? 'Saving…' : editingItem ? 'Save changes' : 'Save ingredient'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Remove ${deleteTarget?.name}?`}
        description="This takes it off the inventory list for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({ label, value, onChange, required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label className="text-xs font-semibold">{label}<Input required={required} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 font-normal" /></label>;
}

function NumberField({ label, value, onChange, step = '0.1' }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return <label className="text-xs font-semibold">{label}<Input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 font-normal" /></label>;
}
