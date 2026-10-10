import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';

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
        <BillingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const pendingInvoice = {
  id: 'inv12345678',
  rentalId: 'r1',
  type: 'RENT',
  status: 'PENDING',
  totalAmount: 3750000,
  rentAmount: 1250000,
  depositAmount: 2500000,
  dueAt: '2026-10-11T10:00:00Z',
};

const activeRental = {
  id: 'r1',
  status: 'ACTIVE',
  facilityId: 'f1',
  facilityName: 'Cơ sở Cầu Giấy',
  unitTypeId: 't1',
  startDate: '2026-11-01',
  endDate: '2026-12-01',
  monthlyPrice: 1250000,
};

describe('BillingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the empty state when there are no invoices', async () => {
    stubApi({});
    renderPage();

    expect(
      await screen.findByText('Bạn không có hóa đơn nào cần thanh toán.'),
    ).toBeInTheDocument();
  });

  it('lists a pending invoice with rental context and payment action', async () => {
    stubApi({ '/invoices/me': [pendingInvoice], '/rentals/me': [activeRental] });
    renderPage();

    expect(await screen.findByText('Tiền thuê')).toBeInTheDocument();
    expect(screen.getByText(/Cơ sở Cầu Giấy/)).toBeInTheDocument();
    expect(screen.getByText(/Tổng cần thanh toán/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeInTheDocument();
  });
});
