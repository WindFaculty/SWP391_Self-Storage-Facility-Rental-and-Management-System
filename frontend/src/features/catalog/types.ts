import type { WarehouseImage } from '../../components/media/images';

export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export interface Facility {
  id: string | number;
  code?: string;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  imageUrl?: string | null;
  images?: WarehouseImage[];
  status: FacilityStatus;
}

export interface UnitType {
  id: string | number;
  name: string;
  sizeM2: number;
  description: string | null;
  imageUrl?: string | null;
  minMonthlyPrice: number;
  maxMonthlyPrice: number;
}

export interface FacilityUnitTypeAvailability {
  facilityId: string | number;
  unitTypeId: string | number;
  availableCount: number;
  totalCount: number;
}
