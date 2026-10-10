import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';
import { AuthPage } from '../../features/auth/pages/AuthPage';
import { ForbiddenPage } from '../../features/auth/pages/ForbiddenPage';
import { HomePage } from '../../features/catalog/pages/HomePage';
import { NotFoundPage } from './NotFoundPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
    </Route>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
