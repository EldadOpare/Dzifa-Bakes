import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Mail, MessageCircle, RotateCcw, Store, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import type { CakeQuote } from '@workspace/api-client-react';
import { defaultQuoteInput, fallbackQuote, money, readStoredCart, storeCart, studioContact, type CartEntry } from '../lib/bakery-data';
import logo from '@assets/logo.jpg';

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
    `New cake order — Dzifa Bakes (ref ${reference})`,
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
  const [sentVia, setSentVia] = useState<'whatsapp' | 'email' | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const reference = useMemo(() => `DZ-${Date.now().toString(36).toUpperCase()}`, []);

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

  const checkout = (channel: 'whatsapp' | 'email') => {
    if (!isValid) {
      setShowValidation(true);
      return;
    }
    const text = buildOrderText(quote, details, reference);
    const url =
      channel === 'whatsapp'
        ? `https://wa.me/${studioContact.whatsappNumber}?text=${encodeURIComponent(text)}`
        : `mailto:${studioContact.email}?subject=${encodeURIComponent(`New cake order from ${details.name} (${reference})`)}&body=${encodeURIComponent(text)}`;
    window.open(url, channel === 'whatsapp' ? '_blank' : '_self');
    setSentVia(channel);
  };

  return (
    <main className="mx-auto max-w-[1120px] px-5 py-9 sm:px-8 lg:px-12 lg:py-16">
      <Link href="/" className="mb-10 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back-builder"><ArrowLeft size={14} /> Back to cake builder</Link>
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <img src={logo} alt="Dzifa Bakes" className="mb-6 h-14 w-14 rounded-full object-cover" />
          <p className="font-display text-lg text-primary">Your considered estimate</p>
          <h1 className="mt-3 font-display font-medium text-5xl tracking-[-.05em] sm:text-6xl">A little piece<br /><em className="not-italic text-primary">of the day.</em></h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">This is a working quote, not a payment. Share your details below and send it straight to the studio, Dzifa will personally confirm availability, delivery and the final finish.</p>

          {cart.image && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} className="mt-8">
              <img src={cart.image} alt={cart.title ?? 'The cake you chose'} className="h-56 w-full rounded-2xl object-cover sm:h-72" data-testid="img-chosen-cake" />
              {cart.title && <p className="mt-3 text-sm text-muted-foreground">Based on <span className="font-semibold text-foreground">{cart.title}</span></p>}
            </motion.div>
          )}

          <div className="mt-10 border-y border-border py-3 font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Dzifa Bakes · Custom cake brief · Ref {reference}</div>
          <div className="divide-y divide-border">{quote.lineItems.map((line) => <div key={line.label} className="flex justify-between gap-5 py-4 text-sm"><span>{line.label}</span><span className="font-mono-ui text-xs">{line.amount ? money(line.amount) : 'Included'}</span></div>)}</div>
          <button onClick={clear} className="mt-5 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive" data-testid="button-clear-quote"><RotateCcw size={14} /> Start a new design</button>

          <div className="mt-12 border-t border-border pt-10">
            <p className="font-display text-lg text-primary">Your details</p>
            <h2 className="mt-2 font-display font-medium text-3xl tracking-[-.03em]">Who is this for?</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
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
                <p className="mt-3 text-xs text-muted-foreground">Collect from the Dzifa Bakes studio in Osu.</p>
              ) : (
                <div className="mt-3">
                  <Field label="Delivery address" required value={details.address} onChange={(value) => update('address', value)} invalid={showValidation && !details.address.trim()} testId="input-order-address" />
                </div>
              )}
            </div>

            <label className="mt-6 block text-xs font-semibold">Anything else? Allergies, message on the cake, timing constraints
              <textarea
                value={details.notes}
                onChange={(event) => update('notes', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary"
                data-testid="textarea-order-notes"
              />
            </label>
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }} className="h-fit border border-border bg-card p-6 sm:p-8 lg:sticky lg:top-28">
          <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Estimated total</span><span className="rounded-full bg-accent/25 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-accent-foreground">Valid 7 days</span></div>
          <div className="mt-4 font-display text-4xl tracking-[-.04em]" data-testid="text-invoice-total">{money(quote.total)}</div>
          <div className="mt-7 space-y-3 border-t border-border pt-5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Cake & finishing</span><span className="font-mono-ui">{money(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Care & coordination</span><span className="font-mono-ui">{money(quote.serviceFee)}</span></div>
          </div>

          <div className="mt-7 border-t border-border pt-5">
            {sentVia ? (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Check size={16} /> Order sent {sentVia === 'whatsapp' ? 'to WhatsApp' : 'by email'}.</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">We’ll be in touch within one studio day to confirm the details.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {showValidation && !isValid && (
                  <p className="text-xs text-destructive" data-testid="text-checkout-validation">Add your name, phone{details.fulfillment === 'delivery' ? ' and delivery address' : ''} to send this order.</p>
                )}
                <button onClick={() => checkout('whatsapp')} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" data-testid="button-checkout-whatsapp">
                  <MessageCircle size={15} /> Order via WhatsApp
                </button>
                <button onClick={() => checkout('email')} className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-3 text-sm font-semibold text-foreground hover:bg-muted" data-testid="button-checkout-email">
                  <Mail size={15} /> Order via email
                </button>
              </div>
            )}
          </div>
          <p className="mt-5 text-[11px] leading-5 text-muted-foreground">No payment is taken here. Sending your brief starts a real conversation with the studio at {studioContact.whatsappDisplay}.</p>
        </motion.aside>
      </div>
    </main>
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
        className={`mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary ${invalid ? 'border-destructive' : 'border-border'}`}
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
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${active ? 'border-primary bg-primary/7 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/35'}`}
      data-testid={testId}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
