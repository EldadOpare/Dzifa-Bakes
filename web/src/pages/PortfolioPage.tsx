import { motion } from 'framer-motion';
import { ImageGallery } from '@/components/ui/image-gallery';
import { portfolioGroups } from '../lib/portfolio-data';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: .6 } },
};

const revealHeading = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, margin: '-80px' },
  variants: fadeUp,
};

export function PortfolioPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <motion.div {...revealHeading} className="mb-16 max-w-2xl">
        <p className="font-display text-lg text-primary">Our portfolio</p>
        <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.04em] sm:text-5xl">Cakes we've sent out into the world.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">A few of the celebrations we’ve baked for. Hover or tap a photo to take a closer look.</p>
      </motion.div>

      <div className="space-y-20 sm:space-y-28">
        {portfolioGroups.map((group, index) => {
          const flipped = index % 2 === 1;
          return (
            <section key={group.id} className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16" data-testid={`portfolio-group-${group.id}`}>
              <motion.div
                initial={{ opacity: 0, x: flipped ? 60 : -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: .7, ease: 'easeOut' }}
                className={flipped ? 'lg:order-2' : ''}
              >
                <ImageGallery images={group.images} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: .6, delay: .15 }}
                className={flipped ? 'lg:order-1' : ''}
              >
                <span className="text-xs text-muted-foreground">0{index + 1}</span>
                <h2 className="mt-2 font-display text-3xl tracking-[-.02em] sm:text-4xl">{group.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{group.caption}</p>
              </motion.div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
