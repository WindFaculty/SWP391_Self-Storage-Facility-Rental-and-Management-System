import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  compact?: boolean;
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-forest-tint text-forest-900 hover:brightness-95',
  outline: 'border border-border-strong bg-transparent text-text-main hover:bg-surface-muted',
  text: 'bg-transparent text-forest-700 hover:bg-forest-tint/60',
  danger: 'bg-danger text-white hover:brightness-95',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-label',
  md: 'h-11 gap-2 px-4 text-body-medium',
  lg: 'h-12 gap-2 px-5 text-body-medium',
};

export const Button = ({
  variant = 'primary',
  size,
  compact = false,
  isLoading = false,
  icon: Icon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size ?? (compact ? 'sm' : 'md')],
      className,
    )}
    {...props}
  >
    {isLoading ? (
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
    ) : Icon ? (
      <Icon className="size-4" />
    ) : null}
    {children}
  </button>
);
