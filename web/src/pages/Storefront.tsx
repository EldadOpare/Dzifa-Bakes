import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Leaf, Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'wouter';
import { useCalculateCakeQuote } from '@workspace/api-client-react';
import type { CakeQuote, CakeQuoteInput } from '@workspace/api-client-react';
import { defaultQuoteInput, fallbackQuote, money, type CartEntry } from '../lib/bakery-data';
import { showcase, studioSamples, type ShowcaseItem } from '../lib/showcase-data';
import heroImage from '@assets/generated_images/hero-baking.jpg';
import dessertTableImage from '@assets/generated_images/dessert-table.jpg';

type StorefrontProps = { onAddToCart: (entry: CartEntry) => void };
const steps = ['Shape & scale', 'Flavour notes', 'Finish & detail'];
const options = {
  size: ['6 inch', '8 inch', '10 inch', '12 inch'],
  flavour: ['Vanilla bean', 'Dark chocolate', 'Red velvet', 'Pistachio & rose', 'Lemon elderflower'],
  frosting: ['Silky Swiss meringue', 'Cream cheese cloud', 'Salted caramel buttercream', 'Coconut chantilly'],
  topper: ['Fresh flowers', 'Hand-piped message', 'Chocolate sails', 'Minimal finish'],
  drip: ['No drip', 'Dark chocolate drip', 'Gold caramel drip'],
};

const allItems = [...showcase, ...studioSamples];

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

