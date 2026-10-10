import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export const Select = ({ label, options, error, className, id, ...props }: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-label text-text-main">
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-md border bg-surface px-3 pr-10 text-body text-text-main transition-colors focus:outline-none focus:ring-2',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-border-hairline focus:border-primary focus:ring-primary/20',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 text-text-muted"
          aria-hidden="true"
        />
      </div>
      {error ? <span className="text-badge text-danger">{error}</span> : null}
    </div>
  );
};
