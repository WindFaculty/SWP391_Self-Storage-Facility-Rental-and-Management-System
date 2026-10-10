import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-forest-tint text-primary hover:bg-secondary-container',
  outline: 'bg-surface text-text-main border border-border-strong hover:bg-surface-muted',
  text: 'text-primary hover:bg-forest-tint',
  danger: 'bg-danger text-on-primary hover:opacity-90',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  compact?: boolean
}

export function Button({
  variant = 'primary',
  compact = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        compact ? 'h-9 px-space-md text-label-help' : 'h-11 px-space-lg text-body-medium'
      } ${VARIANT_CLASSES[variant]} ${className}`}
    />
  )
}
