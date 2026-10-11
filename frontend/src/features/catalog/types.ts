export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export interface Facility {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  status: FacilityStatus;
}

export interface UnitType {
  id: string;
  name: string;
  sizeM2: number;
  description: string | null;
  minMonthlyPrice: number;
  maxMonthlyPrice: number;
}

export interface FacilityUnitTypeAvailability {
  facilityId: string;
  unitTypeId: string;
  availableCount: number;
  totalCount: number;
}
