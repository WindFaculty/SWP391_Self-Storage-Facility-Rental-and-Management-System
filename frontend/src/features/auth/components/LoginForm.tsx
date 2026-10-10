import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getDefaultRouteForRole } from '../roles';
import { useAuth } from '../useAuth';

interface LocationState {
  from?: { pathname?: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError('Email không đúng định dạng.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const user = await login({ email, password });
      const from = (location.state as LocationState | null)?.from?.pathname;
      navigate(from ?? getDefaultRouteForRole(user.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-label text-danger">
          {error}
        </p>
      ) : null}

      <Input
        label="Email đăng nhập"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="name@domain.vn"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-label text-text-main">
          Mật khẩu
        </label>
        <div className="relative flex items-center">
          <input
            id="login-password"
            name="password"
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 w-full rounded-md border border-border-hairline bg-surface px-3 pr-11 text-body text-text-main transition-colors placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 flex cursor-pointer items-center text-text-muted transition-colors hover:text-text-main"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" isLoading={submitting} icon={ArrowRight} className="mt-1 w-full">
        Đăng nhập hệ thống
      </Button>
    </form>
  );
};
