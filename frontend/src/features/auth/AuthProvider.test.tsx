import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { authApi } from './api/authApi';
import { apiClient } from '../../api/client';

vi.mock('./api/authApi', () => ({ authApi: {
  me: vi.fn(), cookieLogin: vi.fn(), cookieRegister: vi.fn(), logout: vi.fn(),
} }));
const customer = { id: 7, email: 'customer@example.com', fullName: 'Customer', role: 'CUSTOMER' as const };
function SessionProbe() {
  const auth = useAuth();
  return <><p>{auth.isLoading ? 'loading' : auth.isAuthenticated ? auth.user?.role : 'anonymous'}</p>
    <button onClick={() => void auth.login({ email: 'customer@example.com', password: 'password' })}>Login</button>
    <button onClick={auth.logout}>Logout</button></>;
}
describe('cookie authentication', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => apiClient.clearTokens());
  it('bootstraps the Google cookie session and authoritative role without JavaScript tokens', async () => {
    vi.mocked(authApi.me).mockResolvedValue(customer);
    render(<AuthProvider><SessionProbe /></AuthProvider>);
    await screen.findByText('CUSTOMER');
    expect(authApi.me).toHaveBeenCalledOnce();
    expect(apiClient.getToken()).toBeNull();
    expect(localStorage.getItem('storage_access_token')).toBeNull();
  });
  it('keeps email/password login and reads the server profile after receiving cookies', async () => {
    vi.mocked(authApi.me).mockRejectedValueOnce(new Error('anonymous')).mockResolvedValue(customer);
    vi.mocked(authApi.cookieLogin).mockResolvedValue({ user: customer });
    render(<AuthProvider><SessionProbe /></AuthProvider>);
    await screen.findByText('anonymous');
    fireEvent.click(screen.getByText('Login'));
    await screen.findByText('CUSTOMER');
    expect(authApi.cookieLogin).toHaveBeenCalledWith({ email: 'customer@example.com', password: 'password' });
    expect(authApi.me).toHaveBeenCalledTimes(2);
  });
  it('waits for server logout and clears the authenticated state', async () => {
    vi.mocked(authApi.me).mockResolvedValue(customer);
    vi.mocked(authApi.logout).mockResolvedValue({});
    render(<AuthProvider><SessionProbe /></AuthProvider>);
    await screen.findByText('CUSTOMER');
    fireEvent.click(screen.getByText('Logout'));
    await screen.findByText('anonymous');
    expect(authApi.logout).toHaveBeenCalledOnce();
  });
  it('responds to expired cookie sessions by clearing protected-route state', async () => {
    vi.mocked(authApi.me).mockResolvedValue(customer);
    render(<AuthProvider><SessionProbe /></AuthProvider>);
    await screen.findByText('CUSTOMER');
    window.dispatchEvent(new Event('auth:expired'));
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });
  it('never restores a cached elevated role when the server rejects a disabled profile', async () => {
    localStorage.setItem('storage_user', JSON.stringify({ ...customer, role: 'ADMIN' }));
    apiClient.setCookieSession(true);
    vi.mocked(authApi.me).mockRejectedValue({ status: 403, code: 'ACCOUNT_DISABLED' });
    render(<AuthProvider><SessionProbe /></AuthProvider>);
    await screen.findByText('anonymous');
    expect(screen.queryByText('ADMIN')).toBeNull();
    expect(apiClient.getToken()).toBeNull();
    localStorage.removeItem('storage_user');
  });
});
