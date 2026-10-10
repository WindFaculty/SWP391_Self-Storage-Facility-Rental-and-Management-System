import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[560px] bg-surface rounded-xl shadow-xl border border-border-hairline focus:outline-none"
      >
        <div className="flex items-center justify-between px-space-xl py-space-lg border-b border-border-hairline">
          <h2 className="text-subsection text-text-main">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-space-xl py-space-lg">{children}</div>
        {footer && (
          <div className="px-space-xl py-space-lg border-t border-border-hairline flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
