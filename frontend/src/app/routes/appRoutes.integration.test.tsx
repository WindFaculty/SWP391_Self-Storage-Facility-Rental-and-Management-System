// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { AppRoutes } from './AppRoutes';

const renderAt = (path: string) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );

describe('merged app routes', () => {
  it('serves the customer homepage at /', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: /Thêm chỗ cho cuộc sống/ })).toBeTruthy();
  });

  it('requires login before opening the facility workspace', async () => {
    renderAt('/facility/dashboard');
    expect(await screen.findByRole('heading', { name: /Chào mừng bạn quay lại/ })).toBeTruthy();
  });
});
