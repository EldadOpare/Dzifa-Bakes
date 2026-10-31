import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'wouter';
import { useCalculateCakeQuote } from '@workspace/api-client-react';
import type { CakeQuote, CakeQuoteInput } from '@workspace/api-client-react';
import { defaultQuoteInput, fallbackQuote, money, type CartEntry } from '../lib/bakery-data';
import { showcase, studioSamples, type ShowcaseItem } from '../lib/showcase-data';
import { Button } from '@/components/ui/button';
import { CakePreview } from '@/components/cake3d/CakePreview';
import type { CakeDesign } from '@/components/cake3d/Cake';
import { drips, icingPalette, icingStyles, nearestColourName, shapes, toppers, type CakeShape, type IcingStyle } from '@/lib/cake-design';
import { PhotoGallery } from '@/components/ui/gallery';
import phdCake from '@assets/portfolio/c3.jpg';
import ombreCake from '@assets/portfolio/c9.jpg';
import floralCake from '@assets/portfolio/c2.jpg';
import characterCake from '@assets/portfolio/c4.jpg';
import roseCake from '@assets/portfolio/c5.jpg';
import dessertTableImage from '@assets/portfolio/c10.jpg';

type StorefrontProps = { onAddToCart: (entry: CartEntry) => void };
const steps = ['Shape & scale', 'Flavour notes', 'Icing & drip', 'Finishing touch'];
const options = {
  size: ['6 inch', '8 inch', '10 inch', '12 inch'],
  flavour: ['Vanilla bean', 'Dark chocolate', 'Red velvet', 'Pistachio & rose', 'Lemon elderflower'],
  frosting: ['Silky Swiss meringue', 'Cream cheese cloud', 'Salted caramel buttercream', 'Coconut chantilly'],
  topper: ['Fresh flowers', 'Hand-piped message', 'Chocolate sails', 'Minimal finish'],
  drip: ['No drip', 'Dark chocolate drip', 'Gold caramel drip'],
};

