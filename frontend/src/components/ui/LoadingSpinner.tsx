import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const SIZE_CLASSES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof SIZE_CLASSES;
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className }: LoadingSpinnerProps) => (
  <div
    role="status"
    className={cn('flex flex-col items-center justify-center gap-3 text-text-muted', className)}
  >
    <Loader2 className={cn('animate-spin', SIZE_CLASSES[size])} aria-hidden="true" />
    {text ? <span className="text-body">{text}</span> : <span className="sr-only">Đang tải…</span>}
  </div>
);
