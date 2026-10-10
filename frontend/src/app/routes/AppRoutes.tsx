import { createRoutesFromElements, Route, useRoutes, type NonIndexRouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../components/guards/ProtectedRoute';
import { PublicLayout } from '../../layouts/PublicLayout';
import { WorkspaceLayout } from '../../layouts/WorkspaceLayout';
import { SessionProvider } from '../providers/SessionProvider';
import { AuthPage } from '../../features/auth/pages/AuthPage';
import { ForbiddenPage } from '../../features/auth/pages/ForbiddenPage';
import { BillingPage } from '../../features/billing/pages/BillingPage';
import { PaymentResultPage } from '../../features/billing/pages/PaymentResultPage';
import { FacilityDetailPage } from '../../features/catalog/pages/FacilityDetailPage';
import { FacilityListPage } from '../../features/catalog/pages/FacilityListPage';
import { HomePage } from '../../features/catalog/pages/HomePage';
import { MyRentalsPage } from '../../features/rental/pages/MyRentalsPage';
import { ReservationPage } from '../../features/reservation/pages/ReservationPage';
import { SupportPage } from '../../features/support/pages/SupportPage';
import { appRoutes } from './router';
import { NotFoundPage } from './NotFoundPage';

const customerRoutes = createRoutesFromElements(
  <>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/facilities" element={<FacilityListPage />} />
      <Route path="/facilities/:facilityId" element={<FacilityDetailPage />} />
      <Route path="/reservation/new" element={<ReservationPage />} />
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

const workspaceRoot = appRoutes[0] as NonIndexRouteObject;

const workspaceRoutes = (workspaceRoot.children ?? [])
  .filter(
    (child): child is NonIndexRouteObject =>
      child.index !== true && child.path !== undefined && child.path !== '*',
  )
  .map((child) => ({ ...child, path: `/${child.path}` }));

export const AppRoutes = () =>
  useRoutes([
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
