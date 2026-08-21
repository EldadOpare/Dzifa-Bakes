import type {
  BakerySummary,
  CakeQuote,
  CakeQuoteInput,
  EquipmentItem,
  InventoryItem,
} from '@workspace/api-client-react';
import type { ShowcaseItem } from './showcase-data';

export const fallbackSummary: BakerySummary = {
  revenue: 28460,
  openOrders: 14,
  lowStockCount: 3,
  inventoryValue: 8160,
  weeklyRevenue: [
    { day: 'Mon', value: 2800 },
    { day: 'Tue', value: 4100 },
    { day: 'Wed', value: 3620 },
    { day: 'Thu', value: 5240 },
    { day: 'Fri', value: 4680 },
    { day: 'Sat', value: 6120 },
    { day: 'Sun', value: 1900 },
  ],
};

export const fallbackInventory: InventoryItem[] = [
  { id: 1,  name: 'Dutch-process cocoa',    category: 'Dry goods',  unit: 'kg',    quantity: 4.8,  reorderAt: 3,  cost: 145, status: 'healthy'  },
  { id: 2,  name: 'French butter',          category: 'Chilled',    unit: 'kg',    quantity: 7.2,  reorderAt: 8,  cost: 185, status: 'low'      },
  { id: 3,  name: 'Vanilla bean paste',     category: 'Flavouring', unit: 'jar',   quantity: 12,   reorderAt: 5,  cost: 92,  status: 'healthy'  },
  { id: 4,  name: 'Gold leaf sheets',       category: 'Finishing',  unit: 'pack',  quantity: 2,    reorderAt: 3,  cost: 260, status: 'low'      },
  { id: 5,  name: 'Cake boards 10 inch',    category: 'Packaging',  unit: 'pack',  quantity: 31,   reorderAt: 12, cost: 48,  status: 'healthy'  },
  { id: 6,  name: 'Whipping cream',         category: 'Chilled',    unit: 'litre', quantity: 3.5,  reorderAt: 6,  cost: 58,  status: 'critical' },
  { id: 7,  name: 'All-purpose flour',      category: 'Dry goods',  unit: 'kg',    quantity: 18,   reorderAt: 8,  cost: 22,  status: 'healthy'  },
  { id: 8,  name: 'Caster sugar',           category: 'Dry goods',  unit: 'kg',    quantity: 11.5, reorderAt: 5,  cost: 18,  status: 'healthy'  },
  { id: 9,  name: 'Free-range eggs',        category: 'Chilled',    unit: 'dozen', quantity: 4,    reorderAt: 6,  cost: 35,  status: 'low'      },
  { id: 10, name: 'Cream cheese',           category: 'Chilled',    unit: 'kg',    quantity: 5.4,  reorderAt: 4,  cost: 110, status: 'healthy'  },
  { id: 11, name: 'Rosewater extract',      category: 'Flavouring', unit: 'bottle',quantity: 8,    reorderAt: 3,  cost: 75,  status: 'healthy'  },
  { id: 12, name: 'Pistachio kernels',      category: 'Dry goods',  unit: 'kg',    quantity: 1.2,  reorderAt: 2,  cost: 320, status: 'low'      },
  { id: 13, name: 'Icing sugar',            category: 'Dry goods',  unit: 'kg',    quantity: 9,    reorderAt: 4,  cost: 20,  status: 'healthy'  },
  { id: 14, name: 'Cake boxes (assorted)',  category: 'Packaging',  unit: 'pack',  quantity: 22,   reorderAt: 10, cost: 65,  status: 'healthy'  },
  { id: 15, name: 'Dark chocolate couv.',   category: 'Dry goods',  unit: 'kg',    quantity: 2.8,  reorderAt: 3,  cost: 210, status: 'healthy'  },
  { id: 16, name: 'Edible rose petals',     category: 'Finishing',  unit: 'pack',  quantity: 1,    reorderAt: 2,  cost: 180, status: 'critical' },
  { id: 17, name: 'Elderflower cordial',    category: 'Flavouring', unit: 'bottle',quantity: 6,    reorderAt: 4,  cost: 88,  status: 'healthy'  },
  { id: 18, name: 'Baking soda',            category: 'Dry goods',  unit: 'kg',    quantity: 3.5,  reorderAt: 2,  cost: 12,  status: 'healthy'  },
];

