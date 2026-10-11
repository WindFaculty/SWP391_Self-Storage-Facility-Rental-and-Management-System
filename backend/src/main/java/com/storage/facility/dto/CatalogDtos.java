package com.storage.facility.dto;

import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.UnitType;

import java.math.BigDecimal;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CatalogUnitTypeResponse(Long id, String name, BigDecimal sizeM2, String description,
                                          BigDecimal minMonthlyPrice, BigDecimal maxMonthlyPrice) {

        public static CatalogUnitTypeResponse from(UnitType unitType) {
            return new CatalogUnitTypeResponse(unitType.getId(), unitType.getName(),
                    unitType.getSizeM2(), unitType.getDescription(), unitType.getMinMonthlyPrice(),
                    unitType.getMaxMonthlyPrice());
        }
    }

    public record AvailabilityResponse(Long facilityId, Long unitTypeId, int availableCount,
                                       int totalCount) {
    }

    public record FacilityResponse(Long id, String code, String name, String address,
                                   FacilityStatus status) {

        public static FacilityResponse from(Facility facility) {
            return new FacilityResponse(facility.getId(), facility.getCode(), facility.getName(),
                    facility.getAddress(), facility.getStatus());
        }
    }

    public record UnitTypeResponse(Long id, String name, BigDecimal sizeM2, BigDecimal minMonthlyPrice,
                                   BigDecimal maxMonthlyPrice, String description) {

        public static UnitTypeResponse from(UnitType unitType) {
            return new UnitTypeResponse(unitType.getId(), unitType.getName(), unitType.getSizeM2(),
                    unitType.getMinMonthlyPrice(), unitType.getMaxMonthlyPrice(), unitType.getDescription());
        }
    }
}
