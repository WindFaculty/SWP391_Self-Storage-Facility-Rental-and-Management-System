import type { UserRole } from './types';

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
