import { cn } from '../../lib/cn';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} aria-hidden="true" />
);

export const SkeletonList = ({ count = 3, className }: { count?: number; className?: string }) => (
  <div role="status" className="flex flex-col gap-4">
    <span className="sr-only">Đang tải dữ liệu…</span>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} className={cn('h-36', className)} />
    ))}
  </div>
);
