import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getDefaultRouteForRole } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleGuard } from './components/guards/RoleGuard';

import { CustomerLayout } from './components/layouts/CustomerLayout';
import { InternalLayout } from './components/layouts/InternalLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { FacilityDashboard } from './pages/facility/FacilityDashboard';
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ForbiddenPage } from './pages/common/ForbiddenPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const RootRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingSpinner size="lg" text="Đang khởi tạo hệ thống..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const target = getDefaultRouteForRole(user.roles);
    return <Navigate to={target} replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Customer Portal (Role: CUSTOMER) */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['CUSTOMER']}>
                  <CustomerLayout>
                    <CustomerDashboard />
                  </CustomerLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Internal Portals */}
          {/* 1. Facility Staff Portal */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['FACILITY_STAFF']}>
                  <InternalLayout title="Cổng Nhân Viên Vận Hành (Staff)">
                    <StaffDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* 2. Facility Manager Portal */}
          <Route
            path="/facility-manager"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['FACILITY_MANAGER']}>
                  <InternalLayout title="Cổng Quản Lý Cơ Sở Kho (Facility Manager)">
                    <FacilityDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* 3. Business Operations Manager Portal */}
          <Route
            path="/business-manager"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['BUSINESS_OPERATIONS_MANAGER']}>
                  <InternalLayout title="Cổng Quản Lý Kinh Doanh & Doanh Thu (Biz Operations)">
                    <BusinessDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* 4. System Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
                  <InternalLayout title="Cổng Quản Trị Hệ Thống (System Admin)">
                    <AdminDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
