import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-border-hairline bg-surface px-6 py-12 text-center">
    {icon ? (
      <span className="material-symbols-outlined text-4xl text-text-muted" aria-hidden="true">
        {icon}
      </span>
    ) : null}
    <h3 className="text-subsection text-text-main">{title}</h3>
    {description ? <p className="max-w-md text-body text-text-muted">{description}</p> : null}
    {action}
  </div>
);
