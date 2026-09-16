import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const RoleGuard = ({ allowedRoles = [], children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingSpinner size="lg" text="Đang kiểm tra quyền hạn..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role) || user.role === 'ADMIN';

  if (!hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};
