import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const state = vi.hoisted(() => ({ user: null, isAuthenticated: false, isLoading: true }));
vi.mock('../useAuth', () => ({ useAuth: () => state }));
vi.mock('../components/LoginForm', () => ({ LoginForm: () => <button>Email login</button> }));
vi.mock('../components/RegisterForm', () => ({ RegisterForm: () => <button>Register</button> }));
vi.mock('../components/SocialLogin', () => ({ SocialLogin: () => <button>Continue with Google</button> }));
describe('AuthPage bootstrap guard', () => {
  beforeEach(() => { state.isLoading = true; });
  it('prevents login from racing an unfinished session bootstrap', () => {
    const view = render(<MemoryRouter><AuthPage /></MemoryRouter>);
    expect(screen.getByText('Đang xác minh phiên đăng nhập…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Email login' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
    state.isLoading = false;
    view.rerender(<MemoryRouter><AuthPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Email login' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});
