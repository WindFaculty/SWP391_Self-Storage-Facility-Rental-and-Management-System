import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export const Drawer = ({ open = true, title, onClose, children, footer }: DrawerProps) => {
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-text-main/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-hidden border-l border-border-hairline bg-surface shadow-popover"
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
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border-hairline px-5 py-4">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
};
