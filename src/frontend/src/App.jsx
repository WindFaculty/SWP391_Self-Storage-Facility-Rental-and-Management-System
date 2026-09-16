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
import { FacilityListPage } from './pages/customer/FacilityListPage';
import { FacilityDetailPage } from './pages/customer/FacilityDetailPage';
import { UnitTypeListPage } from './pages/customer/UnitTypeListPage';
import { UnitTypeDetailPage } from './pages/customer/UnitTypeDetailPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { FacilityDashboard } from './pages/facility/FacilityDashboard';
import { FacilityManagementPage } from './pages/facility/FacilityManagementPage';
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
    const target = getDefaultRouteForRole(user.role);
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
          <Route path="/facilities" element={<FacilityListPage />} />
          <Route path="/facilities/:id" element={<FacilityDetailPage />} />
          <Route path="/unit-types" element={<UnitTypeListPage />} />
          <Route path="/unit-types/:id" element={<UnitTypeDetailPage />} />

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
            path="/manager/dashboard"
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
          <Route
            path="/facility-manager/facilities"
            element={
              <ProtectedRoute><RoleGuard allowedRoles={['FACILITY_MANAGER']}><InternalLayout title="Quản lý cơ sở, kho và nhân sự"><FacilityManagementPage /></InternalLayout></RoleGuard></ProtectedRoute>
            }
          />

          {/* 3. Business Operations Manager Portal */}
          <Route
            path="/business/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['BUSINESS_MANAGER']}>
                  <InternalLayout title="Cổng Quản Lý Kinh Doanh & Doanh Thu (Biz Operations)">
                    <BusinessDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/business/facilities"
            element={
              <ProtectedRoute><RoleGuard allowedRoles={['BUSINESS_MANAGER']}><InternalLayout title="Thiết lập cơ sở kho"><FacilityManagementPage /></InternalLayout></RoleGuard></ProtectedRoute>
            }
          />

          {/* 4. System Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN']}>
                  <InternalLayout title="Cổng Quản Trị Hệ Thống (System Admin)">
                    <AdminDashboard />
                  </InternalLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/facilities"
            element={
              <ProtectedRoute><RoleGuard allowedRoles={['ADMIN']}><InternalLayout title="Quản trị cơ sở kho"><FacilityManagementPage /></InternalLayout></RoleGuard></ProtectedRoute>
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
