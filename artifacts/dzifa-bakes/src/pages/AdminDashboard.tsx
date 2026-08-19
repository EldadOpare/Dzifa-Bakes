import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Factory, RefreshCw, WalletCards } from 'lucide-react';
import { Link } from 'wouter';
import { useGetBakerySummary } from '@workspace/api-client-react';
import type { BakerySummary } from '@workspace/api-client-react';
import { fallbackSummary, money } from '../lib/bakery-data';

export function AdminDashboard() {
  const summaryQuery = useGetBakerySummary();
  const summary: BakerySummary = summaryQuery.data ?? fallbackSummary;
  const maxRevenue = Math.max(...summary.weeklyRevenue.map((point) => point.value), 1);
  const isFallback = Boolean(summaryQuery.isError);
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div><div className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Studio pulse</div><h1 className="font-display text-5xl tracking-[-.05em] sm:text-6xl">Good morning, Dzifa.</h1><p className="mt-3 text-sm text-muted-foreground">Here’s the shape of the bakery today.</p></div>
        <div className="flex items-center gap-3"><span className={`font-mono-ui text-[10px] uppercase tracking-[.12em] ${isFallback ? 'text-accent-foreground' : 'text-primary'}`} data-testid="status-dashboard-data">{isFallback ? 'Local snapshot' : 'Live from studio'}</span><button className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted" onClick={() => summaryQuery.refetch()} aria-label="Refresh dashboard" data-testid="button-refresh-dashboard"><RefreshCw size={14} /></button></div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }} className="grid gap-px overflow-hidden border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Revenue this month" value={money(summary.revenue)} change="+12.4%" icon={WalletCards} accent /><Metric label="Open orders" value={String(summary.openOrders)} change="4 due today" icon={CalendarDays} /><Metric label="Low stock" value={String(summary.lowStockCount).padStart(2, '0')} change="Needs your eye" icon={CircleAlert} /><Metric label="Inventory value" value={money(summary.inventoryValue)} change="At cost" icon={Boxes} />
      </motion.div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <section className="border border-border bg-card p-6 sm:p-8" data-testid="section-revenue-chart"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">The week in numbers</p><h2 className="mt-2 font-display text-3xl">Revenue rhythm</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 font-mono-ui text-[10px] text-secondary-foreground">GHS · 7 days</span></div><div className="mt-10 flex h-56 items-end gap-2 sm:gap-4">{summary.weeklyRevenue.map((point) => <div key={point.day} className="group flex h-full flex-1 flex-col justify-end gap-3"><div className="relative flex flex-1 items-end"><motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(10, (point.value / maxRevenue) * 100)}%` }} transition={{ duration: .7, delay: .15 }} className="w-full rounded-t-sm bg-primary/85 transition-colors group-hover:bg-accent" title={`${money(point.value)}`} data-testid={`bar-revenue-${point.day}`} /></div><span className="font-mono-ui text-[10px] text-muted-foreground">{point.day}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">Peak service day</span><span className="font-mono-ui text-xs text-foreground" data-testid="text-peak-day">Saturday · {money(Math.max(...summary.weeklyRevenue.map((point) => point.value)))}</span></div></section>
        <section className="border border-border bg-primary p-6 text-primary-foreground sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary-foreground/60">Today at a glance</p><h2 className="mt-2 font-display text-3xl">Keep the care moving.</h2></div><CheckCircle2 size={20} strokeWidth={1.5} /></div><div className="mt-10 space-y-5"><PulseRow time="09:30" title="Mawuli · 2-tier celebration" note="Ready for finishing" status="In progress" /><PulseRow time="12:00" title="Ama · Lemon elderflower" note="Collection · Osu" status="Next up" /><PulseRow time="15:45" title="Kojo · Dark chocolate" note="Quote awaiting reply" status="Review" /></div><Link href="/admin/inventory" className="mt-9 flex items-center justify-between border-t border-primary-foreground/20 pt-4 text-sm" data-testid="link-open-operations">Open operations <ArrowUpRight size={16} /></Link></section>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/inventory" icon={Boxes} title="Inventory watch" text={`${summary.lowStockCount} items need a restock decision`} />
        <QuickLink href="/admin/equipment" icon={Factory} title="Equipment care" text="One service window needs scheduling" />
        <QuickLink href="/invoice" icon={CalendarDays} title="Customer view" text="Build a cake or review a quote" />
      </section>
    </main>
  );
}

function Metric({ label, value, change, icon: Icon, accent = false }: { label: string; value: string; change: string; icon: typeof WalletCards; accent?: boolean }) {
  return <div className="bg-card p-6 sm:p-7" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon size={17} strokeWidth={1.5} className={accent ? 'text-primary' : 'text-muted-foreground'} /></div><div className="mt-4 font-display text-3xl tracking-[-.04em]">{value}</div><div className="mt-2 font-mono-ui text-[10px] uppercase tracking-[.08em] text-muted-foreground">{change}</div></div>;
}

function PulseRow({ time, title, note, status }: { time: string; title: string; note: string; status: string }) {
  return <div className="grid grid-cols-[42px_1fr_auto] gap-3 border-b border-primary-foreground/15 pb-4"><span className="font-mono-ui text-[10px] text-primary-foreground/55">{time}</span><div><div className="text-sm">{title}</div><div className="mt-1 text-xs text-primary-foreground/60">{note}</div></div><span className="text-[10px] text-primary-foreground/70">{status}</span></div>;
}

function QuickLink({ href, icon: Icon, title, text }: { href: string; icon: typeof Boxes; title: string; text: string }) {
  return <Link href={href} className="group flex items-center justify-between border border-border bg-card p-5 transition-colors hover:bg-muted" data-testid={`link-quick-${title.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><Icon size={16} /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span></span><ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>;
}