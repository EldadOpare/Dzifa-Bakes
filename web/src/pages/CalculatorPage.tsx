import { AnimatePresence, motion } from 'framer-motion';
import { Plus, RefreshCw, Search, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PiBookmarkSimple, PiPackage } from 'react-icons/pi';
import { Link } from 'wouter';
import { useListInventory, useUpdateInventory } from '@workspace/api-client-react';
import type { InventoryItem } from '@workspace/api-client-react';
import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { money } from '../lib/bakery-data';
import { suggestCupsPerUnit, unitOptions, type LineUnit } from '../lib/measures';

type CalculatorLine = { id: number; inventoryId: number; quantity: number; unit: LineUnit };

type Calculation = {
  name: string;
  lines: CalculatorLine[];
  servings: number;
  laborHours: number;
  laborRate: number;
  overhead: number;
  markup: number;
};

type SavedRecipe = { id: number; savedAt: string; calc: Calculation };

const STORAGE_KEY = 'dzifa-calculator';
const RECIPES_KEY = 'dzilicious-recipes';

const defaultCalc: Calculation = { name: '', lines: [], servings: 12, laborHours: 2, laborRate: 45, overhead: 50, markup: 45 };

// Older saves stored a yes/no "use the recipe measure"; fold that into the single unit field.
function normalise(raw: unknown): Calculation {
  const value = (raw ?? {}) as Omit<Partial<Calculation>, 'lines'> & { lines?: (Omit<CalculatorLine, 'unit'> & { unit?: LineUnit; useMeasureUnit?: boolean })[] };
  return {
    ...defaultCalc,
    ...value,
    lines: (value.lines ?? []).map((line) => ({ id: line.id, inventoryId: line.inventoryId, quantity: line.quantity, unit: line.unit ?? (line.useMeasureUnit ? 'measure' : 'purchase') })),
  };
}

function read<T>(key: string, fallback: T, map: (raw: unknown) => T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? map(JSON.parse(value)) : fallback;
  } catch {
    return fallback;
  }
}

function priceLine(line: CalculatorLine, inventory: InventoryItem[]) {
  const ingredient = inventory.find((item) => item.id === line.inventoryId);
  if (!ingredient) return { ingredient, amount: 0, unitLabel: '', unitCost: 0 };
  const options = unitOptions(ingredient);
  const option = options.find((candidate) => candidate.value === line.unit) ?? options[0]!;
  return { ingredient, amount: option.cost * line.quantity, unitLabel: option.label, unitCost: option.cost };
}

function totals(calc: Calculation, inventory: InventoryItem[]) {
  const materials = calc.lines.reduce((sum, line) => sum + priceLine(line, inventory).amount, 0);
  const labor = calc.laborHours * calc.laborRate;
  const total = materials + labor + calc.overhead;
  const price = total * (1 + calc.markup / 100);
  return { materials, labor, total, price, profit: price - total, perServing: calc.servings > 0 ? total / calc.servings : total };
}