const heroPhotos = [
  { src: phdCake, alt: 'A white and gold PhD celebration cake' },
  { src: ombreCake, alt: 'A pink and yellow birthday cake with a name plaque' },
  { src: floralCake, alt: 'A pink ruffled birthday cake crowned with flowers' },
  { src: characterCake, alt: 'A blue PJ Masks birthday cake' },
  { src: roseCake, alt: 'A white cake with red drips and a deep red rose' },
];

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
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [sliceOn, setSliceOn] = useState(false);
  const [input, setInput] = useState<CakeQuoteInput>(defaultQuoteInput);
  const [quote, setQuote] = useState<CakeQuote>(() => fallbackQuote(defaultQuoteInput));
  const [added, setAdded] = useState(false);
  const [referenceItem, setReferenceItem] = useState<ShowcaseItem | null>(null);
  const quoteMutation = useCalculateCakeQuote();
  const previewQuote = useMemo(() => fallbackQuote(input), [input]);
  const design = useMemo<CakeDesign>(() => ({
    size: input.size, layers: input.layers, tiers: input.tiers, flavour: input.flavour, frosting: input.frosting,
    shape: (input.shape ?? 'Round') as CakeShape, icingColour: input.icingColour ?? '#F7F1E3', icingStyle: (input.icingStyle ?? 'Smooth') as IcingStyle,
    drip: input.drip, topper: input.topper, message: input.message ?? '',
    visible: started, slice: sliceOn,
  }), [input, started, sliceOn]);

  useEffect(() => {
    const styleId = searchParams.get('style');
    const item = styleId ? allItems.find((candidate) => candidate.id === styleId) : null;
    if (!item) return;
    setReferenceItem(item);
    setStarted(true);
    if (item.preset) setInput((current) => ({ ...current, ...item.preset }));
    const timer = setTimeout(() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(timer);
  }, []);

  const goToStep = (target: number) => setStep(target);
  // The slice opens on the flavour step and the cake closes again everywhere else.
  useEffect(() => { setSliceOn(step === 1); }, [step]);

  const update = <K extends keyof CakeQuoteInput>(key: K, value: CakeQuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setStarted(true);
    setAdded(false);
  };
  const calculate = () => {
    setQuote(previewQuote);
    quoteMutation.mutate({ data: input }, { onSuccess: (serverQuote) => setQuote(serverQuote) });
  };
  const reviewQuote = () => {
    onAddToCart({ quote: previewQuote, image: referenceItem?.image, title: referenceItem?.title, design: { ...design, visible: true, slice: false } });
    navigate('/invoice');
    window.scrollTo({ top: 0 });
  };
  const next = () => {
    if (step < steps.length - 1) goToStep(step + 1);
    else reviewQuote();
  };

  return (
    <main>
      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
        <PhotoGallery
          photos={heroPhotos}
          eyebrow="A pastry consultation, online"
          title={<>Made for the moments<br /><em className="text-primary not-italic">worth celebrating.</em></>}
          description="Tell us the feeling, we’ll take care of the details. Design a celebration cake with our Accra pastry team and see a considered quote in seconds."
          actions={
            <>
              <Button asChild size="lg">
                <a href="#builder" className="group gap-3" data-testid="link-start-builder">Begin your design <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#showcase">View the showcase</a>
              </Button>
            </>
          }
        />
      </section>

      <section id="showcase" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <motion.div {...revealHeading} className="mb-16 max-w-2xl">
          <p className="font-display text-lg text-primary">The showcase</p>
          <h2 className="mt-2 font-display font-medium text-4xl tracking-[-.04em] sm:text-5xl">A closer look at what we bake.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Real cakes from the Dzilicious Bakery & More studio, priced from what they actually cost to make. Open one to see it properly, then make it yours below.</p>
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
                  <Link href={`/cakes/${item.id}`} className="group relative block aspect-square overflow-hidden rounded-2xl" data-testid={`link-showcase-${item.id}`}>
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: 'center 35%' }} />
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
                  <img src={sample.image} alt={sample.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: 'center 35%' }} />
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

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative h-[min(58vh,520px)] min-h-[320px] w-full overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-white to-muted" data-testid="cake-preview">
              <CakePreview design={design} />
              {!started && <div className="pointer-events-none absolute inset-x-0 top-8 text-center"><p className="font-display text-xl">Your plate is ready.</p><p className="mt-1 text-sm text-muted-foreground">Choose a size to start building.</p></div>}
              {started && <button onClick={() => setSliceOn((on) => !on)} className="absolute right-4 top-4 rounded-full border border-border bg-background/90 px-4 py-2 text-xs font-medium backdrop-blur hover:bg-muted" data-testid="button-toggle-slice">{sliceOn ? 'Whole cake' : 'Cut a slice'}</button>}
              <span className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] tracking-wide text-muted-foreground">Drag to turn · scroll to zoom</span>
            </div>
            <div className="relative mt-3 flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
              <details className="group min-w-0">
                <summary className="flex cursor-pointer list-none flex-col" data-testid="button-quote-breakdown">
                  <span className="text-xs text-primary-foreground/70">Working estimate · <span className="underline underline-offset-2">breakdown</span></span>
                  <AnimatePresence mode="wait">
                    <motion.span key={previewQuote.total} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .25 }} className="block font-display text-3xl tracking-[-.04em]" data-testid="text-live-quote">
                      {money(previewQuote.total)}
                    </motion.span>
                  </AnimatePresence>
                </summary>
                <div className="absolute inset-x-0 bottom-full z-20 mb-2 max-h-72 overflow-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl">
                  {previewQuote.lineItems.map((line) => <div key={line.label} className="mb-2.5 flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{line.label}</span><span className="tabular-nums">{line.amount ? money(line.amount) : 'Included'}</span></div>)}
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-xs"><span className="text-muted-foreground">Care & coordination (8%)</span><span className="tabular-nums">{money(previewQuote.serviceFee)}</span></div>
                  <p className="mt-3 text-[11px] leading-4 text-muted-foreground">Final quote confirmed by our team.</p>
                </div>
              </details>
              <Link
                href="/invoice"
                onClick={() => onAddToCart({ quote: previewQuote, image: referenceItem?.image, title: referenceItem?.title, design: { ...design, visible: true, slice: false } })}
                className="flex shrink-0 items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground"
                data-testid="link-view-quote"
              >
                Review quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-8 flex items-center gap-2 border-b border-border pb-4">
              {steps.map((label, index) => <button key={label} onClick={() => goToStep(index)} className={`flex flex-1 items-center gap-2 text-left text-xs ${index === step ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`button-step-${index + 1}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] ${index < step ? 'border-primary bg-primary text-primary-foreground' : index === step ? 'border-foreground' : 'border-border'}`}>{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span className="hidden sm:inline">{label}</span></button>)}
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .35 }} className="min-h-[300px]">
              {step === 0 && <div className="space-y-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  <OptionGroup title="Cake size" detail="A guide to servings" options={options.size} value={started ? input.size : ''} onChange={(value) => update('size', value)} />
                  <div><label className="mb-4 block text-sm font-semibold">Layers & tiers</label><div className="space-y-5 rounded-xl border border-border p-5"><NumberControl label="Layers" value={started ? input.layers : 0} min={started ? 1 : 0} max={4} onChange={(value) => value >= 1 && update('layers', value)} /><NumberControl label="Tiers" value={started ? input.tiers : 0} min={started ? 1 : 0} max={3} onChange={(value) => value >= 1 && update('tiers', value)} /></div></div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Shape</label>
                  <p className="mb-4 text-xs text-muted-foreground">Watch the cake change as you choose</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{shapes.map((shape) => <button key={shape} onClick={() => update('shape', shape)} className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs transition-colors ${started && design.shape === shape ? 'border-primary bg-primary/7' : 'border-border hover:border-foreground/35'}`} data-testid={`button-shape-${shape.toLowerCase()}`}><ShapeIcon shape={shape} />{shape}</button>)}</div>
                </div>
              </div>}
              {step === 1 && <div className="grid gap-8 sm:grid-cols-2"><OptionGroup title="Flavour direction" detail="The note guests remember" options={options.flavour} value={input.flavour} onChange={(value) => update('flavour', value)} /><OptionGroup title="Frosting" detail="The filling between the layers" options={options.frosting} value={input.frosting} onChange={(value) => update('frosting', value)} /></div>}
              {step === 2 && <div className="space-y-8">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Icing colour</label>
                  <p className="mb-4 text-xs text-muted-foreground">{nearestColourName(design.icingColour)}</p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {icingPalette.map((swatch) => <button key={swatch.hex} onClick={() => update('icingColour', swatch.hex)} title={swatch.name} aria-label={swatch.name} className={`h-9 w-9 rounded-full border transition-transform hover:scale-110 ${design.icingColour.toLowerCase() === swatch.hex.toLowerCase() ? 'ring-2 ring-primary ring-offset-2' : 'border-border'}`} style={{ backgroundColor: swatch.hex }} data-testid={`button-colour-${swatch.name.toLowerCase().replaceAll(' ', '-')}`} />)}
                    <label className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-muted-foreground/60 text-[10px] text-muted-foreground" title="Pick any colour">
                      <span className="pointer-events-none">+</span>
                      <input type="color" value={design.icingColour} onChange={(event) => update('icingColour', event.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Custom icing colour" data-testid="input-colour-custom" />
                    </label>
                  </div>
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <OptionGroup title="Icing style" detail="How the icing is finished" options={[...icingStyles]} value={design.icingStyle} onChange={(value) => update('icingStyle', value as IcingStyle)} />
                  <OptionGroup title="Drip" detail="A final ribbon of flavour" options={[...drips]} value={input.drip} onChange={(value) => update('drip', value)} />
                </div>
              </div>}
              {step === 3 && <div className="space-y-8">
                <OptionGroup title="The finishing touch" detail="A little theatre, if you like" options={[...toppers]} value={input.topper} onChange={(value) => update('topper', value)} after={(option) => option === 'Hand-piped message' && input.topper === option ? <div className="rounded-xl border border-primary/40 bg-primary/5 p-4"><label htmlFor="cake-message" className="mb-2 block text-xs font-semibold">What should it say?</label><textarea id="cake-message" autoFocus value={design.message} maxLength={50} rows={2} placeholder="Type anything, e.g. Happy Birthday Ama" onChange={(event) => update('message', event.target.value)} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-cake-message" /><p className="mt-2 text-[11px] text-muted-foreground">Piped by hand on top of the cake. Press Enter for a second line · {design.message.length}/50</p></div> : null} />
              </div>}
            </motion.div>
            <div className="mt-8 flex justify-between border-t border-border pt-6"><button onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0} className="flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-30" data-testid="button-builder-back"><ChevronLeft size={16} /> Back</button><button onClick={next} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" data-testid="button-builder-next">{step === steps.length - 1 ? 'Review my quote' : 'Continue'} <ChevronRight size={16} /></button></div>

          </div>
        </div>
      </section>
    </main>
  );
}

