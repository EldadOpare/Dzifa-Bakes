import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { cartEntryFromShowcaseItem, money, studioContact, type CartEntry } from '../lib/bakery-data';
import { showcase, studioSamples } from '../lib/showcase-data';

type ProductPageProps = { onAddToCart: (entry: CartEntry) => void };

const allItems = [...showcase, ...studioSamples];

export function ProductPage({ onAddToCart }: ProductPageProps) {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const item = allItems.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-3xl">We couldn’t find that one.</h1>
        <Link href="/#showcase" className="mt-6 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="link-back-showcase">Back to the showcase <ArrowRight size={15} /></Link>
      </main>
    );
  }

  const orderAsShown = () => {
    onAddToCart(cartEntryFromShowcaseItem(item));
    navigate('/invoice');
  };
  const customize = () => {
    navigate(`/?style=${item.id}#builder`);
  };

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <Link href="/#showcase" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back-builder">
        <ArrowLeft size={14} /> Back to the showcase
      </Link>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} className="aspect-[4/3] overflow-hidden rounded-2xl lg:sticky lg:top-28 lg:aspect-[4/5]">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }}>
          <span className="font-display text-2xl font-medium text-primary">From {money(item.price)}</span>
          <h1 className="mt-3 font-display text-4xl tracking-[-.03em] sm:text-5xl">{item.title}</h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{item.description}</p>

          <div className="mt-7">
            <p className="text-xs font-semibold">Made with</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.ingredients.join(', ')}</p>
          </div>

          <ul className="mt-7 space-y-2.5 border-t border-border pt-7">
            {item.includes.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm">
                <Check size={15} className="mt-0.5 shrink-0 text-primary" /> {line}
              </li>
            ))}
          </ul>

          <div className="mt-9 space-y-2.5">
            <button
              onClick={orderAsShown}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
              data-testid="button-order-as-shown"
            >
              Order this as shown <ArrowRight size={16} />
            </button>
            {item.preset ? (
              <button
                onClick={customize}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-semibold text-foreground hover:bg-muted"
                data-testid="button-customize-in-builder"
              >
                Customize this in the builder
              </button>
            ) : (
              <a
                href={`https://wa.me/${studioContact.whatsappNumber}?text=${encodeURIComponent(`Hi Dzifa Bakes, I'd like to ask about ${item.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-semibold text-foreground hover:bg-muted"
                data-testid="button-ask-whatsapp"
              >
                <MessageCircle size={16} /> Ask a question on WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
