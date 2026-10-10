import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import { AuthPage } from '../../features/auth/pages/AuthPage';
import { ForbiddenPage } from '../../features/auth/pages/ForbiddenPage';
import { FacilityDetailPage } from '../../features/catalog/pages/FacilityDetailPage';
import { FacilityListPage } from '../../features/catalog/pages/FacilityListPage';
import { HomePage } from '../../features/catalog/pages/HomePage';
import { ReservationPage } from '../../features/reservation/pages/ReservationPage';
import { NotFoundPage } from './NotFoundPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/facilities" element={<FacilityListPage />} />
      <Route path="/facilities/:facilityId" element={<FacilityDetailPage />} />
      <Route path="/reservation/new" element={<ReservationPage />} />
    </Route>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
