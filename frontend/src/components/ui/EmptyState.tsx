import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'inventory_2', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-space-4xl px-space-lg">
      <span className="material-symbols-outlined text-[40px] text-text-muted" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-space-md text-subsection text-text-main">{title}</h3>
      {description && <p className="mt-space-xs text-body-default text-text-muted max-w-[420px]">{description}</p>}
      {action && <div className="mt-space-lg">{action}</div>}
    </div>
  )
}
