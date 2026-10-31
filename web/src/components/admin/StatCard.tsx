import type { IconType } from 'react-icons';

type StatCardProps = { label: string; value: string | number; icon: IconType; note?: string; tone?: 'default' | 'warning'; delay?: number };

export function StatCard({ label, value, icon: Icon, note, tone = 'default', delay = 0 }: StatCardProps) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[.1em] text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-[17px] w-[17px]" />
        </span>
      </div>
      <p className="text-2xl font-medium tracking-tight">{value}</p>
      {note && <p className="mt-1.5 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
