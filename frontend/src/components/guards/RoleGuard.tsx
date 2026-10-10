import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/useAuth';
import type { UserRole } from '../../features/auth/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Đang kiểm tra quyền hạn…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'ADMIN' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};
