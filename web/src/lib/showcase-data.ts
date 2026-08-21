import type { CakeQuoteInput } from '@workspace/api-client-react';
import weddingImage from '@assets/generated_images/wedding-cake.jpg';
import birthdayImage from '@assets/generated_images/birthday-cake.jpg';
import rusticImage from '@assets/generated_images/naked-cake.jpg';
import signatureImage from '@assets/generated_images/pistachio-rose-cake.jpg';
import petiteImage from '@assets/generated_images/mini-cakes.jpg';
import cupcakeImage from '@assets/generated_images/cupcakes.jpg';
import redVelvetImage from '@assets/generated_images/red-velvet-cake.jpg';
import lemonImage from '@assets/generated_images/lemon-cake.jpg';
import chocolateImage from '@assets/generated_images/chocolate-cake.jpg';
import cakePopsImage from '@assets/generated_images/cake-pops.jpg';
import macaronsImage from '@assets/generated_images/macarons.jpg';

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
    id: 'wedding',
    title: 'Wedding & tiered',
    tagline: 'Multi-tier cakes finished for the day itself.',
    description: 'Our most requested cake, built in stacked tiers with hand-finished buttercream, sugar florals or fresh blooms, and a delicate gold-leaf detail. Priced for a 3-tier design serving around 60 guests, and adjusted with you at the tasting.',
    ingredients: ['Vanilla bean sponge', 'Silky Swiss meringue buttercream', 'Fresh flowers or hand-piped sugar florals', 'Gold leaf detail'],
    includes: ['3 tiers, mixed flavours', 'Fresh floral or sugar florals', 'Delivery and on-site setup', 'A tasting box beforehand'],
    price: 2400,
    image: weddingImage,
    span: 'wide',
    preset: { size: '12 inch', layers: 3, tiers: 3, flavour: 'Vanilla bean', frosting: 'Silky Swiss meringue', topper: 'Fresh flowers', drip: 'No drip' },
  },
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
    id: 'rustic',
    title: 'Rustic & naked',
    tagline: 'Undressed layers, fresh fruit, real texture.',
    description: 'Lightly frosted layers left semi-bare on purpose, dressed with seasonal fruit and garden florals. A relaxed, textured finish for garden parties and daytime events.',
    ingredients: ['Lemon sponge', 'Elderflower syrup soak', 'Cream cheese frosting', 'Fresh seasonal fruit and garden flowers'],
    includes: ['8 inch, 2 layers', 'Fresh fruit and floral finish', 'Serves 14 to 18'],
    price: 480,
    image: rusticImage,
    span: 'normal',
    preset: { size: '8 inch', layers: 2, tiers: 1, flavour: 'Lemon elderflower', frosting: 'Cream cheese cloud', topper: 'Fresh flowers', drip: 'No drip' },
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
  {
    id: 'red-velvet',
    title: 'Red velvet',
    tagline: 'A classic, done properly.',
    description: 'Deep cocoa sponge with a bright cream cheese finish, layered generously. One of the flavours we get asked to repeat the most.',
    ingredients: ['Cocoa sponge', 'Buttermilk', 'Cream cheese frosting'],
    includes: ['Available as a full cake or cupcakes'],
    price: 480,
    image: redVelvetImage,
    span: 'normal',
    preset: { flavour: 'Red velvet' },
  },
  {
    id: 'lemon',
    title: 'Lemon elderflower',
    tagline: 'Bright, floral, not too sweet.',
    description: 'Fresh lemon sponge with an elderflower syrup soak, finished with candied citrus. A favourite for daytime and garden events.',
    ingredients: ['Lemon sponge', 'Elderflower syrup', 'Candied citrus', 'Lemon curd'],
    includes: ['Available as a full cake or cupcakes'],
    price: 480,
    image: lemonImage,
    span: 'normal',
    preset: { flavour: 'Lemon elderflower' },
  },
  {
    id: 'chocolate',
    title: 'Dark chocolate',
    tagline: 'For people who mean it.',
    description: 'A rich Dutch cocoa sponge with a dark ganache drip. Dense, not too sweet, built for real chocolate lovers.',
    ingredients: ['Dutch cocoa sponge', 'Dark chocolate ganache', 'A touch of espresso'],
    includes: ['Available as a full cake or cupcakes'],
    price: 500,
    image: chocolateImage,
    span: 'normal',
    preset: { flavour: 'Dark chocolate' },
  },
  {
    id: 'cake-pops',
    title: 'Cake pops',
    tagline: 'Bite-sized and hand-decorated.',
    description: 'Cake and buttercream rolled, dipped, and hand-decorated one at a time. A favourite party favour and gift box addition.',
    ingredients: ['Vanilla cake crumb', 'Buttercream', 'Chocolate coating and sprinkles'],
    includes: ['Boxes of 12', 'Custom colours on request'],
    price: 12,
    image: cakePopsImage,
    span: 'normal',
  },
  {
    id: 'macarons',
    title: 'Macarons',
    tagline: 'Crisp shell, soft centre.',
    description: 'French-style macarons in seasonal flavours, made in small batches. A refined addition to any dessert table or gift box.',
    ingredients: ['Almond flour', 'Egg white meringue', 'Seasonal fruit or ganache filling'],
    includes: ['Boxes of 12', 'Seasonal flavours'],
    price: 15,
    image: macaronsImage,
    span: 'normal',
  },
];
