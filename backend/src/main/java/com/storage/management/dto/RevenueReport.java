package com.storage.management.dto;

import java.math.BigDecimal;

public record RevenueReport(BigDecimal paidTotal, long paidCount,
                            BigDecimal refundedTotal, long refundedCount) {
}
