import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Factory, RefreshCw, WalletCards } from 'lucide-react';
import { Link } from 'wouter';
import { useGetBakerySummary } from '@workspace/api-client-react';
import type { BakerySummary } from '@workspace/api-client-react';
import { fallbackSummary, money } from '../lib/bakery-data';
import heroImage from '@assets/generated_images/hero-baking.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: .5 } },
};

export function AdminDashboard() {
  const summaryQuery = useGetBakerySummary();
  const summary: BakerySummary = summaryQuery.data ?? fallbackSummary;
  const maxRevenue = Math.max(...summary.weeklyRevenue.map((point) => point.value), 1);
  const isFallback = Boolean(summaryQuery.isError);
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <motion.div initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} className="relative flex aspect-[21/9] w-full items-end overflow-hidden rounded-[2rem] sm:aspect-[21/6]">
        <img src={heroImage} alt="Dzifa finishing a cake in the studio" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/40 to-transparent" />
        <div className="relative flex w-full items-end justify-between gap-4 p-6 sm:p-10">
          <div>
            <p className="font-display text-lg text-background/80">Studio pulse</p>
            <h1 className="mt-1 font-display font-medium text-3xl text-background tracking-[-.02em] sm:text-4xl">Good morning, Dzifa.</h1>
            <p className="mt-2 text-sm text-background/75">Here’s the shape of the bakery today.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className={`font-mono-ui text-[10px] uppercase tracking-[.12em] ${isFallback ? 'text-accent' : 'text-background/90'}`} data-testid="status-dashboard-data">{isFallback ? 'Local snapshot' : 'Live from studio'}</span>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-background/30 text-background hover:bg-background/10" onClick={() => summaryQuery.refetch()} aria-label="Refresh dashboard" data-testid="button-refresh-dashboard"><RefreshCw size={14} /></button>
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .08, delayChildren: .15 } } }} className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="flex flex-col justify-between rounded-2xl border border-border bg-primary p-6 text-primary-foreground sm:p-8" data-testid="metric-revenue-this-month">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-foreground/70">Revenue this month</span>
            <WalletCards size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="mt-6 font-display font-medium text-4xl tracking-[-.03em]">{money(summary.revenue)}</div>
            <div className="mt-2 font-mono-ui text-[10px] uppercase tracking-[.08em] text-primary-foreground/70">+12.4% on last month</div>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Metric label="Open orders" value={String(summary.openOrders)} change="4 due today" icon={CalendarDays} />
          <Metric label="Low stock" value={String(summary.lowStockCount).padStart(2, '0')} change="Needs your eye" icon={CircleAlert} />
        </div>
        <Metric label="Inventory value" value={money(summary.inventoryValue)} change="At cost" icon={Boxes} tall />
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <motion.section initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .5 }} className="rounded-2xl border border-border bg-card p-6 sm:p-8" data-testid="section-revenue-chart">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">The week in numbers</p>
              <h2 className="mt-1 font-display font-medium text-2xl">Revenue rhythm</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 font-mono-ui text-[10px] text-secondary-foreground">GHS · 7 days</span>
          </div>
          <div className="mt-10 flex h-56 items-end gap-2 sm:gap-4">
            {summary.weeklyRevenue.map((point, index) => (
              <div key={point.day} className="group flex h-full flex-1 flex-col justify-end gap-3">
                <div className="relative flex flex-1 items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${Math.max(10, (point.value / maxRevenue) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: .6, delay: index * .06, ease: 'easeOut' }}
                    className="w-full rounded-t-sm bg-primary/85 transition-colors group-hover:bg-accent"
                    title={`${money(point.value)}`}
                    data-testid={`bar-revenue-${point.day}`}
                  />
                </div>
                <span className="font-mono-ui text-[10px] text-muted-foreground">{point.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Peak service day</span>
            <span className="font-mono-ui text-xs text-foreground" data-testid="text-peak-day">Saturday · {money(Math.max(...summary.weeklyRevenue.map((point) => point.value)))}</span>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .5, delay: .1 }} className="rounded-2xl border border-border bg-foreground p-6 text-background sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-background/60">Today at a glance</p>
              <h2 className="mt-1 font-display font-medium text-2xl">Keep the care moving.</h2>
            </div>
            <CheckCircle2 size={20} strokeWidth={1.5} />
          </div>
          <div className="mt-10 space-y-5">
            <PulseRow time="09:30" title="Mawuli · 2-tier celebration" note="Ready for finishing" status="In progress" />
            <PulseRow time="12:00" title="Ama · Lemon elderflower" note="Collection · Osu" status="Next up" />
            <PulseRow time="15:45" title="Kojo · Dark chocolate" note="Quote awaiting reply" status="Review" />
          </div>
          <Link href="/admin/inventory" className="mt-9 flex items-center justify-between border-t border-background/20 pt-4 text-sm" data-testid="link-open-operations">Open operations <ArrowUpRight size={16} /></Link>
        </motion.section>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/inventory" icon={Boxes} title="Inventory watch" text={`${summary.lowStockCount} items need a restock decision`} />
        <QuickLink href="/admin/equipment" icon={Factory} title="Equipment care" text="One service window needs scheduling" />
        <QuickLink href="/invoice" icon={CalendarDays} title="Customer view" text="Build a cake or review a quote" />
      </section>
    </main>
  );
}

function Metric({ label, value, change, icon: Icon, tall = false }: { label: string; value: string; change: string; icon: typeof WalletCards; tall?: boolean }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon size={17} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <div>
        <div className="mt-4 font-display font-medium text-2xl tracking-[-.02em]">{value}</div>
        <div className="mt-2 font-mono-ui text-[10px] uppercase tracking-[.08em] text-muted-foreground">{change}</div>
      </div>
    </motion.div>
  );
}

function PulseRow({ time, title, note, status }: { time: string; title: string; note: string; status: string }) {
  return <div className="grid grid-cols-[42px_1fr_auto] gap-3 border-b border-background/15 pb-4"><span className="font-mono-ui text-[10px] text-background/55">{time}</span><div><div className="text-sm">{title}</div><div className="mt-1 text-xs text-background/60">{note}</div></div><span className="text-[10px] text-background/70">{status}</span></div>;
}

function QuickLink({ href, icon: Icon, title, text }: { href: string; icon: typeof Boxes; title: string; text: string }) {
  return <Link href={href} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted" data-testid={`link-quick-${title.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><Icon size={16} /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span></span><ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>;
}
