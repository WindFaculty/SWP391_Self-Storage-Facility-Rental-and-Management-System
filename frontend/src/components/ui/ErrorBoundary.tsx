import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // React captures the error in state and shows the fallback UI.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <h1 className="text-page-title text-text-main">Đã xảy ra lỗi hiển thị</h1>
          <p className="max-w-md text-body text-text-muted">
            Ứng dụng gặp sự cố ngoài ý muốn. Vui lòng tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.assign('/');
              }}
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