export const fallbackEquipment: EquipmentItem[] = [
  { id: 1, name: 'Rational combi oven', category: 'Baking', status: 'operational', nextService: '2025-08-18' },
  { id: 2, name: 'KitchenAid 7 qt mixer', category: 'Mixing', status: 'operational', nextService: '2025-10-02' },
  { id: 3, name: 'Blast chiller', category: 'Cooling', status: 'service due', nextService: '2025-06-12' },
  { id: 4, name: 'Cake turntable set', category: 'Finishing', status: 'operational', nextService: '2025-12-11' },
  { id: 5, name: 'Digital scale pair', category: 'Prep', status: 'operational', nextService: '2026-01-09' },
];

export const defaultQuoteInput: CakeQuoteInput = {
  size: '8 inch',
  layers: 2,
  tiers: 1,
  flavour: 'Vanilla bean',
  frosting: 'Silky Swiss meringue',
  topper: 'Fresh flowers',
  drip: 'No drip',
  equipment: ['Cake turntable set'],
};

export const fallbackQuote = (input: CakeQuoteInput): CakeQuote => {
  const sizeCost: Record<string, number> = { '6 inch': 420, '8 inch': 580, '10 inch': 760, '12 inch': 980 };
  const flavourCost: Record<string, number> = { 'Vanilla bean': 0, 'Dark chocolate': 65, 'Red velvet': 80, 'Pistachio & rose': 120, 'Lemon elderflower': 95 };
  const frostingCost: Record<string, number> = { 'Silky Swiss meringue': 0, 'Cream cheese cloud': 35, 'Salted caramel buttercream': 55, 'Coconut chantilly': 45 };
  const topperCost: Record<string, number> = { 'Fresh flowers': 80, 'Hand-piped message': 35, 'Chocolate sails': 95, 'Minimal finish': 0 };
  const dripCost: Record<string, number> = { 'No drip': 0, 'Dark chocolate drip': 40, 'Gold caramel drip': 60 };
  const base = sizeCost[input.size] ?? 580;
  const layers = Math.max(0, input.layers - 2) * 90;
  const tiers = Math.max(0, input.tiers - 1) * 320;
  const equipment = input.equipment.length * 40;
  const lineItems = [
    { label: `${input.size} cake base`, amount: base },
    { label: `${input.layers} layers · ${input.flavour}`, amount: layers + (flavourCost[input.flavour] ?? 0) },
    { label: `${input.frosting}`, amount: frostingCost[input.frosting] ?? 0 },
    { label: `${input.topper}`, amount: topperCost[input.topper] ?? 0 },
    { label: `${input.drip}`, amount: dripCost[input.drip] ?? 0 },
    ...(tiers ? [{ label: `${input.tiers} tiers`, amount: tiers }] : []),
    ...(equipment ? [{ label: 'Specialty finishing', amount: equipment }] : []),
  ].filter((line) => line.amount > 0 || line.label.includes('base') || line.label.includes('layers'));
  const subtotal = lineItems.reduce((sum, line) => sum + line.amount, 0);
  const serviceFee = Math.round(subtotal * 0.08);
  return { subtotal, serviceFee, total: subtotal + serviceFee, lineItems };
};

export const studioContact = {
  whatsappNumber: '233501694559',
  whatsappDisplay: '+233 50 169 4559',
  email: 'dnuer@ashesi.edu.gh',
};

// The cake's photo was carried alongside the quote, from whichever showcase item
// the order started from, so the checkout page could still show what was chosen.
export type CartEntry = {
  quote: CakeQuote;
  image?: string;
  title?: string;
};

export const cartEntryFromShowcaseItem = (item: ShowcaseItem): CartEntry => {
  const serviceFee = Math.round(item.price * 0.08);
  return {
    quote: {
      subtotal: item.price,
      serviceFee,
      total: item.price + serviceFee,
      lineItems: [{ label: item.title, amount: item.price }],
    },
    image: item.image,
    title: item.title,
  };
};

export const money = (amount: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(amount);

export const readStoredCart = (): CartEntry | null => {
  try {
    const value = window.localStorage.getItem('dzifa-cart');
    return value ? JSON.parse(value) as CartEntry : null;
  } catch {
    return null;
  }
};

export const storeCart = (entry: CartEntry | null) => {
  if (entry) window.localStorage.setItem('dzifa-cart', JSON.stringify(entry));
  else window.localStorage.removeItem('dzifa-cart');
};