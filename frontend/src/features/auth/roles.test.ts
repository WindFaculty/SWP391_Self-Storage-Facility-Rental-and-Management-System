import { describe, expect, it } from 'vitest';
import { getDefaultRouteForRole, resolvePostAuthRoute } from './roles';

describe('auth role routing helpers', () => {
  it('returns expected default routes for each role', () => {
    expect(getDefaultRouteForRole('CUSTOMER')).toBe('/');
    expect(getDefaultRouteForRole('FACILITY_STAFF')).toBe('/staff/operations');
    expect(getDefaultRouteForRole('FACILITY_MANAGER')).toBe('/facility/dashboard');
    expect(getDefaultRouteForRole('BUSINESS_MANAGER')).toBe('/operations/facilities');
    expect(getDefaultRouteForRole('ADMIN')).toBe('/admin/dashboard');
  });

  it('preserves pathname and query string when redirecting back after login', () => {
    expect(
      resolvePostAuthRoute('CUSTOMER', {
        from: { pathname: '/reservation/new', search: '?facilityId=1&unitTypeId=2' },
      }),
    ).toBe('/reservation/new?facilityId=1&unitTypeId=2');
  });

  it('falls back to customer home if customer came from a workspace path or auth route', () => {
    expect(
      resolvePostAuthRoute('CUSTOMER', { from: { pathname: '/facility/dashboard' } }),
    ).toBe('/');
    expect(resolvePostAuthRoute('CUSTOMER', { from: { pathname: '/auth' } })).toBe('/');
    expect(resolvePostAuthRoute('ADMIN', { from: { pathname: '/forbidden' } })).toBe(
      '/admin/dashboard',
    );
  });
});
