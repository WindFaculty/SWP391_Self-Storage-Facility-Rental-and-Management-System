export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export interface Facility {
  id: string | number;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  status: FacilityStatus;
}

export interface UnitType {
  id: string | number;
  name: string;
  sizeM2: number;
  description: string | null;
  minMonthlyPrice: number;
  maxMonthlyPrice: number;
}

export interface FacilityUnitTypeAvailability {
  facilityId: string | number;
  unitTypeId: string | number;
  availableCount: number;
  totalCount: number;
}