export function CalculatorPage() {
  const inventoryQuery = useListInventory();
  const updateInventory = useUpdateInventory();
  const inventory = useMemo<InventoryItem[]>(() => inventoryQuery.data ?? [], [inventoryQuery.data]);
  const [calc, setCalc] = useState<Calculation>(() => read(STORAGE_KEY, defaultCalc, normalise));
  const [recipes, setRecipes] = useState<SavedRecipe[]>(() => read<SavedRecipe[]>(RECIPES_KEY, [], (raw) => (Array.isArray(raw) ? raw.map((entry) => ({ ...entry, calc: normalise(entry.calc) })) : [])));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<LineUnit>('purchase');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calc)); }, [calc]);
  useEffect(() => { window.localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = inventory.find((item) => item.id === selectedId) ?? null;
  const options = selected ? unitOptions(selected) : [];
  const activeUnit = options.find((option) => option.value === unit) ?? options[0];
  const matches = useMemo(() => inventory.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [inventory, query]);
  const cupSuggestion = selected && !selected.measureUnit ? suggestCupsPerUnit(selected.name, selected.unit) : null;

  const pick = (item: InventoryItem) => { setSelectedId(item.id); setUnit('purchase'); setQuery(''); setPickerOpen(false); };

  const enableCups = () => {
    if (!selected || cupSuggestion == null) return;
    updateInventory.mutate(
      { id: selected.id, data: { name: selected.name, category: selected.category, unit: selected.unit, quantity: selected.quantity, reorderAt: selected.reorderAt, cost: selected.cost, imageUrl: selected.imageUrl ?? undefined, measureUnit: 'cup', unitsPerMeasure: cupSuggestion } },
      { onSuccess: () => inventoryQuery.refetch() },
    );
  };

  const addLine = () => {
    if (!selected || quantity <= 0 || !activeUnit) return;
    setCalc((current) => ({ ...current, lines: [...current.lines, { id: Date.now(), inventoryId: selected.id, quantity, unit: activeUnit.value }] }));
    setQuantity(1);
  };

  const patchCalc = (patch: Partial<Calculation>) => setCalc((current) => ({ ...current, ...patch }));
  const updateLine = (id: number, patch: Partial<CalculatorLine>) => setCalc((current) => ({ ...current, lines: current.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)) }));
  const removeLine = (id: number) => setCalc((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== id) }));

  const lines = calc.lines.map((line) => ({ line, ...priceLine(line, inventory) }));
  const sums = totals(calc, inventory);

  const saveRecipe = () => {
    if (calc.lines.length === 0) return;
    const name = calc.name.trim() || `Recipe ${recipes.length + 1}`;
    setRecipes((current) => [{ id: Date.now(), savedAt: new Date().toISOString(), calc: { ...calc, name } }, ...current.filter((recipe) => recipe.calc.name !== name)]);
    patchCalc({ name });
  };

  return (
    <div>
      <PageHeader
        title="Cost calculator"
        subtitle="Add what a cake needs, in cups, spoons or the way you buy it, and see exactly what it costs to make."
        action={<Button variant="outline" size="sm" onClick={() => setCalc(defaultCalc)} data-testid="button-reset-calculator"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Start over</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_370px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border p-5">
            <h3 className="font-display text-base font-medium">Add an ingredient</h3>
            <p className="mb-4 mt-0.5 text-xs text-muted-foreground">Prices come from your Inventory. Update a price there and every recipe follows.</p>

            <div className="grid gap-3 sm:grid-cols-[1fr_110px_150px_auto] sm:items-end">
              <div ref={pickerRef} className="relative">
                <label className="text-xs font-semibold">Ingredient</label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={pickerOpen || !selected ? query : selected.name}
                    onFocus={() => { setPickerOpen(true); setQuery(''); }}
                    onChange={(event) => { setQuery(event.target.value); setPickerOpen(true); }}
                    placeholder={inventoryQuery.isLoading ? 'Loading…' : 'Search flour, milk, butter…'}
                    className="pl-9"
                    data-testid="select-calculator-ingredient"
                  />
                </div>
                {pickerOpen && (
                  <div className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">
                    {matches.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nothing like that in your inventory yet.</p>
                    ) : matches.map((item) => (
                      <button key={item.id} type="button" onClick={() => pick(item)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-muted">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground"><PiPackage /></span>}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{money(item.cost)}/{item.unit}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="text-xs font-semibold">
                Amount
                <Input type="number" min="0" step="0.25" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-2 font-normal" data-testid="input-calculator-quantity" />
              </label>

              <div>
                <label className="text-xs font-semibold">Measured in</label>
                <Select value={activeUnit?.value ?? 'purchase'} onValueChange={(value) => setUnit(value as LineUnit)} disabled={!selected}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Pick one" /></SelectTrigger>
                  <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label} · {money(option.cost)} each</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <Button onClick={addLine} disabled={!selected || quantity <= 0} className="h-10" data-testid="button-add-calculator-line"><Plus className="mr-1.5 h-4 w-4" />Add</Button>
            </div>

            {selected && options.length === 1 && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl bg-muted/60 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="leading-5 text-muted-foreground">
                  {selected.name} is priced per <b className="text-foreground">{selected.unit}</b> only.
                  {cupSuggestion != null ? ` One ${selected.unit} is about ${cupSuggestion} cups, so you can cost it by the cup, tablespoon or teaspoon.` : ' To cost it by the cup or spoon, set its cups per unit in Inventory.'}
                </p>
                {cupSuggestion != null ? (
                  <Button size="sm" variant="outline" onClick={enableCups} disabled={updateInventory.isPending} className="shrink-0"><Wand2 className="mr-1.5 h-3.5 w-3.5" />Use cups &amp; spoons</Button>
                ) : (
                  <Button size="sm" variant="outline" asChild className="shrink-0"><Link href="/admin/inventory">Open inventory</Link></Button>
                )}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border">
            {lines.length === 0 ? (
              <div className="p-14 text-center">
                <p className="font-display text-lg">No ingredients yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Add what this cake needs, for example 2 cups of flour.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Ingredient</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Price each</th>
                    <th className="px-4 py-3 text-right font-medium">Cost</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map(({ line, ingredient, amount, unitLabel, unitCost }) => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={line.id} className="border-b border-border last:border-0" data-testid={`row-calculator-line-${line.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {ingredient?.imageUrl ? <img src={ingredient.imageUrl} alt="" className="h-9 w-9 rounded-lg border border-border object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><PiPackage /></span>}
                          <span className="font-medium">{ingredient?.name ?? 'Removed ingredient'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input type="number" min="0" step="0.25" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} className="h-9 w-20 px-2.5" data-testid={`input-line-quantity-${line.id}`} />
                          {ingredient && (
                            <Select value={line.unit} onValueChange={(value) => updateLine(line.id, { unit: value as LineUnit })}>
                              <SelectTrigger className="h-9 w-24 px-2.5 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{unitOptions(ingredient).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-xs tabular-nums text-muted-foreground sm:table-cell">{ingredient ? `${money(Math.round(unitCost * 100) / 100)} / ${unitLabel}` : '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(Math.round(amount * 100) / 100)}</td>
                      <td className="px-2 py-3 text-right">
                        <button onClick={() => removeLine(line.id)} aria-label="Remove ingredient" className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-remove-line-${line.id}`}><Trash2 size={15} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 lg:grid-cols-5">
            <NumberField label="Servings" value={calc.servings} onChange={(value) => patchCalc({ servings: value })} />
            <NumberField label="Labour hours" value={calc.laborHours} onChange={(value) => patchCalc({ laborHours: value })} />
            <NumberField label="Rate (GHS/hr)" value={calc.laborRate} onChange={(value) => patchCalc({ laborRate: value })} />
            <NumberField label="Overhead & packaging" value={calc.overhead} onChange={(value) => patchCalc({ overhead: value })} />
            <NumberField label="Markup (%)" value={calc.markup} onChange={(value) => patchCalc({ markup: value })} />
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-0 lg:self-start">
          <aside className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <span className="text-sm text-primary-foreground/70">What this cake costs to make</span>
            <div className="mt-4 overflow-hidden font-display text-4xl font-medium tracking-[-.03em]">
              <AnimatePresence mode="wait">
                <motion.span key={Math.round(sums.total)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .3 }} className="block" data-testid="text-total-cost">{money(Math.round(sums.total * 100) / 100)}</motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-1 text-xs text-primary-foreground/70">{money(Math.round(sums.perServing * 100) / 100)} a serving · {calc.servings} servings</p>

            <div className="my-5 space-y-2.5 border-t border-primary-foreground/20 pt-4 text-xs">
              <Row label="Ingredients" value={money(Math.round(sums.materials * 100) / 100)} testId="text-materials-cost" />
              <Row label="Labour" value={money(sums.labor)} testId="text-labor-cost" />
              <Row label="Overhead & packaging" value={money(calc.overhead)} />
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <p className="text-xs text-primary-foreground/70">Suggested price at {calc.markup}% markup</p>
              <p className="mt-1 font-display text-2xl font-medium tracking-tight" data-testid="text-suggested-price">{money(Math.round(sums.price))}</p>
              <p className="mt-1 text-xs text-primary-foreground/70">Profit <span data-testid="text-profit">{money(Math.round(sums.profit))}</span></p>
            </div>
          </aside>

          <section className="rounded-2xl border border-border p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-medium"><PiBookmarkSimple className="text-primary" />Saved recipes</h3>
            <div className="mt-3 flex gap-2">
              <Input value={calc.name} onChange={(event) => patchCalc({ name: event.target.value })} placeholder="Name this recipe" data-testid="input-recipe-name" />
              <Button onClick={saveRecipe} disabled={calc.lines.length === 0} data-testid="button-save-recipe">Save</Button>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Saved on this device. Costs are worked out from today’s prices each time you open one.</p>
            <div className="mt-4 space-y-2">
              {recipes.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Nothing saved yet.</p>}
              {recipes.map((recipe) => {
                const cost = totals(recipe.calc, inventory);
                return (
                  <div key={recipe.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setCalc(recipe.calc)} data-testid={`button-load-recipe-${recipe.id}`}>
                      <p className="truncate text-sm font-medium">{recipe.calc.name}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{money(Math.round(cost.total * 100) / 100)} · {recipe.calc.lines.length} ingredients</p>
                    </button>
                    <button onClick={() => setRecipes((current) => current.filter((entry) => entry.id !== recipe.id))} aria-label={`Delete ${recipe.calc.name}`} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return <div className="flex justify-between"><span className="text-primary-foreground/75">{label}</span><span className="tabular-nums" data-testid={testId}>{value}</span></div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <Input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 font-normal" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} />
    </label>
  );
}
