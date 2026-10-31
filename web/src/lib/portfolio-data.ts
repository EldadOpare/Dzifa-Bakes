import c1 from '@assets/portfolio/c1.jpg';
import c2 from '@assets/portfolio/c2.jpg';
import c3 from '@assets/portfolio/c3.jpg';
import c4 from '@assets/portfolio/c4.jpg';
import c5 from '@assets/portfolio/c5.jpg';
import c6 from '@assets/portfolio/c6.jpg';
import c7 from '@assets/portfolio/c7.jpg';
import c8 from '@assets/portfolio/c8.jpg';
import c9 from '@assets/portfolio/c9.jpg';
import c10 from '@assets/portfolio/c10.jpg';
import c11 from '@assets/portfolio/c11.jpg';
import c12 from '@assets/portfolio/c12.jpg';
import c13 from '@assets/portfolio/c13.jpg';
import birthday13 from '@assets/portfolio/birthday-13.jpg';
import birthday70 from '@assets/portfolio/birthday-70.jpg';
import chelsea from '@assets/portfolio/chelsea.jpg';
import arsenalCupcakes from '@assets/portfolio/arsenal-cupcakes.jpg';
import type { GalleryImage } from '@/components/ui/image-gallery';

export type PortfolioGroup = {
  id: string;
  title: string;
  caption: string;
  images: GalleryImage[];
};

// The portfolio is a fixed list. To add work: put the photo in assets/portfolio,
// import it above, and add it to a group (or start a new group). Order is the order shown.
export const portfolioGroups: PortfolioGroup[] = [
  {
    id: 'milestones',
    title: 'Milestones & achievements',
    caption: 'Graduations and big birthdays, finished with the details that make them theirs.',
    images: [
      { src: c1, alt: 'Master of Business graduation cake with a mortarboard topper' },
      { src: c3, alt: 'PhD congratulations cake with gold pearls and a gold board' },
      { src: birthday70, alt: '70th birthday cake with blue florals and gold balloons' },
      { src: birthday13, alt: 'Official teenager 13th birthday cake in blue glitter' },
    ],
  },
  {
    id: 'pretty-in-pink',
    title: 'Florals & pretty pinks',
    caption: 'Soft buttercream, piped ruffles and fresh flowers for birthdays that want to feel special.',
    images: [
      { src: c2, alt: 'Pink ruffled birthday cake crowned with flowers' },
      { src: c9, alt: 'Pink and yellow ombre cake with a name plaque' },
      { src: c13, alt: 'Pink buttercream birthday cake with a piped message' },
      { src: c5, alt: 'White birthday cake with red drips and a deep red rose' },
    ],
  },
  {
    id: 'character-cakes',
    title: 'Characters & themes',
    caption: 'Their favourite shows, characters and football clubs, turned into a cake they won’t want to cut.',
    images: [
      { src: c4, alt: 'PJ Masks birthday cake' },
      { src: c6, alt: 'SpongeBob cake with matching cupcakes' },
      { src: c7, alt: 'Pink first-birthday cake with a character topper' },
      { src: c8, alt: 'Cocomelon birthday cake with a rainbow' },
      { src: chelsea, alt: 'Chelsea football club themed first-birthday cake' },
    ],
  },
  {
    id: 'cupcakes',
    title: 'Cupcakes by the box',
    caption: 'Boxes of cupcakes for parties, gifting and everything in between.',
    images: [
      { src: c10, alt: 'A box of blue and sprinkle cupcakes' },
      { src: c11, alt: 'Valentine cupcakes with fondant hearts' },
      { src: c12, alt: 'Pink “love you” cupcakes in a gift box' },
      { src: arsenalCupcakes, alt: 'Arsenal themed cupcakes in a box' },
    ],
  },
];
