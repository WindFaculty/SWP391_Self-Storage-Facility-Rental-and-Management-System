import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialLogin } from './SocialLogin';
import { authApi } from '../api/authApi';
import { googleAuthorizationUrl } from '../../../api/client';

vi.mock('../useAuth', () => ({ useAuth: () => ({ socialLogin: vi.fn() }) }));
vi.mock('../api/authApi', () => ({ authApi: { googleConfig: vi.fn() } }));
describe('Google authorization entry', () => {
  beforeEach(() => vi.resetAllMocks());
  it('enables the Google button only when the backend has a configured OAuth client', async () => {
    vi.mocked(authApi.googleConfig).mockResolvedValue({ enabled: true });
    render(<SocialLogin />);
    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeEnabled();
    expect(googleAuthorizationUrl).toBe('/api/v1/oauth2/authorization/google');
    expect(document.querySelector('script[src*="accounts.google.com"]')).toBeNull();
  });
  it('keeps Google disabled when server credentials are absent', async () => {
    vi.mocked(authApi.googleConfig).mockResolvedValue({ enabled: false });
    render(<SocialLogin />);
    expect(await screen.findByRole('button', { name: 'Google (chưa cấu hình)' })).toBeDisabled();
  });
  it('shows a safe error when configuration cannot be loaded', async () => {
    vi.mocked(authApi.googleConfig).mockRejectedValue(new Error('sensitive server detail'));
    render(<SocialLogin />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải cấu hình đăng nhập Google.');
    expect(screen.queryByText('sensitive server detail')).toBeNull();
  });
});
