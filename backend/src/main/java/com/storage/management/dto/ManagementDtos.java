package com.storage.management.dto;

import com.storage.payment.entity.BusinessPolicy;

import java.math.BigDecimal;
import java.time.Instant;

public final class ManagementDtos {

    private ManagementDtos() {
    }

    public record PolicyRequest(BigDecimal depositPercent, Integer renewalNoticeDays,
                                BigDecimal cancellationFee, Integer returnNoticeDays,
                                Integer overdueGraceDays, BigDecimal overdueFeePerDay,
                                BigDecimal maxDiscountPercent) {
    }

    public record PolicyResponse(BigDecimal depositPercent, Integer renewalNoticeDays,
                                 Integer returnNoticeDays, Integer overdueGraceDays,
                                 BigDecimal overdueFeePerDay, BigDecimal cancellationFee,
                                 BigDecimal maxDiscountPercent, Instant updatedAt,
                                 String updatedBy) {

        public static PolicyResponse from(BusinessPolicy policy, String updatedByName) {
            return new PolicyResponse(policy.getDepositPercent(), policy.getRenewalNoticeDays(),
                    policy.getReturnNoticeDays(), policy.getOverdueGraceDays(),
                    policy.getOverdueFeePerDay(), policy.getCancellationFee(),
                    policy.getMaxDiscountPercent(), policy.getUpdatedAt(), updatedByName);
        }
    }

    public record FeeTypeResponse(Long id, String code, String name, BigDecimal defaultAmount,
                                  boolean active) {
    }

    public record FeeTypeUpdateRequest(String name, BigDecimal defaultAmount, boolean active) {
    }

    public record FeeTypeCreateRequest(String code, String name, BigDecimal defaultAmount, boolean active) {
    }

    public record UnitTypeResponse(Long id, String name, BigDecimal sizeM2, String description,
                                   BigDecimal minMonthlyPrice, BigDecimal maxMonthlyPrice,
                                   String imageUrl) {
    }

    public record UnitTypeInputRequest(String name, BigDecimal sizeM2, BigDecimal minMonthlyPrice,
                                       BigDecimal maxMonthlyPrice, String description,
                                       String imageUrl) {
        public UnitTypeInputRequest(String name, BigDecimal sizeM2, BigDecimal minMonthlyPrice,
                                    BigDecimal maxMonthlyPrice, String description) {
            this(name, sizeM2, minMonthlyPrice, maxMonthlyPrice, description, null);
        }
    }

    public record FacilityOverviewResponse(Long id, String code, String name, String address,
                                           String status, String managerName, long unitTotal,
                                           long unitOccupied, double occupancyRate,
                                           long activeRentals, long overdueRentals,
                                           String imageUrl,
                                           java.util.List<com.storage.media.MediaDtos.ImageDto> images) {
        public FacilityOverviewResponse(Long id, String code, String name, String address,
                                        String status, String managerName, long unitTotal,
                                        long unitOccupied, double occupancyRate, long activeRentals,
                                        long overdueRentals, String imageUrl) {
            this(id, code, name, address, status, managerName, unitTotal, unitOccupied,
                    occupancyRate, activeRentals, overdueRentals, imageUrl, java.util.List.of());
        }
    }

    public record FacilityInputRequest(String code, String name, String address, String imageUrl) {
        public FacilityInputRequest(String code, String name, String address) {
            this(code, name, address, null);
        }
    }

    public record FacilityStatusRequest(String status) {
    }

    public record FacilityReportRow(Long facilityId, String name, long unitTotal,
                                    long unitOccupied, long unitAvailable, double occupancyRate,
                                    java.math.BigDecimal revenue, long activeRentals,
                                    long overdueRentals) {
    }

    public record ReportSummary(java.math.BigDecimal totalRevenue, double occupancyRate,
                                long activeRentals, long overdueRentals,
                                java.util.List<com.storage.shared.service.Analytics.MonthPoint> revenuePoints,
                                java.util.List<FacilityReportRow> rows) {
    }
}
