import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Check, CheckCircle2, Factory, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useCreateEquipment, useDeleteEquipment, useListEquipment, useUpdateEquipment } from '@workspace/api-client-react';
import type { EquipmentInput, EquipmentItem } from '@workspace/api-client-react';
import { fallbackEquipment } from '../lib/bakery-data';
import { toast } from '../hooks/use-toast';
import { ImageUploadField } from '../components/ImageUploadField';
import { ConfirmDialog } from '../components/ConfirmDialog';

type FormState = EquipmentInput;

const blankForm: FormState = { name: '', category: '', status: 'operational', nextService: '', imageUrl: '' };

function itemToForm(item: EquipmentItem): FormState {
  return {
    name: item.name,
    category: item.category,
    status: item.status,
    nextService: item.nextService === '—' ? '' : item.nextService,
    imageUrl: item.imageUrl ?? '',
  };
}

export function EquipmentPage() {
  const equipmentQuery = useListEquipment();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const equipment: EquipmentItem[] = equipmentQuery.data ?? fallbackEquipment;
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentItem | null>(null);

  const dueItems = equipment.filter((item) => item.status.toLowerCase().includes('due'));
  const readyItems = equipment.filter((item) => !item.status.toLowerCase().includes('due'));

  const requestService = (item: EquipmentItem) => {
    toast({ title: 'Service requested', description: `${item.name} was added to the studio's service queue.` });
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(blankForm);
    setShowForm(true);
  };

  const openEdit = (item: EquipmentItem) => {
    setEditingItem(item);
    setForm(itemToForm(item));
    setShowForm(true);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, nextService: form.nextService || undefined, imageUrl: form.imageUrl || undefined };
    if (editingItem) {
      updateEquipment.mutate({ id: editingItem.id, data: payload }, { onSuccess: () => equipmentQuery.refetch() });
    } else {
      createEquipment.mutate({ data: payload }, { onSuccess: () => equipmentQuery.refetch() });
    }
    setForm(blankForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const removeItem = (item: EquipmentItem) => {
    deleteEquipment.mutate({ id: item.id }, { onSuccess: () => equipmentQuery.refetch() });
  };

  const confirmRemove = () => {
    if (deleteTarget) removeItem(deleteTarget);
    setDeleteTarget(null);
  };

  const saving = createEquipment.isPending || updateEquipment.isPending || photoUploading;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><Factory size={17} /> Studio care</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Equipment</h1>
          <p className="mt-3 text-sm text-muted-foreground">A good bake starts with equipment you trust.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs text-primary"><CheckCircle2 size={14} /> {readyItems.length} operational</div>
          <button onClick={openAdd} className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="button-add-equipment"><Plus size={16} /> Add equipment</button>
        </div>
      </div>

      {dueItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl border border-accent bg-accent/10 p-6 sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground"><CalendarClock size={16} /> Needs scheduling</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dueItems.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }} className="rounded-2xl border border-accent/40 bg-card p-5" data-testid={`due-equipment-${item.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-medium text-lg">{item.name}</h3>
                  <EquipmentActions item={item} onEdit={openEdit} onDelete={setDeleteTarget} />
                </div>
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
              className="overflow-hidden rounded-2xl border border-border bg-card"
              data-testid={`card-equipment-${item.id}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-3" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <Wrench size={32} strokeWidth={1.4} className="text-primary" />
                  </div>
                )}
                <div className="absolute right-3 top-3">
                  <EquipmentActions item={item} onEdit={openEdit} onDelete={setDeleteTarget} />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h2 className="font-display font-medium text-xl">{item.name}</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-primary">{item.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground"><CalendarClock size={14} /> Next service</span>
                  <span>{item.nextService === '—' ? '—' : new Date(item.nextService).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-5 backdrop-blur-sm" role="dialog" onClick={() => setShowForm(false)}>
            <motion.form
              initial={{ opacity: 0, y: 14, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: .98 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={save}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg text-primary">{editingItem ? 'Update equipment' : 'New equipment'}</p>
                  <h2 className="mt-1 font-display font-medium text-2xl">{editingItem ? `Edit ${editingItem.name}` : 'Add to the studio'}</h2>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground" aria-label="Close form" data-testid="button-close-equipment-form"><X size={18} /></button>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Field label="Equipment name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} required />
                <Field label="Status" value={form.status ?? ''} onChange={(value) => setForm({ ...form, status: value })} />
                <label className="text-xs font-semibold">
                  Next service
                  <input
                    type="date"
                    value={form.nextService ?? ''}
                    onChange={(event) => setForm({ ...form, nextService: event.target.value })}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
                    data-testid="input-equipment-next-service"
                  />
                </label>
              </div>
              <div className="mt-5">
                <ImageUploadField label="Equipment photo (optional)" value={form.imageUrl ?? ''} onChange={(value) => setForm({ ...form, imageUrl: value })} onUploadingChange={setPhotoUploading} testId="input-equipment-photo" />
              </div>
              <button disabled={saving} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-equipment">
                {saving ? 'Saving…' : <><Check size={16} /> {editingItem ? 'Save changes' : 'Save equipment'}</>}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Remove ${deleteTarget?.name}?`}
        description="This takes it off the equipment list for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

function EquipmentActions({ item, onEdit, onDelete }: { item: EquipmentItem; onEdit: (item: EquipmentItem) => void; onDelete: (item: EquipmentItem) => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background" data-testid={`button-edit-equipment-${item.id}`}>
        <Pencil size={14} />
      </button>
      <button onClick={() => onDelete(item)} aria-label={`Remove ${item.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive hover:bg-background" data-testid={`button-delete-equipment-${item.id}`}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-xs font-semibold">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></label>;
}
