import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../app/providers/useTheme';
import { cn } from '../../lib/cn';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle = ({ className, showLabel = false }: ThemeToggleProps) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={cn(
        'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-hairline bg-surface px-2.5 text-label text-text-main transition-colors hover:bg-surface-muted',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-primary" aria-hidden="true" />
      ) : (
        <Moon className="size-4 text-text-muted" aria-hidden="true" />
      )}
      {showLabel ? (
        <span className="hidden sm:inline">{isDark ? 'Sáng' : 'Tối'}</span>
      ) : null}
    </button>
  );
};
