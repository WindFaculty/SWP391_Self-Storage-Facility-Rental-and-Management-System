package com.storage.facility.dto;

import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.UnitType;

import java.math.BigDecimal;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CatalogUnitTypeResponse(Long id, String name, BigDecimal sizeM2, String description,
                                          BigDecimal minMonthlyPrice, BigDecimal maxMonthlyPrice,
                                          String imageUrl) {

        public static CatalogUnitTypeResponse from(UnitType unitType) {
            return new CatalogUnitTypeResponse(unitType.getId(), unitType.getName(),
                    unitType.getSizeM2(), unitType.getDescription(), unitType.getMinMonthlyPrice(),
                    unitType.getMaxMonthlyPrice(), unitType.getImageUrl());
        }
    }

    public record AvailabilityResponse(Long facilityId, Long unitTypeId, int availableCount,
                                       int totalCount) {
    }

    public record FacilityResponse(Long id, String code, String name, String address,
                                   FacilityStatus status, String imageUrl,
                                   java.util.List<com.storage.media.MediaDtos.ImageDto> images) {

        public FacilityResponse(Long id, String code, String name, String address,
                                FacilityStatus status, String imageUrl) {
            this(id, code, name, address, status, imageUrl, java.util.List.of());
        }

        public static FacilityResponse from(Facility facility) {
            return new FacilityResponse(facility.getId(), facility.getCode(), facility.getName(),
                    facility.getAddress(), facility.getStatus(), facility.getImageUrl());
        }
    }

    public record UnitTypeResponse(Long id, String name, BigDecimal sizeM2, BigDecimal minMonthlyPrice,
                                   BigDecimal maxMonthlyPrice, String description, String imageUrl) {

        public static UnitTypeResponse from(UnitType unitType) {
            return new UnitTypeResponse(unitType.getId(), unitType.getName(), unitType.getSizeM2(),
                    unitType.getMinMonthlyPrice(), unitType.getMaxMonthlyPrice(),
                    unitType.getDescription(), unitType.getImageUrl());
        }
    }
}
