import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Factory, Wrench } from 'lucide-react';
import { useListEquipment } from '@workspace/api-client-react';
import type { EquipmentItem } from '@workspace/api-client-react';
import { fallbackEquipment } from '../lib/bakery-data';
import { toast } from '../hooks/use-toast';

export function EquipmentPage() {
  const equipmentQuery = useListEquipment();
  const equipment: EquipmentItem[] = equipmentQuery.data ?? fallbackEquipment;
  const dueItems = equipment.filter((item) => item.status.toLowerCase().includes('due'));
  const readyItems = equipment.filter((item) => !item.status.toLowerCase().includes('due'));

  const requestService = (item: EquipmentItem) => {
    toast({ title: 'Service requested', description: `${item.name} was added to the studio's service queue.` });
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><Factory size={17} /> Studio care</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Equipment</h1>
          <p className="mt-3 text-sm text-muted-foreground">A good bake starts with equipment you trust.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs text-primary"><CheckCircle2 size={14} /> {readyItems.length} operational</div>
      </div>

      {dueItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl border border-accent bg-accent/10 p-6 sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground"><CalendarClock size={16} /> Needs scheduling</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dueItems.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }} className="rounded-2xl border border-accent/40 bg-card p-5" data-testid={`due-equipment-${item.id}`}>
                <h3 className="font-display font-medium text-lg">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Next service</span>
                  <span className="font-semibold text-accent-foreground">{new Date(item.nextService).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <button onClick={() => requestService(item)} className="mt-4 w-full rounded-md border border-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/10" data-testid={`button-schedule-service-${item.id}`}>Schedule service</button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-8">
        {dueItems.length > 0 && <p className="mb-4 text-sm text-muted-foreground">Operational</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {readyItems.map((item, index) => (
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              whileHover={{ y: -3 }}
              transition={{ duration: .45, delay: index * .06 }}
              key={item.id}
              className="rounded-2xl border border-border bg-card p-6"
              data-testid={`card-equipment-${item.id}`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary"><Wrench size={18} strokeWidth={1.6} /></span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-primary">{item.status}</span>
              </div>
              <h2 className="mt-7 font-display font-medium text-xl">{item.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><CalendarClock size={14} /> Next service</span>
                <span>{new Date(item.nextService).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
