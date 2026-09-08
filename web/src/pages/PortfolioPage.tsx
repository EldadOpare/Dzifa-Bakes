import { motion } from 'framer-motion';
import { useListPortfolio } from '@workspace/api-client-react';
import type { PortfolioItem } from '@workspace/api-client-react';

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
  const portfolioQuery = useListPortfolio();
  const items: PortfolioItem[] = portfolioQuery.data ?? [];

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <motion.div {...revealHeading} className="mb-16 max-w-2xl">
        <p className="font-display text-lg text-primary">Our portfolio</p>
        <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.04em] sm:text-5xl">Cakes we've sent out into the world.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">A running record of what's left the studio, added as we finish each one.</p>
      </motion.div>

      {portfolioQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <p className="font-display text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon, we're adding our work here as we go.</p>
        </div>
      ) : (
        <div className="space-y-16 sm:space-y-24">
          {items.map((item, index) => {
            const reversed = index % 2 === 1;
            return (
              <div key={item.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <motion.div
                  initial={{ opacity: 0, x: reversed ? 60 : -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: .7, ease: 'easeOut' }}
                  className={reversed ? 'lg:order-2' : ''}
                >
                  <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl" data-testid={`card-portfolio-item-${item.id}`}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: .6, delay: .15 }}
                  className={reversed ? 'lg:order-1' : ''}
                >
                  <h2 className="font-display text-3xl tracking-[-.02em]">{item.title}</h2>
                  {item.caption && <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{item.caption}</p>}
                </motion.div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