function OptionGroup({ title, detail, options: values, value, onChange, after }: { title: string; detail: string; options: string[]; value: string; onChange: (value: string) => void; after?: (option: string) => ReactNode }) {
  return <div><label className="mb-1 block text-sm font-semibold">{title}</label><p className="mb-4 text-xs text-muted-foreground">{detail}</p><div className="space-y-2">{values.map((option) => <div key={option}><button onClick={() => onChange(option)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${value === option ? 'border-primary bg-primary/7 text-foreground' : 'border-border hover:border-foreground/35'}`} data-testid={`button-option-${option.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}><span>{option}</span><span className={`h-4 w-4 rounded-full border ${value === option ? 'border-[5px] border-primary' : 'border-muted-foreground/40'}`} /></button>{after?.(option) ? <div className="mt-2">{after(option)}</div> : null}</div>)}</div></div>;
}

const shapePaths: Record<CakeShape, string> = {
  Round: 'M16 4a12 12 0 1 0 0 24a12 12 0 1 0 0-24z',
  Square: 'M6 6h20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  Rectangle: 'M3 9h26a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z',
  Hexagon: 'M16 3l11 6.5v13L16 29 5 22.5v-13z',
  Octagon: 'M11 4h10l7 7v10l-7 7H11l-7-7V11z',
  Heart: 'M16 28C6 20 3 15 3 10.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 2.5C29 15 26 20 16 28z',
};

function ShapeIcon({ shape }: { shape: CakeShape }) {
  return <svg viewBox="0 0 32 32" className="h-8 w-8 text-foreground/70" aria-hidden="true"><path d={shapePaths[shape]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><div className="flex items-center gap-3"><button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-decrease-${label.toLowerCase()}`}><Minus size={14} /></button><span className="w-5 text-center tabular-nums text-sm" data-testid={`text-${label.toLowerCase()}-value`}>{value}</span><button onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-increase-${label.toLowerCase()}`}><Plus size={14} /></button></div></div>;
}
