import type { ReactNode } from 'react';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  History,
  Lock,
  Search,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  lock: Lock,
  person_search: Search,
  history: History,
  bar_chart: BarChart3,
  event_available: CalendarCheck,
  task_alt: CheckCircle2,
  domain_disabled: Building2,
};

interface EmptyStateProps {
  icon?: string | LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  const IconComponent = typeof icon === 'string' ? ICON_MAP[icon] : icon;

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-border-hairline bg-surface px-6 py-12 text-center">
      {IconComponent ? (
        <IconComponent className="size-9 text-text-muted" aria-hidden="true" />
      ) : null}
      <h3 className="text-subsection text-text-main">{title}</h3>
      {description ? <p className="max-w-md text-body text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
};
