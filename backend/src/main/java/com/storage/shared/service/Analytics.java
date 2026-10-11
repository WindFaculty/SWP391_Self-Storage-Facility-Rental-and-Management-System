package com.storage.shared.service;

import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Revenue-by-month and percentage helpers shared by the facility and management
 * dashboards. The rental -> invoice -> paid-attempt chain lives here so callers
 * only pass rental ids.
 */
@Service
public class Analytics {

    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MM/yyyy", Locale.forLanguageTag("vi"));

    private final InvoiceRepository invoices;
    private final PaymentAttemptRepository paymentAttempts;

    public Analytics(InvoiceRepository invoices, PaymentAttemptRepository paymentAttempts) {
        this.invoices = invoices;
        this.paymentAttempts = paymentAttempts;
    }

    public record MonthPoint(String month, String label, BigDecimal amount) {
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> paidByMonth(List<Long> rentalIds) {
        Map<String, BigDecimal> byMonth = new HashMap<>();
        if (rentalIds.isEmpty()) {
            return byMonth;
        }
        List<Long> invoiceIds = invoices.findByRentalIdIn(rentalIds).stream()
                .map(Invoice::getId).toList();
        if (invoiceIds.isEmpty()) {
            return byMonth;
        }
        for (PaymentAttemptRepository.MonthlyAmount row :
                paymentAttempts.summarizePaidByMonth(invoiceIds)) {
            byMonth.merge("%04d-%02d".formatted(row.getYear(), row.getMonth()), row.getTotal(),
                    BigDecimal::add);
        }
        return byMonth;
    }

    /** Zero-filled series covering the last {@code months} months, oldest first. */
    public static List<MonthPoint> window(Map<String, BigDecimal> byMonth, int months) {
        YearMonth cursor = YearMonth.now(ZoneOffset.UTC).minusMonths(months - 1L);
        List<MonthPoint> points = new java.util.ArrayList<>(months);
        for (int i = 0; i < months; i++) {
            String key = "%04d-%02d".formatted(cursor.getYear(), cursor.getMonthValue());
            points.add(new MonthPoint(key, cursor.format(MONTH_LABEL),
                    byMonth.getOrDefault(key, BigDecimal.ZERO)));
            cursor = cursor.plusMonths(1);
        }
        return points;
    }

    public static BigDecimal sum(Map<String, BigDecimal> byMonth) {
        BigDecimal total = BigDecimal.ZERO;
        for (BigDecimal amount : byMonth.values()) {
            total = total.add(amount);
        }
        return total;
    }

    public static double rate(long part, long total) {
        return total == 0 ? 0d : BigDecimal.valueOf(part).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP).doubleValue();
    }

    public static <T> long count(List<T> items, java.util.function.Predicate<T> match) {
        return items.stream().filter(match).count();
    }
}