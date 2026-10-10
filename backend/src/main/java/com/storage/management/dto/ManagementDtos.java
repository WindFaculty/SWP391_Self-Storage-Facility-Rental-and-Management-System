package com.storage.management.dto;

import com.storage.payment.entity.BusinessPolicy;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class ManagementDtos {

    private ManagementDtos() {
    }

    public record PolicyRequest(@NotNull BigDecimal depositPercent,
                                @NotNull Integer renewalNoticeDays,
                                @NotNull BigDecimal cancellationFee,
                                @NotNull Integer returnNoticeDays,
                                @NotNull Integer overdueGraceDays,
                                @NotNull BigDecimal overdueFeePerDay,
                                @NotNull BigDecimal maxDiscountPercent) {
    }

    public record PolicyResponse(BigDecimal depositPercent, Integer renewalNoticeDays,
                                 BigDecimal cancellationFee, Integer returnNoticeDays,
                                 Integer overdueGraceDays, BigDecimal overdueFeePerDay,
                                 BigDecimal maxDiscountPercent, Long updatedByUserId, Instant updatedAt) {

        public static PolicyResponse from(BusinessPolicy policy) {
            return new PolicyResponse(policy.getDepositPercent(), policy.getRenewalNoticeDays(),
                    policy.getCancellationFee(), policy.getReturnNoticeDays(), policy.getOverdueGraceDays(),
                    policy.getOverdueFeePerDay(), policy.getMaxDiscountPercent(), policy.getUpdatedByUserId(),
                    policy.getUpdatedAt());
        }
    }
}
