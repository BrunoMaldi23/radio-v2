'use client';

import { toast } from 'sonner';

type ConfirmToastOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function confirmToast({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
}: ConfirmToastOptions) {
  const id = toast.custom(
    () => (
      <div className="app-confirm-toast">
        <div className="app-confirm-toast-copy">
          <strong>{title}</strong>
          {description && <span>{description}</span>}
        </div>
        <div className="app-confirm-toast-actions">
          <button
            className="app-confirm-toast-primary"
            onClick={() => {
              toast.dismiss(id);
              void onConfirm();
            }}
            type="button"
          >
            {confirmLabel}
          </button>
          <button className="app-confirm-toast-secondary" onClick={() => toast.dismiss(id)} type="button">
            {cancelLabel}
          </button>
        </div>
      </div>
    ),
    { duration: 8000 }
  );
}
