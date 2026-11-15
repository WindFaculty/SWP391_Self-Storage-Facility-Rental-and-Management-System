// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ThemeProvider } from './ThemeProvider';
import { THEME_STORAGE_KEY } from './theme-context';

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    addListener: () => {},
    removeListener: () => {},
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => mediaQuery),
  });

  return {
    setMatches(next: boolean) {
      matches = next;
      const event = { matches: next } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('ThemeProvider & ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to dark when system prefers dark and no preference is stored', () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const toggle = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('restores stored light preference even when system prefers dark', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    const toggle = screen.getByRole('button', { name: 'Chuyển sang giao diện tối' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles theme on click and persists the choice in localStorage', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>,
    );

    const toDarkBtn = screen.getByRole('button', { name: 'Chuyển sang giao diện tối' });
    fireEvent.click(toDarkBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    const toLightBtn = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' });
    fireEvent.click(toLightBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('reacts to system color-scheme changes while in system mode', () => {
    const media = mockMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      media.setMatches(true);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
