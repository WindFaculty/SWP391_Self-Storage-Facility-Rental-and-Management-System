package com.storage.rental.dto;

import com.storage.rental.entity.ReservationStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public final class ReservationDtos {
    private ReservationDtos() { }

    public record ReservationRequest(
            @NotNull UUID facilityId,
            @NotNull UUID unitTypeId,
            @NotNull @Future LocalDate preferredStartDate,
            @Min(1) int rentalMonths
    ) { }

    public record ReservationResponse(
            UUID id,
            UUID customerId,
            UUID facilityId,
            UUID unitTypeId,
            LocalDate preferredStartDate,
            int rentalMonths,
            UUID assignedUnitId,
            BigDecimal estimatedPrice,
            ReservationStatus status
    ) { }
}
