import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label text-text-main">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-11 w-full rounded-md border bg-surface px-3 text-body text-text-main transition-colors placeholder:text-text-muted/60 focus:outline-none focus:ring-2',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-border-hairline focus:border-primary focus:ring-primary/20',
          className,
        )}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-badge text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
};
