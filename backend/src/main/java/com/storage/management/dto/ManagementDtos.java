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

    public record FacilityOverviewResponse(Long id, String code, String name, String address,
                                           String status, String managerName, long unitTotal,
                                           long unitOccupied, double occupancyRate,
                                           long activeRentals, long overdueRentals) {
    }

    public record FacilityInputRequest(String code, String name, String address) {
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
