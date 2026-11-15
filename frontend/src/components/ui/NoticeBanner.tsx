import { X } from 'lucide-react';

interface NoticeBannerProps {
  message: string | null;
  onDismiss: () => void;
  className?: string;
}

export const NoticeBanner = ({ message, onDismiss, className = 'mt-space-lg' }: NoticeBannerProps) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className={`${className} flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="cursor-pointer rounded p-0.5 hover:opacity-70"
      >
        <X className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
};
