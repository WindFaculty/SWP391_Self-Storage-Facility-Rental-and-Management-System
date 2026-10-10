import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-border-hairline bg-surface px-6 py-12 text-center">
    <p className="text-subsection text-text-main">{title}</p>
    {description ? <p className="max-w-md text-body text-text-muted">{description}</p> : null}
    {action}
  </div>
);
