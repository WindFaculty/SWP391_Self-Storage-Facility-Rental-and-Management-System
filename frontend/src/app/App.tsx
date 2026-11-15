import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { AuthProvider } from '../features/auth/AuthProvider';
import { AppRoutes } from './routes/AppRoutes';
import { queryClient } from './queryClient';
import { ThemeProvider } from './providers/ThemeProvider';

export const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);
