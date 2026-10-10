import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { AppRoutes } from './routes/AppRoutes';

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);
