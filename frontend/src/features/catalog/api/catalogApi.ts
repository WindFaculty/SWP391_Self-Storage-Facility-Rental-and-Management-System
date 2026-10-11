import { apiClient, type ApiResponse } from '../../../api/client';
import type { Facility, FacilityUnitTypeAvailability, UnitType } from '../types';

export interface AvailabilityQuery {
  startDate: string;
  endDate: string;
  facilityId?: string;
}

export const catalogApi = {
  listFacilities: (): Promise<Facility[]> =>
    apiClient.get<ApiResponse<Facility[]>>('/facilities').then((res) => res.data),

  getFacility: (facilityId: string): Promise<Facility> =>
    apiClient.get<ApiResponse<Facility>>(`/facilities/${facilityId}`).then((res) => res.data),

  listUnitTypes: (): Promise<UnitType[]> =>
    apiClient.get<ApiResponse<UnitType[]>>('/unit-types').then((res) => res.data),

  listFacilityUnitTypes: (facilityId: string): Promise<UnitType[]> =>
    apiClient
      .get<ApiResponse<UnitType[]>>(`/facilities/${facilityId}/unit-types`)
      .then((res) => res.data),

  getAvailability: ({
    startDate,
    endDate,
    facilityId,
  }: AvailabilityQuery): Promise<FacilityUnitTypeAvailability[]> => {
    const search = new URLSearchParams({ startDate, endDate });
    if (facilityId) search.set('facilityId', facilityId);
    return apiClient
      .get<ApiResponse<FacilityUnitTypeAvailability[]>>(`/availability?${search.toString()}`)
      .then((res) => res.data);
  },
};
