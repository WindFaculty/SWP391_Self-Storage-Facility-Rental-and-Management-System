import { cn } from '../../lib/cn';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-neutral-bg text-neutral-strong',
};

interface StatusLabelProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export const StatusLabel = ({ label, tone = 'neutral', className }: StatusLabelProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-badge',
      TONE_CLASSES[tone],
      className,
    )}
  >
    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
    {label}
  </span>
);
