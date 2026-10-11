import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders an accessible dialog with its content', () => {
    render(
      <Modal open title="Gia hạn thuê kho" onClose={vi.fn()}>
        Nội dung gia hạn
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Gia hạn thuê kho' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung gia hạn')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Xác nhận" onClose={onClose}>
        Nội dung
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Xác nhận" onClose={onClose}>
        Nội dung
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
