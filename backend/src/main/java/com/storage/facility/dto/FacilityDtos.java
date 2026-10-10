package com.storage.facility.dto;

import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.facility.entity.UnitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class FacilityDtos {

    private FacilityDtos() {
    }

    public record FacilityRequest(
            @NotBlank @Size(max = 30) String code,
            @NotBlank @Size(max = 150) String name,
            @NotBlank String address,
            FacilityStatus status) {

        public void applyTo(Facility facility) {
            facility.setCode(code.trim());
            facility.setName(name.trim());
            facility.setAddress(address);
            facility.setStatus(status == null ? FacilityStatus.ACTIVE : status);
        }
    }

    public record FacilityResponse(Long id, String code, String name, String address, FacilityStatus status) {

        public static FacilityResponse from(Facility facility) {
            return new FacilityResponse(facility.getId(), facility.getCode(), facility.getName(),
                    facility.getAddress(), facility.getStatus());
        }
    }

    public record UnitTypeRequest(
            @NotBlank @Size(max = 80) String name,
            @NotNull @DecimalMin("0.01") BigDecimal sizeM2,
            @NotNull @DecimalMin("0.00") BigDecimal minMonthlyPrice,
            @NotNull @DecimalMin("0.00") BigDecimal maxMonthlyPrice,
            String description) {
    }

    public record UnitTypeResponse(Long id, String name, BigDecimal sizeM2, BigDecimal minMonthlyPrice,
                                   BigDecimal maxMonthlyPrice, String description) {

        public static UnitTypeResponse from(UnitType unitType) {
            return new UnitTypeResponse(unitType.getId(), unitType.getName(), unitType.getSizeM2(),
                    unitType.getMinMonthlyPrice(), unitType.getMaxMonthlyPrice(), unitType.getDescription());
        }
    }

    public record StorageUnitRequest(
            @NotBlank @Size(max = 40) String unitCode,
            @NotNull Long unitTypeId,
            @Size(max = 100) String locationLabel,
            @NotNull @DecimalMin("0.00") BigDecimal monthlyPrice) {
    }

    public record StorageUnitResponse(Long id, Long facilityId, Long unitTypeId, String unitTypeName,
                                      String unitCode, String locationLabel, BigDecimal monthlyPrice,
                                      StorageUnitStatus status) {

        public static StorageUnitResponse from(StorageUnit unit) {
            return new StorageUnitResponse(unit.getId(), unit.getFacility().getId(), unit.getUnitType().getId(),
                    unit.getUnitType().getName(), unit.getUnitCode(), unit.getLocationLabel(),
                    unit.getMonthlyPrice(), unit.getStatus());
        }
    }

    public record UnitStatusRequest(@NotNull StorageUnitStatus status) {
    }
}
