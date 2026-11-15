import { lazy, Suspense } from 'react';
import { createRoutesFromElements, Route, useRoutes, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../components/guards/ProtectedRoute';
import { RequireRole } from '../../components/guards/RequireRole';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PublicLayout } from '../../layouts/PublicLayout';
import { WorkspaceLayout } from '../../layouts/WorkspaceLayout';
import { SessionProvider } from '../providers/SessionProvider';
import { HomePage } from '../../features/catalog/pages/HomePage';
import { AuthPage } from '../../features/auth/pages/AuthPage';
import { ForbiddenPage } from '../../features/auth/pages/ForbiddenPage';
import { NotFoundPage } from './NotFoundPage';

const BillingPage = lazy(() =>
  import('../../features/billing/pages/BillingPage').then((m) => ({ default: m.BillingPage })),
);
const PaymentResultPage = lazy(() =>
  import('../../features/billing/pages/PaymentResultPage').then((m) => ({
    default: m.PaymentResultPage,
  })),
);
const FacilityDetailPage = lazy(() =>
  import('../../features/catalog/pages/FacilityDetailPage').then((m) => ({
    default: m.FacilityDetailPage,
  })),
);
const FacilityListPage = lazy(() =>
  import('../../features/catalog/pages/FacilityListPage').then((m) => ({
    default: m.FacilityListPage,
  })),
);
const MyRentalsPage = lazy(() =>
  import('../../features/rental/pages/MyRentalsPage').then((m) => ({ default: m.MyRentalsPage })),
);
const ReservationPage = lazy(() =>
  import('../../features/reservation/pages/ReservationPage').then((m) => ({
    default: m.ReservationPage,
  })),
);
const SupportPage = lazy(() =>
  import('../../features/support/pages/SupportPage').then((m) => ({ default: m.SupportPage })),
);

const AdminSecurityPage = lazy(() =>
  import('../../features/admin/pages/AdminSecurityPage').then((m) => ({
    default: m.AdminSecurityPage,
  })),
);
const FacilityDashboardPage = lazy(() =>
  import('../../features/facility/pages/FacilityDashboardPage').then((m) => ({
    default: m.FacilityDashboardPage,
  })),
);
const FacilityRentalsPage = lazy(() =>
  import('../../features/facility/pages/FacilityRentalsPage').then((m) => ({
    default: m.FacilityRentalsPage,
  })),
);
const FacilityUnitsPage = lazy(() =>
  import('../../features/facility/pages/FacilityUnitsPage').then((m) => ({
    default: m.FacilityUnitsPage,
  })),
);
const OperationsFacilitiesPage = lazy(() =>
  import('../../features/management/pages/OperationsFacilitiesPage').then((m) => ({
    default: m.OperationsFacilitiesPage,
  })),
);
const OperationsPoliciesPage = lazy(() =>
  import('../../features/management/pages/OperationsPoliciesPage').then((m) => ({
    default: m.OperationsPoliciesPage,
  })),
);
const OperationsReportsPage = lazy(() =>
  import('../../features/management/pages/OperationsReportsPage').then((m) => ({
    default: m.OperationsReportsPage,
  })),
);
const StaffOperationsPage = lazy(() =>
  import('../../features/staff/pages/StaffOperationsPage').then((m) => ({
    default: m.StaffOperationsPage,
  })),
);

const customerRoutes = createRoutesFromElements(
  <>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/facilities" element={<FacilityListPage />} />
      <Route path="/facilities/:facilityId" element={<FacilityDetailPage />} />
      <Route
        path="/reservation/new"
        element={
          <ProtectedRoute>
            <ReservationPage />
          </ProtectedRoute>
        }
      />
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route
        path="/my-rentals"
        element={
          <ProtectedRoute>
            <MyRentalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        }
      />
    </Route>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </>,
);

const workspaceRoutes: RouteObject[] = [
  {
    path: '/facility/dashboard',
    element: (
      <RequireRole roles={['FACILITY_MANAGER']}>
        <FacilityDashboardPage />
      </RequireRole>
    ),
  },
  {
    path: '/facility/units',
    element: (
      <RequireRole roles={['FACILITY_MANAGER']}>
        <FacilityUnitsPage />
      </RequireRole>
    ),
  },
  {
    path: '/facility/rentals',
    element: (
      <RequireRole roles={['FACILITY_MANAGER']}>
        <FacilityRentalsPage />
      </RequireRole>
    ),
  },
  {
    path: '/staff/operations',
    element: (
      <RequireRole roles={['FACILITY_STAFF', 'FACILITY_MANAGER']}>
        <StaffOperationsPage />
      </RequireRole>
    ),
  },
  {
    path: '/operations/facilities',
    element: (
      <RequireRole roles={['BUSINESS_MANAGER', 'ADMIN']}>
        <OperationsFacilitiesPage />
      </RequireRole>
    ),
  },
  {
    path: '/operations/policies',
    element: (
      <RequireRole roles={['BUSINESS_MANAGER']}>
        <OperationsPoliciesPage />
      </RequireRole>
    ),
  },
  {
    path: '/operations/reports',
    element: (
      <RequireRole roles={['BUSINESS_MANAGER']}>
        <OperationsReportsPage />
      </RequireRole>
    ),
  },
  {
    path: '/admin/security',
    element: (
      <RequireRole roles={['ADMIN']}>
        <AdminSecurityPage />
      </RequireRole>
    ),
  },
];

const RouteFallback = (
  <div className="flex min-h-[40vh] items-center justify-center">
    <LoadingSpinner size="lg" text="Đang tải trang…" />
  </div>
);

export const AppRoutes = () => {
  const element = useRoutes([
    ...customerRoutes,
    {
      element: (
        <SessionProvider>
          <WorkspaceLayout />
        </SessionProvider>
      ),
      children: workspaceRoutes,
    },
  ]);

  return <Suspense fallback={RouteFallback}>{element}</Suspense>;
};
