package com.storage.facility.dto;

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
}
