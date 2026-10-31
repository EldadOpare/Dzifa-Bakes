import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardList, MessageCircle, RotateCcw, Store, Truck } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useCreateOrder } from '@workspace/api-client-react';
import type { CakeQuote } from '@workspace/api-client-react';
import { defaultQuoteInput, fallbackQuote, money, readStoredCart, storeCart, studioContact, type CartEntry } from '../lib/bakery-data';
import { CakePreview } from '@/components/cake3d/CakePreview';
import { nearestColourName } from '@/lib/cake-design';
import logo from '@assets/logo.png';

type InvoicePageProps = { cart: CartEntry | null; onClear: () => void };
type Fulfillment = 'pickup' | 'delivery';

type OrderDetails = {
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  fulfillment: Fulfillment;
  address: string;
  notes: string;
};

const blankDetails: OrderDetails = {
  name: '',
  phone: '',
  email: '',
  eventDate: '',
  fulfillment: 'pickup',
  address: '',
  notes: '',
};

function buildOrderText(quote: CakeQuote, details: OrderDetails, reference: string) {
  const lines = quote.lineItems.map((line) => `- ${line.label}${line.amount ? ` (${money(line.amount)})` : ''}`);
  const fulfilmentLine =
    details.fulfillment === 'delivery'
      ? `Delivery to: ${details.address || 'address to confirm'}`
      : 'Pickup at the Osu studio';
  return [
    `New cake order — Dzilicious Bakery & More (ref ${reference})`,
    '',
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    details.email && `Email: ${details.email}`,
    details.eventDate && `Event date: ${details.eventDate}`,
    fulfilmentLine,
    details.notes && `Notes: ${details.notes}`,
    '',
    'Order:',
    ...lines,
    '',
    `Cake & finishing: ${money(quote.subtotal)}`,
    `Care & coordination: ${money(quote.serviceFee)}`,
    `Total: ${money(quote.total)}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

export function InvoicePage({ cart: propCart, onClear }: InvoicePageProps) {
  const [cart, setCart] = useState<CartEntry | null>(() => propCart ?? readStoredCart() ?? { quote: fallbackQuote(defaultQuoteInput) });
  const [details, setDetails] = useState<OrderDetails>(blankDetails);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const reference = useMemo(() => `DZ-${Date.now().toString(36).toUpperCase()}`, []);
  const createOrder = useCreateOrder();

  const clear = () => { setCart(null); storeCart(null); onClear(); };

  if (!cart) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary"><ClipboardList size={25} /></div>
        <h1 className="mt-6 font-display text-4xl">Your quote is waiting to be imagined.</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Build a celebration cake and we’ll keep your estimate right here.</p>
        <Link href="/" className="mt-7 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="link-empty-start">Start designing <ArrowRight size={15} /></Link>
      </main>
    );
  }

  const quote = cart.quote;
  const update = <K extends keyof OrderDetails>(key: K, value: OrderDetails[K]) => setDetails((current) => ({ ...current, [key]: value }));

  const isValid = details.name.trim().length > 0 && details.phone.trim().length > 0 && (details.fulfillment === 'pickup' || details.address.trim().length > 0);

  const goNext = () => {
    if (step === 1 && !isValid) {
      setShowValidation(true);
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const checkout = () => {
    if (!isValid) {
      setShowValidation(true);
      setStep(1);
      return;
    }
    createOrder.mutate({
      data: {
        reference,
        customerName: details.name,
        phone: details.phone,
        email: details.email || undefined,
        eventDate: details.eventDate || undefined,
        fulfillment: details.fulfillment,
        address: details.fulfillment === 'delivery' ? details.address : undefined,
        notes: details.notes || undefined,
        channel: 'whatsapp',
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        serviceFee: quote.serviceFee,
        total: quote.total,
      },
    }, {
      onError: (error) => console.error('Could not save order', error),
    });
    const text = buildOrderText(quote, details, reference);
    const url = `https://wa.me/${studioContact.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSent(true);
  };

  const design = cart.design;
  const summary: [string, string][] = design ? [
    ['Shape', design.shape],
    ['Size', `${design.size} · ${design.layers} ${design.layers === 1 ? 'layer' : 'layers'}${design.tiers > 1 ? ` · ${design.tiers} tiers` : ''}`],
    ['Flavour', design.flavour],
    ['Filling', design.frosting],
    ['Icing', `${design.icingStyle} · ${nearestColourName(design.icingColour)}`],
    ['Drip', design.drip === 'No drip' ? 'None' : design.drip.replace(' drip', '')],
    ['Finish', design.topper === 'Hand-piped message' && design.message.trim() ? `“${design.message.trim()}”` : design.topper],
  ] : [];

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-20 pt-9 sm:px-8 lg:px-12 lg:pt-14">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back-builder"><ArrowLeft size={14} /> Back to the builder</Link>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-lg text-primary">Your considered estimate</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-.04em] sm:text-5xl">Review your quote</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">A working quote, not a payment. Add your details and send it to the studio, and we’ll personally confirm availability and the final finish.</p>
      </motion.header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative h-[min(38vh,340px)] min-h-[260px] overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-white to-muted">
            {design ? (
              <CakePreview design={design} />
            ) : cart.image ? (
              <img src={cart.image} alt={cart.title ?? 'The cake you chose'} className="h-full w-full object-cover" data-testid="img-chosen-cake" />
            ) : (
              <div className="grid h-full place-items-center"><img src={logo} alt="Dzilicious Bakery & More" className="h-28 w-28 object-contain mix-blend-multiply" /></div>
            )}
            {design && <span className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] tracking-wide text-muted-foreground">Drag to turn</span>}
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">{cart.title ? `Based on ${cart.title}` : 'Your design'}</h2>
              <button onClick={clear} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive" data-testid="button-clear-quote"><RotateCcw size={13} /> Start over</button>
            </div>
            {summary.length > 0 && (
              <dl className="mt-3 divide-y divide-border text-sm">
                {summary.map(([label, value]) => <div key={label} className="flex justify-between gap-6 py-1.5 text-[13px]"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>)}
              </dl>
            )}
          </div>
        </motion.div>

        <div>
          <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
            {['Your quote', 'Your details', 'Send'].map((label, index) => (
              <button key={label} onClick={() => (index <= step || isValid) && setStep(index)} className={`flex flex-1 items-center gap-2 text-left text-xs ${index === step ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`button-invoice-step-${index + 1}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] ${index < step ? 'border-primary bg-primary text-primary-foreground' : index === step ? 'border-foreground' : 'border-border'}`}>{index < step ? <Check size={13} /> : `0${index + 1}`}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .35 }}>
            {step === 0 && (
          <Panel title="Your quote" aside={<span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Valid 7 days</span>}>
            <p className="text-xs tabular-nums text-muted-foreground">Ref {reference}</p>
            <div className="mt-4 divide-y divide-border">
              {quote.lineItems.map((line) => <div key={line.label} className="flex justify-between gap-5 py-3 text-sm"><span>{line.label}</span><span className="tabular-nums text-xs text-muted-foreground">{line.amount ? money(line.amount) : 'Included'}</span></div>)}
            </div>
            <div className="mt-2 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cake & finishing</span><span className="tabular-nums text-xs">{money(quote.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Care & coordination (8%)</span><span className="tabular-nums text-xs">{money(quote.serviceFee)}</span></div>
            </div>
            <div className="mt-5 flex items-end justify-between rounded-2xl bg-primary px-6 py-5 text-primary-foreground">
              <span className="text-sm text-primary-foreground/75">Estimated total</span>
              <span className="font-display text-4xl tracking-[-.04em]" data-testid="text-invoice-total">{money(quote.total)}</span>
            </div>
          </Panel>

            )}
            {step === 1 && (
          <Panel title="Your details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required value={details.name} onChange={(value) => update('name', value)} invalid={showValidation && !details.name.trim()} testId="input-order-name" />
              <Field label="Phone / WhatsApp" required type="tel" placeholder="+233 ..." value={details.phone} onChange={(value) => update('phone', value)} invalid={showValidation && !details.phone.trim()} testId="input-order-phone" />
              <Field label="Email (optional)" type="email" value={details.email} onChange={(value) => update('email', value)} testId="input-order-email" />
              <Field label="Event date" type="date" value={details.eventDate} onChange={(value) => update('eventDate', value)} testId="input-order-date" />
            </div>

            <div className="mt-6">
              <span className="mb-3 block text-xs font-semibold">How should it reach you?</span>
              <div className="flex gap-2">
                <FulfillmentOption label="Pickup" icon={Store} active={details.fulfillment === 'pickup'} onClick={() => update('fulfillment', 'pickup')} testId="button-fulfillment-pickup" />
                <FulfillmentOption label="Delivery" icon={Truck} active={details.fulfillment === 'delivery'} onClick={() => update('fulfillment', 'delivery')} testId="button-fulfillment-delivery" />
              </div>
              {details.fulfillment === 'pickup' ? (
                <p className="mt-3 text-xs text-muted-foreground">Collect from the Dzilicious Bakery & More studio in Osu.</p>
              ) : (
                <div className="mt-4">
                  <Field label="Delivery address" required value={details.address} onChange={(value) => update('address', value)} invalid={showValidation && !details.address.trim()} testId="input-order-address" />
                </div>
              )}
            </div>

            <label className="mt-6 block text-xs font-semibold">Anything else? Allergies, timing, special requests
              <textarea
                value={details.notes}
                onChange={(event) => update('notes', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-normal outline-none focus:border-primary"
                data-testid="textarea-order-notes"
              />
            </label>
          </Panel>

            )}
            {step === 2 && (
              <Panel title="Send to the studio">
                {sent ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Check size={16} /> Order sent to WhatsApp.</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">We’ll be in touch within one studio day to confirm the details.</p>
                  </div>
                ) : (
                  <div>
                    <dl className="divide-y divide-border text-sm">
                      <div className="flex justify-between gap-6 py-2.5"><dt className="text-muted-foreground">For</dt><dd>{details.name || '—'}</dd></div>
                      <div className="flex justify-between gap-6 py-2.5"><dt className="text-muted-foreground">Phone</dt><dd>{details.phone || '—'}</dd></div>
                      {details.eventDate && <div className="flex justify-between gap-6 py-2.5"><dt className="text-muted-foreground">Event date</dt><dd>{details.eventDate}</dd></div>}
                      <div className="flex justify-between gap-6 py-2.5"><dt className="text-muted-foreground">Reaches you by</dt><dd>{details.fulfillment === 'delivery' ? `Delivery · ${details.address}` : 'Pickup in Osu'}</dd></div>
                      <div className="flex justify-between gap-6 py-2.5"><dt className="text-muted-foreground">Estimated total</dt><dd className="font-semibold">{money(quote.total)}</dd></div>
                    </dl>
                    {showValidation && !isValid && (
                      <p className="mt-4 text-xs text-destructive" data-testid="text-checkout-validation">Add your name, phone{details.fulfillment === 'delivery' ? ' and delivery address' : ''} to send this order.</p>
                    )}
                    <button onClick={checkout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90" data-testid="button-checkout-whatsapp">
                      <MessageCircle size={15} /> Send order on WhatsApp
                    </button>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">No payment is taken here. Sending your brief starts a real conversation with the studio at {studioContact.whatsappDisplay}.</p>
                  </div>
                )}
              </Panel>
            )}
          </motion.div>

          <div className="mt-6 flex justify-between border-t border-border pt-5">
            <button onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-30" data-testid="button-invoice-back"><ChevronLeft size={16} /> Back</button>
            {step < 2 && <button onClick={goNext} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" data-testid="button-invoice-next">{step === 0 ? 'Add your details' : 'Continue'} <ChevronRight size={16} /></button>}
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl tracking-[-.02em]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  invalid = false,
  type = 'text',
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
  type?: string;
  placeholder?: string;
  testId: string;
}) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:border-primary ${invalid ? 'border-destructive' : 'border-border'}`}
        data-testid={testId}
      />
      {required && invalid && <span className="mt-1 block text-[11px] font-normal text-destructive">Required</span>}
    </label>
  );
}

function FulfillmentOption({ label, icon: Icon, active, onClick, testId }: { label: string; icon: typeof Store; active: boolean; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${active ? 'border-primary bg-primary/7 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/35'}`}
      data-testid={testId}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
