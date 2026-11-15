import type { SyntheticEvent } from 'react';
import warehouseIllustration from '../../../assets/warehouse-illustration.webp';

export const FALLBACK_WAREHOUSE_IMAGE = warehouseIllustration;

const FACILITY_IMAGE_BY_CODE: Record<string, string> = {
  'FAC-SGN-02': '/images/facilities/hcm-binh-thanh.jpg',
  'FAC-HAN-01': '/images/facilities/hn-cau-giay.jpg',
  'FAC-DAD-01': '/images/facilities/dn-hai-chau.jpg',
  'DEMO-HCM-01': '/images/facilities/hcm-go-vap.jpg',
};

export function resolveFacilityImage(facility: {
  code?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  images?: { url: string }[];
}): string {
  const explicit = facility.imageUrl?.trim();
  if (explicit) {
    return explicit;
  }
  if (facility.images !== undefined) return facility.images[0]?.url ?? FALLBACK_WAREHOUSE_IMAGE;

  const normalizedCode = facility.code?.trim().toUpperCase();
  if (normalizedCode && FACILITY_IMAGE_BY_CODE[normalizedCode]) {
    return FACILITY_IMAGE_BY_CODE[normalizedCode];
  }

  const normalizedName = facility.name?.trim().toLowerCase() ?? '';
  if (normalizedName.includes('bình thạnh')) {
    return '/images/facilities/hcm-binh-thanh.jpg';
  }
  if (normalizedName.includes('cầu giấy')) {
    return '/images/facilities/hn-cau-giay.jpg';
  }
  if (normalizedName.includes('hải châu')) {
    return '/images/facilities/dn-hai-chau.jpg';
  }
  if (normalizedName.includes('gò vấp') || normalizedName.includes('go vap') || normalizedName.includes('demo facility')) {
    return '/images/facilities/hcm-go-vap.jpg';
  }

  return FALLBACK_WAREHOUSE_IMAGE;
}

export function resolveUnitTypeImage(unitType: {
  name?: string | null;
  sizeM2?: number | null;
  imageUrl?: string | null;
}): string {
  const explicit = unitType.imageUrl?.trim();
  if (explicit) {
    return explicit;
  }

  if (typeof unitType.sizeM2 === 'number' && Number.isFinite(unitType.sizeM2)) {
    if (unitType.sizeM2 <= 6) {
      return '/images/unit-types/small.jpg';
    }
    if (unitType.sizeM2 <= 15) {
      return '/images/unit-types/medium.jpg';
    }
    return '/images/unit-types/large.jpg';
  }

  const normalizedName = unitType.name?.trim().toLowerCase() ?? '';
  if (normalizedName.includes('small') || normalizedName.includes('nhỏ')) {
    return '/images/unit-types/small.jpg';
  }
  if (normalizedName.includes('medium') || normalizedName.includes('vừa')) {
    return '/images/unit-types/medium.jpg';
  }
  if (normalizedName.includes('large') || normalizedName.includes('lớn')) {
    return '/images/unit-types/large.jpg';
  }

  return FALLBACK_WAREHOUSE_IMAGE;
}

export function handleWarehouseImageError(event: SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = FALLBACK_WAREHOUSE_IMAGE;
}