export function Storefront({ onAddToCart }: StorefrontProps) {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CakeQuoteInput>(defaultQuoteInput);
  const [quote, setQuote] = useState<CakeQuote>(() => fallbackQuote(defaultQuoteInput));
  const [added, setAdded] = useState(false);
  const [referenceItem, setReferenceItem] = useState<ShowcaseItem | null>(null);
  const quoteMutation = useCalculateCakeQuote();
  const previewQuote = useMemo(() => fallbackQuote(input), [input]);

  useEffect(() => {
    const styleId = searchParams.get('style');
    const item = styleId ? allItems.find((candidate) => candidate.id === styleId) : null;
    if (!item) return;
    setReferenceItem(item);
    if (item.preset) setInput((current) => ({ ...current, ...item.preset }));
    const timer = setTimeout(() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(timer);
  }, []);

  const update = <K extends keyof CakeQuoteInput>(key: K, value: CakeQuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setAdded(false);
  };
  const calculate = () => {
    setQuote(previewQuote);
    quoteMutation.mutate({ data: input }, { onSuccess: (serverQuote) => setQuote(serverQuote) });
  };
  const next = () => {
    if (step < 2) setStep((current) => current + 1);
    else calculate();
  };

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:px-12 lg:pb-28 lg:pt-20">
          <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .1 } } }} className="max-w-2xl">
            <motion.p variants={fadeUp} className="mb-5 font-display text-lg text-primary">A pastry consultation, online</motion.p>
            <motion.h1 variants={fadeUp} className="font-display font-medium text-[clamp(2.75rem,5.5vw,4.75rem)] leading-[1.05] tracking-[-.03em] text-foreground">Made for the moments<br /><em className="text-primary not-italic">worth celebrating.</em></motion.h1>
            <motion.p variants={fadeUp} className="mt-8 max-w-md text-[17px] leading-7 text-muted-foreground">Tell us the feeling, we’ll take care of the details. Design a celebration cake with our Accra pastry team and see a considered quote in seconds.</motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-5">
              <a href="#builder" className="group flex items-center gap-3 rounded-full bg-foreground px-6 py-3.5 text-sm text-background transition-transform hover:translate-x-1" data-testid="link-start-builder">Begin your design <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
              <span className="text-sm text-muted-foreground">Made to order, Osu studio</span>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15, duration: 1.1, ease: 'easeOut' }} className="relative mx-auto flex aspect-[.94] w-full max-w-[550px] items-center justify-center overflow-hidden rounded-[2rem]">
            <motion.img
              src={heroImage}
              alt="A baker piping buttercream onto a fresh layer cake in the Dzifa Bakes studio"
              className="h-full w-full object-cover"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .9, duration: .6 }}
              className="absolute bottom-8 left-8 flex items-center gap-2 text-xs text-background/90"
            >
              <Leaf size={14} className="text-accent" /> Ingredients with a point of view
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="showcase" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <motion.div {...revealHeading} className="mb-16 max-w-2xl">
          <p className="font-display text-lg text-primary">The showcase</p>
          <h2 className="mt-2 font-display font-medium text-4xl tracking-[-.04em] sm:text-5xl">A closer look at what we bake.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Real cakes from the Dzifa Bakes studio, priced from what they actually cost to make. Open one to see it properly, then make it yours below.</p>
        </motion.div>

        <div className="space-y-16 sm:space-y-24">
          {showcase.map((item, index) => {
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
                  <Link href={`/cakes/${item.id}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl" data-testid={`link-showcase-${item.id}`}>
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute right-5 top-5 rounded-full bg-background/90 px-3 py-1.5 font-display text-sm font-medium text-foreground">From {money(item.price)}</span>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: .6, delay: .15 }}
                  className={reversed ? 'lg:order-1' : ''}
                >
                  <h3 className="font-display text-3xl tracking-[-.02em]">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.tagline}</p>
                  <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <Link href={`/cakes/${item.id}`} className="group mt-5 inline-flex items-center gap-2 text-sm text-primary" data-testid={`link-showcase-details-${item.id}`}>
                    See full details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="mt-20">
          <p className="mb-5 text-sm text-muted-foreground">More from the studio</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {studioSamples.map((sample, index) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0, scale: .94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: .4, delay: index * .05 }}
              >
                <Link href={`/cakes/${sample.id}`} className="group relative block aspect-square overflow-hidden rounded-xl" data-testid={`sample-${sample.id}`}>
                  <img src={sample.image} alt={sample.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                    <span className="block text-[11px] text-background">{sample.title}</span>
                    <span className="block text-[10px] text-background/70">From {money(sample.price)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, scale: .98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: .6 }} className="relative flex aspect-[16/7] w-full items-end overflow-hidden rounded-[2rem] sm:aspect-[16/6]">
          <img src={dessertTableImage} alt="A full dessert table styled for a celebration" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/35 to-transparent" />
          <div className="relative p-8 sm:p-12">
            <p className="font-display text-base text-background/80">Beyond the cake</p>
            <h2 className="mt-2 max-w-md font-display font-medium text-3xl text-background sm:text-4xl">Every celebration deserves a full spread.</h2>
            <a href="#builder" className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm text-foreground" data-testid="link-dessert-table-cta">Talk to us about your table <ArrowRight size={16} /></a>
          </div>
        </motion.div>
      </section>

      <section id="builder" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <motion.div {...revealHeading}><p className="font-display text-lg text-primary">Your brief</p><h2 className="mt-2 font-display font-medium text-4xl tracking-[-.04em] sm:text-5xl">Let’s make it yours.</h2></motion.div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Three thoughtful choices. No wrong answers. We’ll follow up personally before anything is baked.</p>
        </div>

        {referenceItem && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center gap-4 rounded-2xl border border-border bg-card p-4" data-testid="card-reference-item">
            <img src={referenceItem.image} alt={referenceItem.title} className="h-16 w-16 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="font-display text-lg">{referenceItem.title}</p>
            </div>
            <button onClick={() => setReferenceItem(null)} aria-label="Clear reference style" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted" data-testid="button-clear-reference">
              <X size={15} />
            </button>
          </motion.div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-10 flex items-center gap-2 border-b border-border pb-4">
              {steps.map((label, index) => <button key={label} onClick={() => setStep(index)} className={`flex flex-1 items-center gap-2 text-left text-xs ${index === step ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`button-step-${index + 1}`}><span className={`grid h-7 w-7 place-items-center rounded-full border text-[11px] ${index < step ? 'border-primary bg-primary text-primary-foreground' : index === step ? 'border-foreground' : 'border-border'}`}>{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span className="hidden sm:inline">{label}</span></button>)}
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .35 }} className="min-h-[320px]">
              {step === 0 && <div className="grid gap-10 sm:grid-cols-2">
                <OptionGroup title="Cake size" detail="A guide to servings" options={options.size} value={input.size} onChange={(value) => update('size', value)} />
                <div><label className="mb-4 block text-sm font-semibold">Layers & tiers</label><div className="space-y-5 rounded-xl border border-border p-5"><NumberControl label="Layers" value={input.layers} min={2} max={4} onChange={(value) => update('layers', value)} /><NumberControl label="Tiers" value={input.tiers} min={1} max={3} onChange={(value) => update('tiers', value)} /></div></div>
              </div>}
              {step === 1 && <div className="grid gap-10 sm:grid-cols-2"><OptionGroup title="Flavour direction" detail="The note guests remember" options={options.flavour} value={input.flavour} onChange={(value) => update('flavour', value)} /><OptionGroup title="Frosting" detail="The texture around it" options={options.frosting} value={input.frosting} onChange={(value) => update('frosting', value)} /></div>}
              {step === 2 && <div className="grid gap-10 sm:grid-cols-2"><OptionGroup title="The finishing touch" detail="A little theatre, if you like" options={options.topper} value={input.topper} onChange={(value) => update('topper', value)} /><OptionGroup title="Drip" detail="A final ribbon of flavour" options={options.drip} value={input.drip} onChange={(value) => update('drip', value)} /></div>}
            </motion.div>
            <div className="mt-8 flex justify-between border-t border-border pt-6"><button onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-30" data-testid="button-builder-back"><ChevronLeft size={16} /> Back</button><button onClick={next} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" data-testid="button-builder-next">{step === 2 ? 'See my quote' : 'Continue'} <ChevronRight size={16} /></button></div>
          </div>
          <aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground sm:p-7 lg:sticky lg:top-28">
            <span className="text-sm text-primary-foreground/70">Working estimate</span>
            <div className="mt-8">
              <span className="text-sm text-primary-foreground/70">From</span>
              <div className="mt-1 overflow-hidden font-display text-5xl tracking-[-.05em]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={previewQuote.total}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: .3 }}
                    className="block"
                    data-testid="text-live-quote"
                  >
                    {money(previewQuote.total)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <p className="mt-2 text-xs leading-5 text-primary-foreground/65">Includes an 8% care & coordination fee. Final quote confirmed by our team.</p>
            </div>
            <div className="my-7 border-t border-primary-foreground/20 pt-5">{previewQuote.lineItems.slice(0, 4).map((line, index) => <div key={line.label} className="mb-3 flex justify-between gap-3 text-xs"><span className="text-primary-foreground/75">{line.label}</span><span className="font-mono-ui text-primary-foreground/90">{line.amount ? money(line.amount) : 'Included'}</span></div>)}</div>
            <Link
              href="/invoice"
              onClick={() => onAddToCart({ quote, image: referenceItem?.image, title: referenceItem?.title })}
              className="flex items-center justify-between rounded-xl bg-background px-4 py-3.5 text-sm font-semibold text-foreground"
              data-testid="link-view-quote"
            >
              Review your quote <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function OptionGroup({ title, detail, options: values, value, onChange }: { title: string; detail: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1 block text-sm font-semibold">{title}</label><p className="mb-4 text-xs text-muted-foreground">{detail}</p><div className="space-y-2">{values.map((option) => <button key={option} onClick={() => onChange(option)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${value === option ? 'border-primary bg-primary/7 text-foreground' : 'border-border hover:border-foreground/35'}`} data-testid={`button-option-${option.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}><span>{option}</span><span className={`h-4 w-4 rounded-full border ${value === option ? 'border-[5px] border-primary' : 'border-muted-foreground/40'}`} /></button>)}</div></div>;
}

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><div className="flex items-center gap-3"><button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-decrease-${label.toLowerCase()}`}><Minus size={14} /></button><span className="w-5 text-center font-mono-ui text-sm" data-testid={`text-${label.toLowerCase()}-value`}>{value}</span><button onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-increase-${label.toLowerCase()}`}><Plus size={14} /></button></div></div>;
}
