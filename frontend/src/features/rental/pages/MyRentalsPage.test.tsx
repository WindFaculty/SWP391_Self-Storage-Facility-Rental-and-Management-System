import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyRentalsPage } from './MyRentalsPage';

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
});

const stubApi = (routes: Record<string, unknown>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: unknown) => {
      const url = String(input);
      const key = Object.keys(routes).find((route) => url.includes(route));
      return Promise.resolve(jsonResponse({ data: key ? routes[key] : [] }));
    }),
  );
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyRentalsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const pendingRental = {
  id: 'r1',
  status: 'PENDING_PAYMENT',
  facilityId: 'f1',
  facilityName: 'Cơ sở Cầu Giấy',
  unitTypeId: 't1',
  unitTypeName: 'Kho Tiêu Chuẩn',
  startDate: '2026-11-01',
  endDate: '2026-12-01',
  monthlyPrice: 1250000,
  invoiceId: 'inv1',
  holdExpiresAt: '2026-10-10T10:00:00Z',
};

describe('MyRentalsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the empty state when there are no pending rentals', async () => {
    stubApi({});
    renderPage();

    expect(
      await screen.findByText('Bạn không có đơn giữ chỗ nào đang chờ thanh toán.'),
    ).toBeInTheDocument();
  });

  it('shows payment and expiry for a pending rental', async () => {
    stubApi({ '/rentals/me': [pendingRental] });
    renderPage();

    expect(await screen.findByText('Cơ sở Cầu Giấy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy giữ chỗ' })).toBeInTheDocument();
    expect(screen.getByText(/Hết hạn giữ chỗ lúc/)).toBeInTheDocument();
  });
});
