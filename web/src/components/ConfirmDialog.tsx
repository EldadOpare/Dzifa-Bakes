import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/20 p-5 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: .98 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
            data-testid="dialog-confirm"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert size={18} />
            </div>
            <h2 className="mt-4 font-display font-medium text-xl">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                data-testid="button-confirm-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
