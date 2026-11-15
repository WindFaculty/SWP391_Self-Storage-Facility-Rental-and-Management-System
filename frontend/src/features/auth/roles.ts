import type { UserRole } from './types';

export interface AuthLocationState {
  from?: { pathname?: string; search?: string };
}

const WORKSPACE_PREFIXES = ['/facility/', '/staff/', '/operations/', '/admin/'];

export const getDefaultRouteForRole = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/security';
    case 'BUSINESS_MANAGER':
      return '/operations/facilities';
    case 'FACILITY_MANAGER':
      return '/facility/dashboard';
    case 'FACILITY_STAFF':
      return '/staff/operations';
    default:
      return '/';
  }
};

export const resolvePostAuthRoute = (role: UserRole, state: unknown): string => {
  const from = (state as AuthLocationState | null)?.from;
  const pathname = from?.pathname;
  if (!pathname || pathname === '/auth' || pathname === '/forbidden') {
    return getDefaultRouteForRole(role);
  }
  const isWorkspacePath = WORKSPACE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (role === 'CUSTOMER' && isWorkspacePath) {
    return getDefaultRouteForRole(role);
  }
  return `${pathname}${from?.search ?? ''}`;
};
