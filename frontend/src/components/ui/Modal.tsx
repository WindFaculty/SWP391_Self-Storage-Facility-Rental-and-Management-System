import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = ({ open, title, onClose, children, footer }: ModalProps) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text-main/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border-hairline bg-surface shadow-popover"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-hairline px-5 py-4">
          <h2 id={titleId} className="text-subsection text-text-main">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-main"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border-hairline px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
