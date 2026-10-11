import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getDefaultRouteForRole } from '../roles';
import { useAuth } from '../useAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const RegisterForm = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Email không đúng định dạng.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const user = await register({ fullName: fullName.trim(), phone: phone.trim(), email, password });
      navigate(getDefaultRouteForRole(user.role), { replace: true });
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Họ và tên"
          name="fullName"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Input
          label="Số điện thoại"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="0987 654 321"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </div>

      <Input
        label="Email liên hệ"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="name@company.vn"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="register-password" className="text-label text-text-main">
            Mật khẩu
          </label>
          <div className="relative flex items-center">
            <input
              id="register-password"
              name="password"
              autoComplete="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
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
        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-0.5 size-4 cursor-pointer accent-primary"
          required
        />
        <span className="text-table text-text-muted">
          Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật dữ liệu lưu trữ của Khoảng Thở.
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        isLoading={submitting}
        icon={CheckCircle2}
        className="mt-1 w-full"
      >
        Tạo tài khoản thuê kho
      </Button>
    </form>
  );
};
