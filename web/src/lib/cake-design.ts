// Single source of truth for the cake builder: option lists, colours and the
// extra prices the new design choices add. Shared by the UI, the 3D cake and the quote.

export const shapes = ['Round', 'Square', 'Rectangle', 'Hexagon', 'Octagon', 'Heart'] as const;
export type CakeShape = (typeof shapes)[number];

export const icingStyles = ['Smooth', 'Rustic swirl', 'Ridged', 'Ruffled', 'Semi-naked', 'Naked', 'Rosette border', 'Pearl border'] as const;
export type IcingStyle = (typeof icingStyles)[number];

export const toppers = ['Fresh flowers', 'Fresh berries', 'Macarons', 'Hand-piped message', 'Chocolate sails', 'Minimal finish'] as const;
export const drips = ['No drip', 'Dark chocolate drip', 'White chocolate drip', 'Gold caramel drip', 'Raspberry drip'] as const;

export const icingPalette = [
  { name: 'Ivory', hex: '#F7F1E3' },
  { name: 'Pure white', hex: '#FFFFFF' },
  { name: 'Blush', hex: '#F2C6CC' },
  { name: 'Rose', hex: '#E58FA3' },
  { name: 'Peach', hex: '#F8C8A6' },
  { name: 'Butter', hex: '#F6E3A1' },
  { name: 'Sage', hex: '#B7C9A8' },
  { name: 'Mint', hex: '#BFE3D2' },
  { name: 'Sky', hex: '#BFD8EE' },
  { name: 'Lavender', hex: '#CDBFE6' },
  { name: 'Chocolate', hex: '#5A3424' },
  { name: 'Black', hex: '#232225' },
] as const;

export const sizeInches: Record<string, number> = { '6 inch': 6, '8 inch': 8, '10 inch': 10, '12 inch': 12 };

export const spongeColours: Record<string, string> = {
  'Vanilla bean': '#EFD79B',
  'Dark chocolate': '#4A2A1C',
  'Red velvet': '#9B1C2A',
  'Pistachio & rose': '#B8CC8C',
  'Lemon elderflower': '#F4DD72',
};

export const fillingColours: Record<string, string> = {
  'Silky Swiss meringue': '#FFFDF6',
  'Cream cheese cloud': '#F8F1E2',
  'Salted caramel buttercream': '#D9A25F',
  'Coconut chantilly': '#FFFFFF',
};

export const dripColours: Record<string, string> = {
  'Dark chocolate drip': '#3A1E12',
  'White chocolate drip': '#F7EFE0',
  'Gold caramel drip': '#C8873A',
  'Raspberry drip': '#B01E4A',
};

export const shapePrice: Record<string, number> = { Round: 0, Square: 0, Rectangle: 40, Hexagon: 60, Octagon: 60, Heart: 90 };
export const icingStylePrice: Record<string, number> = {
  Smooth: 0, 'Rustic swirl': 30, Ridged: 20, Ruffled: 120, 'Semi-naked': 0, Naked: 0, 'Rosette border': 80, 'Pearl border': 50,
};
export const topperPrice: Record<string, number> = {
  'Fresh flowers': 80, 'Fresh berries': 70, Macarons: 90, 'Hand-piped message': 35, 'Chocolate sails': 95, 'Minimal finish': 0,
};
export const dripPrice: Record<string, number> = {
  'No drip': 0, 'Dark chocolate drip': 40, 'White chocolate drip': 40, 'Gold caramel drip': 60, 'Raspberry drip': 45,
};

export const nearestColourName = (hex: string): string => {
  const match = icingPalette.find((swatch) => swatch.hex.toLowerCase() === hex.toLowerCase());
  return match ? match.name : hex.toUpperCase();
};
