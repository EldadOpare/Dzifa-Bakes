import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Leaf, Minus, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useCalculateCakeQuote } from '@workspace/api-client-react';
import type { CakeQuote, CakeQuoteInput } from '@workspace/api-client-react';
import { defaultQuoteInput, fallbackQuote, money } from '../lib/bakery-data';

type StorefrontProps = { onAddToCart: (quote: CakeQuote) => void };
const steps = ['Shape & scale', 'Flavour notes', 'Finish & detail'];
const options = {
  size: ['6 inch', '8 inch', '10 inch', '12 inch'],
  flavour: ['Vanilla bean', 'Dark chocolate', 'Red velvet', 'Pistachio & rose', 'Lemon elderflower'],
  frosting: ['Silky Swiss meringue', 'Cream cheese cloud', 'Salted caramel buttercream', 'Coconut chantilly'],
  topper: ['Fresh flowers', 'Hand-piped message', 'Chocolate sails', 'Minimal finish'],
  drip: ['No drip', 'Dark chocolate drip', 'Gold caramel drip'],
};

export function Storefront({ onAddToCart }: StorefrontProps) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CakeQuoteInput>(defaultQuoteInput);
  const [quote, setQuote] = useState<CakeQuote>(() => fallbackQuote(defaultQuoteInput));
  const [added, setAdded] = useState(false);
  const quoteMutation = useCalculateCakeQuote();
  const previewQuote = useMemo(() => fallbackQuote(input), [input]);

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="max-w-2xl">
            <div className="mb-7 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.22em] text-primary">
              <span className="h-px w-8 bg-primary" /> A pastry consultation, online
            </div>
            <h1 className="font-display text-[clamp(3.5rem,8vw,7.4rem)] leading-[.9] tracking-[-.065em] text-foreground">A cake with<br /><em className="text-primary not-italic">your story</em> in it.</h1>
            <p className="mt-8 max-w-md text-[17px] leading-7 text-muted-foreground">Tell us the feeling, we’ll take care of the details. Design a celebration cake with our Accra pastry team and see a considered quote in seconds.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <a href="#builder" className="group flex items-center gap-3 rounded-full bg-foreground px-6 py-3.5 text-sm text-background transition-transform hover:translate-x-1" data-testid="link-start-builder">Begin your design <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
              <span className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">Made to order · Osu studio</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15, duration: .8 }} className="relative mx-auto flex aspect-[.94] w-full max-w-[550px] items-center justify-center overflow-hidden rounded-[2rem] bg-secondary/60">
            <div className="absolute right-8 top-8 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">01 / 04</div>
            <div className="absolute bottom-8 left-8 flex items-center gap-2 text-xs text-muted-foreground"><Leaf size={14} className="text-primary" /> Ingredients with a point of view</div>
            <div className="animate-drift relative mt-10 h-48 w-56 rounded-[45%_45%_18%_18%] border-b-[14px] border-[#d79f84] bg-[#f7ddc9] before:absolute before:-top-8 before:left-8 before:h-12 before:w-40 before:rounded-full before:bg-[#fff4e8] after:absolute after:-top-1 after:left-0 after:h-4 after:w-full after:rounded-[50%] after:bg-[#e9b18f] sm:h-56 sm:w-72">
              <div className="absolute -top-3 left-1/2 h-9 w-2 -translate-x-1/2 rotate-12 rounded-full bg-primary/80" />
              <div className="absolute left-1/2 top-12 h-3 w-3 -translate-x-1/2 rounded-full bg-accent" />
              <div className="absolute bottom-8 left-8 h-2 w-28 rounded-full bg-[#c9846d]/50" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="builder" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Your brief</p><h2 className="mt-3 font-display text-4xl tracking-[-.04em] sm:text-5xl">Let’s make it yours.</h2></div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Three thoughtful choices. No wrong answers. We’ll follow up personally before anything is baked.</p>
        </div>
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
          <aside className="h-fit rounded-2xl bg-foreground p-6 text-background sm:p-7 lg:sticky lg:top-28">
            <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-background/50">Working estimate</span><Sparkles size={16} className="text-accent" /></div>
            <div className="mt-8"><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-background/50">From</span><div className="mt-1 font-display text-5xl tracking-[-.05em]" data-testid="text-live-quote">{money(previewQuote.total)}</div><p className="mt-2 text-xs leading-5 text-background/55">Includes an 8% care & coordination fee. Final quote confirmed by our team.</p></div>
            <div className="my-7 border-t border-background/15 pt-5">{previewQuote.lineItems.slice(0, 4).map((line, index) => <div key={line.label} className="mb-3 flex justify-between gap-3 text-xs"><span className="text-background/65">{line.label}</span><span className="font-mono-ui text-background/80">{line.amount ? money(line.amount) : 'Included'}</span></div>)}</div>
            <Link href="/invoice" onClick={() => onAddToCart(quote)} className="flex items-center justify-between rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-accent-foreground" data-testid="link-view-quote">Review your quote <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>
      <section className="border-y border-border bg-muted/45"><div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:px-12"><TrustItem number="01" title="A real conversation" text="Every order gets a human check-in from our pastry team." /><TrustItem number="02" title="Ingredient integrity" text="We source with the same care we bring to the finish." /><TrustItem number="03" title="The Accra feeling" text="Warm, considered cakes for the moments worth keeping." /></div></section>
    </main>
  );
}

function OptionGroup({ title, detail, options: values, value, onChange }: { title: string; detail: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1 block text-sm font-semibold">{title}</label><p className="mb-4 text-xs text-muted-foreground">{detail}</p><div className="space-y-2">{values.map((option) => <button key={option} onClick={() => onChange(option)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${value === option ? 'border-primary bg-primary/7 text-foreground' : 'border-border hover:border-foreground/35'}`} data-testid={`button-option-${option.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}><span>{option}</span><span className={`h-4 w-4 rounded-full border ${value === option ? 'border-[5px] border-primary' : 'border-muted-foreground/40'}`} /></button>)}</div></div>;
}

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><div className="flex items-center gap-3"><button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-decrease-${label.toLowerCase()}`}><Minus size={14} /></button><span className="w-5 text-center font-mono-ui text-sm" data-testid={`text-${label.toLowerCase()}-value`}>{value}</span><button onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border" data-testid={`button-increase-${label.toLowerCase()}`}><Plus size={14} /></button></div></div>;
}

function TrustItem({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="flex gap-4"><span className="font-mono-ui text-[10px] text-primary">{number}</span><div><h3 className="font-display text-xl">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{text}</p></div></div>;
}