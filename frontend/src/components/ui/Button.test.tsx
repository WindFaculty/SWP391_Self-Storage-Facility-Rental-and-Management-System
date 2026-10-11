import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and handles click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Đặt kho</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Đặt kho' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks interaction while loading', () => {
    render(<Button isLoading>Đang gửi</Button>);

    expect(screen.getByRole('button', { name: 'Đang gửi' })).toBeDisabled();
  });

  it('respects the disabled prop', () => {
    render(<Button disabled>Không khả dụng</Button>);

    expect(screen.getByRole('button', { name: 'Không khả dụng' })).toBeDisabled();
  });
});
