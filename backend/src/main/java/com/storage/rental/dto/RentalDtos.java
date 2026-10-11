package com.storage.rental.dto;

import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class RentalDtos {

    private RentalDtos() {
    }

    public record HoldRequest(
            @NotNull Long facilityId,
            @NotNull Long unitTypeId,
            @NotNull LocalDate startDate,
            @Min(1) int rentalMonths,
            String note) {
    }

    public record RenewalRequest(@Min(1) int additionalMonths) {
    }

    public record ReturnRequest(LocalDate requestedDate, String note) {
    }

    public record InvoiceSummary(Long id, String status, BigDecimal rentAmount,
                                 BigDecimal depositAmount, BigDecimal totalAmount, Instant dueAt) {
    }

    public record RentalResponse(Long id, RentalStatus status, Long facilityId, String facilityName,
                                 Long unitId, String unitCode, Long unitTypeId, String unitTypeName,
                                 LocalDate startDate, LocalDate endDate, BigDecimal monthlyPrice,
                                 Instant holdExpiresAt, Long invoiceId, Instant createdAt) {

        public static RentalResponse of(Rental rental, Long facilityId, String facilityName,
                                        String unitCode, Long unitTypeId, String unitTypeName,
                                        Long invoiceId) {
            return new RentalResponse(rental.getId(), rental.getStatus(), facilityId, facilityName,
                    rental.getUnitId(), unitCode, unitTypeId, unitTypeName, rental.getStartDate(),
                    rental.getEndDate(), rental.getPricePerMonth(), rental.getPaymentExpiresAt(),
                    invoiceId, rental.getCreatedAt());
        }
    }

    public record HoldResponse(RentalResponse rental, InvoiceSummary invoice) {
    }

    public record RenewalResponse(RentalResponse rental, InvoiceSummary invoice) {
    }

    public record ReturnResponse(RentalResponse rental) {
    }
}
