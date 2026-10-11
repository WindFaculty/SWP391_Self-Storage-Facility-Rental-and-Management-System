import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Không tải được dữ liệu',
  description,
  onRetry,
}: ErrorStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-danger-bg bg-danger-bg/40 px-6 py-10 text-center">
    <p className="text-subsection text-danger">{title}</p>
    {description ? <p className="max-w-md text-body text-text-muted">{description}</p> : null}
    {onRetry ? (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
    ) : null}
  </div>
);
