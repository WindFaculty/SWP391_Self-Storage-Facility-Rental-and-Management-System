package com.storage.facility.dto;

import com.storage.facility.domain.entity.FacilityStatus;
import com.storage.facility.domain.enums.UnitStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public final class FacilityDtos {
    private FacilityDtos() { }
    public record FacilityRequest(@NotBlank @Size(max = 255) String name, @Size(max = 500) String address,
                                  @Size(max = 50) String phone, @Size(max = 1000) String description, FacilityStatus status) { }
    public record FacilityResponse(UUID id, String name, String address, String phone, String description, FacilityStatus status) { }
    public record UnitTypeRequest(@NotBlank @Size(max = 150) String name, @DecimalMin("0.01") BigDecimal width,
                                  @DecimalMin("0.01") BigDecimal length, @DecimalMin("0.01") BigDecimal height,
                                  @Size(max = 1000) String description, @NotNull @DecimalMin("0.00") BigDecimal minMonthlyPrice,
                                  @NotNull @DecimalMin("0.00") BigDecimal maxMonthlyPrice) { }
    public record UnitTypeResponse(UUID id, String name, BigDecimal width, BigDecimal length, BigDecimal height,
                                   String description, BigDecimal minMonthlyPrice, BigDecimal maxMonthlyPrice) { }
    public record StorageUnitRequest(@NotBlank @Size(max = 80) String code, @NotNull UUID unitTypeId,
                                     @Size(max = 50) String floor, @Size(max = 255) String location,
                                     @NotNull @DecimalMin("0.00") BigDecimal monthlyPrice) { }
    public record StorageUnitResponse(UUID id, UUID facilityId, UUID unitTypeId, String unitTypeName, String code,
                                      String floor, String location, BigDecimal monthlyPrice, UnitStatus status) { }
    public record StatusUpdateRequest(@NotNull UnitStatus status) { }
}
