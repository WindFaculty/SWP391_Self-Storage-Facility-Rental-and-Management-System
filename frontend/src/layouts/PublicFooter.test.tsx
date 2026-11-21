// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicFooter } from './PublicFooter';

describe('PublicFooter', () => {
  it('renders project name, FPT logo, FPT University HCMC address, email, and GitHub link without phone or copyright bar', () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>,
    );

    const logo = screen.getByRole('img', { name: 'Logo Trường Đại học FPT' });
    expect(logo).toBeInTheDocument();
    expect(logo.getAttribute('src')).toBeTruthy();

    expect(screen.getByText('Kho Việt')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống cho thuê và quản lý kho tự lưu trữ')).toBeInTheDocument();
    expect(
      screen.getByText('Self-Storage Facility Rental & Management System'),
    ).toBeInTheDocument();

    expect(screen.getByText('Trường Đại học FPT TP. Hồ Chí Minh')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Lô E2a-7, Đường D1, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'tranxuankhoa777@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:tranxuankhoa777@gmail.com',
    );
    expect(
      screen.getByRole('link', {
        name: 'WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System',
      }),
    ).toHaveAttribute(
      'href',
      'https://github.com/WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System',
    );

    expect(screen.queryByText(/7300 5588/)).not.toBeInTheDocument();
    expect(screen.queryByText(/© 2026 Kho Việt/)).not.toBeInTheDocument();
  });
});
