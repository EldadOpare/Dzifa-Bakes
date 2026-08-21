import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useListInventory } from '@workspace/api-client-react';
import type { InventoryItem } from '@workspace/api-client-react';
import { fallbackInventory, money } from '../lib/bakery-data';

type CalculatorLine = { id: number; inventoryId: number; quantity: number };

type StoredCalculator = {
  lines: CalculatorLine[];
  laborHours: number;
  laborRate: number;
  overhead: number;
  markup: number;
};

const STORAGE_KEY = 'dzifa-calculator';

const defaultState: StoredCalculator = {
  lines: [],
  laborHours: 2,
  laborRate: 45,
  overhead: 50,
  markup: 45,
};

function readStoredCalculator(): StoredCalculator {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? { ...defaultState, ...JSON.parse(value) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function CalculatorPage() {
  const inventoryQuery = useListInventory();
  const inventory: InventoryItem[] = inventoryQuery.data ?? fallbackInventory;
  const [state, setState] = useState<StoredCalculator>(readStoredCalculator);
  const [selectedIngredient, setSelectedIngredient] = useState(inventory[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const findIngredient = (id: number) => inventory.find((item) => item.id === id);

  const addLine = () => {
    const ingredient = findIngredient(selectedIngredient);
    if (!ingredient || quantity <= 0) return;
    setState((current) => ({
      ...current,
      lines: [...current.lines, { id: Date.now(), inventoryId: ingredient.id, quantity }],
    }));
    setQuantity(1);
  };

  const removeLine = (id: number) =>
    setState((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== id) }));

  const updateLineQuantity = (id: number, nextQuantity: number) =>
    setState((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === id ? { ...line, quantity: nextQuantity } : line)),
    }));

  const reset = () => setState(defaultState);

  const lineDetails = useMemo(
    () =>
      state.lines.map((line) => {
        const ingredient = findIngredient(line.inventoryId);
        const amount = ingredient ? ingredient.cost * line.quantity : 0;
        return { ...line, ingredient, amount };
      }),
    [state.lines, inventory],
  );

  const materialsCost = lineDetails.reduce((sum, line) => sum + line.amount, 0);
  const laborCost = state.laborHours * state.laborRate;
  const totalCost = materialsCost + laborCost + state.overhead;
  const suggestedPrice = totalCost * (1 + state.markup / 100);
  const profit = suggestedPrice - totalCost;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary">
            <Calculator size={17} /> Pricing tool
          </p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Cost calculator</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Build the real recipe for a custom order and see what it actually costs to make, before you quote it.
          </p>
        </div>
        <button
          onClick={reset}
          className="flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          data-testid="button-reset-calculator"
        >
          <RefreshCw size={14} /> Start over
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:gap-4">
            <label className="flex-1 text-xs font-semibold">
              Ingredient
              <select
                value={selectedIngredient}
                onChange={(event) => setSelectedIngredient(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
                data-testid="select-calculator-ingredient"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {money(item.cost)}/{item.unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full text-xs font-semibold sm:w-32">
              Quantity ({findIngredient(selectedIngredient)?.unit ?? 'unit'})
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
                data-testid="input-calculator-quantity"
              />
            </label>
            <button
              onClick={addLine}
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
              data-testid="button-add-calculator-line"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            {lineDetails.length === 0 ? (
              <div className="p-14 text-center">
                <p className="font-display text-2xl">No ingredients yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Add what this order actually needs above.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                    <th className="px-5 py-4">Ingredient</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Unit cost</th>
                    <th className="px-5 py-4">Line cost</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {lineDetails.map((line) => (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={line.id}
                      className="border-b border-border last:border-0"
                      data-testid={`row-calculator-line-${line.id}`}
                    >
                      <td className="px-5 py-4 text-sm font-semibold">{line.ingredient?.name ?? 'Removed ingredient'}</td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={line.quantity}
                          onChange={(event) => updateLineQuantity(line.id, Number(event.target.value))}
                          className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                          data-testid={`input-line-quantity-${line.id}`}
                        />
                        <span className="ml-2 text-xs text-muted-foreground">{line.ingredient?.unit}</span>
                      </td>
                      <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">
                        {line.ingredient ? money(line.ingredient.cost) : '—'}
                      </td>
                      <td className="px-5 py-4 font-mono-ui text-xs">{money(line.amount)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => removeLine(line.id)}
                          aria-label="Remove ingredient"
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-remove-line-${line.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label="Labor hours" value={state.laborHours} onChange={(value) => setState((current) => ({ ...current, laborHours: value }))} />
            <NumberField label="Rate (GHS/hr)" value={state.laborRate} onChange={(value) => setState((current) => ({ ...current, laborRate: value }))} />
            <NumberField label="Overhead & packaging" value={state.overhead} onChange={(value) => setState((current) => ({ ...current, overhead: value }))} />
            <NumberField label="Markup (%)" value={state.markup} onChange={(value) => setState((current) => ({ ...current, markup: value }))} />
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground sm:p-7 lg:sticky lg:top-28">
          <span className="text-sm text-primary-foreground/70">Suggested price</span>
          <div className="mt-8">
            <div className="overflow-hidden font-display font-medium text-3xl tracking-[-.03em]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={Math.round(suggestedPrice)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: .3 }}
                  className="block"
                  data-testid="text-suggested-price"
                >
                  {money(suggestedPrice)}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-2 text-xs leading-5 text-primary-foreground/65">At a {state.markup}% markup over real cost.</p>
          </div>
          <div className="my-7 space-y-3 border-t border-primary-foreground/20 pt-5 text-xs">
            <div className="flex justify-between">
              <span className="text-primary-foreground/75">Ingredients</span>
              <span className="font-mono-ui text-primary-foreground/90" data-testid="text-materials-cost">{money(materialsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-foreground/75">Labor</span>
              <span className="font-mono-ui text-primary-foreground/90" data-testid="text-labor-cost">{money(laborCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-foreground/75">Overhead</span>
              <span className="font-mono-ui text-primary-foreground/90">{money(state.overhead)}</span>
            </div>
            <div className="flex justify-between border-t border-primary-foreground/20 pt-3 font-semibold">
              <span>Total cost</span>
              <span className="font-mono-ui" data-testid="text-total-cost">{money(totalCost)}</span>
            </div>
            <div className="flex justify-between text-accent">
              <span>Profit</span>
              <span className="font-mono-ui" data-testid="text-profit">{money(profit)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
        data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
      />
    </label>
  );
}
