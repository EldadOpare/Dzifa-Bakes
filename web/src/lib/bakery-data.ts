import type { CakeQuote, CakeQuoteInput } from '@workspace/api-client-react';
import type { ShowcaseItem } from './showcase-data';
import type { CakeDesign } from '@/components/cake3d/Cake';
import { dripPrice, icingStylePrice, nearestColourName, shapePrice, topperPrice } from './cake-design';

export const defaultQuoteInput: CakeQuoteInput = {
  size: '8 inch',
  layers: 2,
  tiers: 1,
  flavour: 'Vanilla bean',
  frosting: 'Silky Swiss meringue',
  topper: 'Minimal finish',
  drip: 'No drip',
  shape: 'Round',
  icingColour: '#F7F1E3',
  icingStyle: 'Smooth',
  message: '',
  equipment: ['Cake turntable set'],
};

export const fallbackQuote = (input: CakeQuoteInput): CakeQuote => {
  const sizeCost: Record<string, number> = { '6 inch': 420, '8 inch': 580, '10 inch': 760, '12 inch': 980 };
  const flavourCost: Record<string, number> = { 'Vanilla bean': 0, 'Dark chocolate': 65, 'Red velvet': 80, 'Pistachio & rose': 120, 'Lemon elderflower': 95 };
  const frostingCost: Record<string, number> = { 'Silky Swiss meringue': 0, 'Cream cheese cloud': 35, 'Salted caramel buttercream': 55, 'Coconut chantilly': 45 };
  const base = sizeCost[input.size] ?? 580;
  const layers = Math.max(0, input.layers - 2) * 90;
  const tiers = Math.max(0, input.tiers - 1) * 320;
  const equipment = input.equipment.length * 40;
  const lineItems = [
    { label: `${input.size} cake base`, amount: base },
    { label: `${input.layers} layers · ${input.flavour}`, amount: layers + (flavourCost[input.flavour] ?? 0) },
    { label: `${input.frosting}`, amount: frostingCost[input.frosting] ?? 0 },
    { label: `${input.topper}`, amount: topperPrice[input.topper] ?? 0 },
    { label: `${input.drip}`, amount: dripPrice[input.drip] ?? 0 },
    { label: `${input.shape ?? 'Round'} shape`, amount: shapePrice[input.shape ?? 'Round'] ?? 0 },
    { label: `${input.icingStyle ?? 'Smooth'} icing`, amount: icingStylePrice[input.icingStyle ?? 'Smooth'] ?? 0 },
    { label: `Icing colour: ${nearestColourName(input.icingColour ?? '#F7F1E3')}`, amount: 0 },
    ...(input.topper === 'Hand-piped message' && input.message ? [{ label: `Message: “${input.message.replace(/\s+/g, ' ')}”`, amount: 0 }] : []),
    ...(tiers ? [{ label: `${input.tiers} tiers`, amount: tiers }] : []),
    ...(equipment ? [{ label: 'Specialty finishing', amount: equipment }] : []),
  ].filter((line) => line.amount > 0 || line.label.includes('base') || line.label.includes('layers') || line.label.startsWith('Icing colour') || line.label.startsWith('Message'));
  const subtotal = lineItems.reduce((sum, line) => sum + line.amount, 0);
  const serviceFee = Math.round(subtotal * 0.08);
  return { subtotal, serviceFee, total: subtotal + serviceFee, lineItems };
};

export const studioContact = {
  whatsappNumber: '233594612381',
  whatsappDisplay: '+233 59 461 2381',
};

export type CartEntry = {
  quote: CakeQuote;
  image?: string;
  title?: string;
  design?: CakeDesign;
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
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

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