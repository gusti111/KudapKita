import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel, busy = false, onCancel, onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#211813]/55 p-4 backdrop-blur-[2px]">
    <section role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-2xl">
      <div className="text-xs font-bold uppercase tracking-[.16em] text-terracotta">Konfirmasi tindakan</div>
      <h2 id="confirm-dialog-title" className="mt-2 font-serif text-2xl font-bold text-cocoa">{title}</h2>
      <p id="confirm-dialog-description" className="mt-3 text-sm leading-6 text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <PrimaryButton type="button" tone="secondary" disabled={busy} onClick={onCancel}>Batal</PrimaryButton>
        <PrimaryButton type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Memproses…' : confirmLabel}</PrimaryButton>
      </div>
    </section>
  </div>;
}
