package com.storage.management.dto;

import com.storage.payment.entity.Invoice;
import java.math.BigDecimal;

public record InvoiceStatusSummary(Invoice.Status status, long count, BigDecimal totalAmount) {
}
