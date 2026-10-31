import type { CakeQuoteInput } from '@workspace/api-client-react';
import birthdayImage from '@assets/portfolio/c5.jpg';
import graduationImage from '@assets/portfolio/c1.jpg';
import signatureImage from '@assets/portfolio/c2.jpg';
import petiteImage from '@assets/portfolio/c12.jpg';
import cupcakeImage from '@assets/portfolio/c10.jpg';

export type ShowcaseItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  ingredients: string[];
  includes: string[];
  price: number;
  image: string;
  span: 'wide' | 'normal';
  preset?: Partial<CakeQuoteInput>;
};

export const showcase: ShowcaseItem[] = [
  {
    id: 'birthday',
    title: 'Birthday & celebration',
    tagline: 'Playful layers built for candles and confetti.',
    description: 'A single statement cake with bright layers, a hand-piped message, and a finish that photographs as well as it tastes. Our studio favourite for milestone birthdays.',
    ingredients: ['Red velvet sponge', 'Buttermilk and cocoa', 'Salted caramel buttercream', 'Gold caramel drip'],
    includes: ['8 inch, 3 layers', 'Hand-piped name or message', 'Gift box and candles', 'Serves 16 to 20'],
    price: 620,
    image: birthdayImage,
    span: 'normal',
    preset: { size: '8 inch', layers: 3, tiers: 1, flavour: 'Red velvet', frosting: 'Salted caramel buttercream', topper: 'Hand-piped message', drip: 'Gold caramel drip' },
  },
  {
    id: 'graduation',
    title: 'Graduation & achievement',
    tagline: 'Celebrate the work behind the milestone.',
    description: 'A custom cake for graduations and big achievements, finished with the details that tell their story, from the course they studied to the cap and diploma on top.',
    ingredients: ['Your choice of sponge', 'Buttercream or fondant finish', 'Custom topper and hand-finished details'],
    includes: ['8 inch, 3 layers', 'Personalised to their course or title', 'Serves 14 to 18'],
    price: 480,
    image: graduationImage,
    span: 'normal',
    preset: { size: '8 inch', layers: 3, tiers: 1, flavour: 'Dark chocolate', frosting: 'Silky Swiss meringue', topper: 'Hand-piped message', drip: 'No drip' },
  },
  {
    id: 'signature',
    title: 'Signature flavours',
    tagline: 'Pistachio rose, lemon elderflower, red velvet and more.',
    description: 'Our house flavours, built around ingredients we actually love working with: crushed pistachio, rosewater, elderflower, real Dutch cocoa. Pick one as your base or ask us to design something new.',
    ingredients: ['Pistachio sponge', 'Rosewater syrup', 'Coconut chantilly cream', 'Crushed pistachio and dried rose petals'],
    includes: ['8 inch, 2 layers', 'A flavour consultation', 'Serves 14 to 18'],
    price: 560,
    image: signatureImage,
    span: 'wide',
    preset: { size: '8 inch', layers: 2, tiers: 1, flavour: 'Pistachio & rose', frosting: 'Coconut chantilly', topper: 'Fresh flowers', drip: 'No drip' },
  },
  {
    id: 'petite',
    title: 'Petite & favours',
    tagline: 'Mini cakes and cake pops for the whole table.',
    description: 'Individually finished mini cakes, sized for a dessert table or as thank-you favours. Each one is fully iced and detailed, not just a slice of a larger cake.',
    ingredients: ['Vanilla bean sponge', 'Silky Swiss meringue buttercream', 'Hand-finished fondant detail'],
    includes: ['Boxes of 6 or 12', 'Mixed or single flavour', 'Individually boxed on request'],
    price: 35,
    image: petiteImage,
    span: 'wide',
    preset: { size: '6 inch', layers: 2, tiers: 1, flavour: 'Vanilla bean', frosting: 'Silky Swiss meringue', topper: 'Minimal finish', drip: 'No drip' },
  },
  {
    id: 'cupcakes',
    title: 'Everyday cupcakes',
    tagline: 'A smaller way to say it, beautifully finished.',
    description: 'The same care as our cakes, in a smaller and easier-to-share format. Good for office celebrations, small gatherings, or when a full cake feels like too much.',
    ingredients: ['Dutch cocoa sponge', 'Cream cheese frosting', 'Dark chocolate drip'],
    includes: ['Boxes of 6 or 12', 'Piped or fondant finish', 'Mixed flavours available'],
    price: 18,
    image: cupcakeImage,
    span: 'normal',
    preset: { size: '6 inch', layers: 2, tiers: 1, flavour: 'Dark chocolate', frosting: 'Cream cheese cloud', topper: 'Minimal finish', drip: 'Dark chocolate drip' },
  },
];

export const studioSamples: ShowcaseItem[] = [
];
