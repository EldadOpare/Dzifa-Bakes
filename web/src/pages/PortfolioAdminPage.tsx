import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useCreatePortfolioItem, useDeletePortfolioItem, useListPortfolio, useUpdatePortfolioItem } from '@workspace/api-client-react';
import type { NewPortfolioItem, PortfolioItem } from '@workspace/api-client-react';
import { ImageUploadField } from '../components/ImageUploadField';
import { ConfirmDialog } from '../components/ConfirmDialog';

type FormState = NewPortfolioItem;

const blankForm: FormState = { title: '', caption: '', imageUrl: '' };

function itemToForm(item: PortfolioItem): FormState {
  return { title: item.title, caption: item.caption ?? '', imageUrl: item.imageUrl };
}

export function PortfolioAdminPage() {
  const portfolioQuery = useListPortfolio();
  const createItem = useCreatePortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const items: PortfolioItem[] = portfolioQuery.data ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);

  const openAdd = () => {
    setEditingItem(null);
    setForm(blankForm);
    setShowForm(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setForm(itemToForm(item));
    setShowForm(true);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, caption: form.caption || undefined };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, data: payload }, { onSuccess: () => portfolioQuery.refetch() });
    } else {
      createItem.mutate({ data: payload }, { onSuccess: () => portfolioQuery.refetch() });
    }
    setForm(blankForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const confirmRemove = () => {
    if (deleteTarget) deleteItem.mutate({ id: deleteTarget.id }, { onSuccess: () => portfolioQuery.refetch() });
    setDeleteTarget(null);
  };

  const saving = createItem.isPending || updateItem.isPending || photoUploading;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-primary"><Camera size={17} /> Studio work</p>
          <h1 className="mt-2 font-display font-medium text-4xl tracking-[-.03em]">Portfolio</h1>
          <p className="mt-3 text-sm text-muted-foreground">What goes here shows up on the public portfolio page.</p>
        </div>
        <button onClick={openAdd} className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" data-testid="button-add-portfolio"><Plus size={16} /> Add work</button>
      </div>

      {items.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-border bg-card p-14 text-center">
          <p className="font-display text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Add a finished cake and it'll show up on the public portfolio page right away.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .4, delay: index * .04 }}
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
              data-testid={`card-portfolio-${item.id}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background" data-testid={`button-edit-portfolio-${item.id}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} aria-label={`Remove ${item.title}`} className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive hover:bg-background" data-testid={`button-delete-portfolio-${item.id}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.caption && <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
                  <p className="font-display text-lg text-primary">{editingItem ? 'Update work' : 'New work'}</p>
                  <h2 className="mt-1 font-display font-medium text-2xl">{editingItem ? `Edit ${editingItem.title}` : 'Add to the portfolio'}</h2>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground" aria-label="Close form" data-testid="button-close-portfolio-form"><X size={18} /></button>
              </div>
              <div className="mt-7 space-y-4">
                <ImageUploadField label="Photo" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} onUploadingChange={setPhotoUploading} testId="input-portfolio-photo" />
                <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
                <label className="block text-xs font-semibold">
                  Caption (optional)
                  <textarea
                    value={form.caption ?? ''}
                    onChange={(event) => setForm({ ...form, caption: event.target.value })}
                    rows={2}
                    className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary"
                    data-testid="input-portfolio-caption"
                  />
                </label>
              </div>
              <button disabled={saving || !form.imageUrl} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-portfolio">
                {saving ? 'Saving…' : <><Check size={16} /> {editingItem ? 'Save changes' : 'Add to portfolio'}</>}
              </button>
              {!form.imageUrl && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ImageIcon size={12} /> A photo is required</p>}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget != null}
        title={`Remove "${deleteTarget?.title}"?`}
        description="This takes it off the public portfolio page for good."
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-xs font-semibold">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary" data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></label>;
}
