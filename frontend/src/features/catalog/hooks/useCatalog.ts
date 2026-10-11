import { useQuery } from '@tanstack/react-query';
import { catalogApi, type AvailabilityQuery } from '../api/catalogApi';

export const useFacilities = () =>
  useQuery({
    queryKey: ['catalog', 'facilities'],
    queryFn: catalogApi.listFacilities,
  });

export const useUnitTypes = () =>
  useQuery({
    queryKey: ['catalog', 'unit-types'],
    queryFn: catalogApi.listUnitTypes,
  });

export const useFacility = (facilityId: string) =>
  useQuery({
    queryKey: ['catalog', 'facility', facilityId],
    queryFn: () => catalogApi.getFacility(facilityId),
    enabled: Boolean(facilityId),
  });

export const useFacilityUnitTypes = (facilityId: string) =>
  useQuery({
    queryKey: ['catalog', 'facility-unit-types', facilityId],
    queryFn: () => catalogApi.listFacilityUnitTypes(facilityId),
    enabled: Boolean(facilityId),
  });

export const useAvailability = (query: AvailabilityQuery | null) =>
  useQuery({
    queryKey: [
      'catalog',
      'availability',
      query?.facilityId ?? 'all',
      query?.startDate ?? '',
      query?.endDate ?? '',
    ],
    queryFn: () => catalogApi.getAvailability(query as AvailabilityQuery),
    enabled: query !== null,
  });
