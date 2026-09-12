package com.storage.shared.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

public class MoneyUtils {

    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(0, RoundingMode.HALF_UP);
    public static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("0.10"); // 10% VAT

    private MoneyUtils() {
    }

    public static BigDecimal round(BigDecimal amount) {
        if (amount == null) return ZERO;
        return amount.setScale(0, RoundingMode.HALF_UP);
    }

    public static BigDecimal round(BigDecimal amount, int scale) {
        if (amount == null) return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        return amount.setScale(scale, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTax(BigDecimal amount, BigDecimal taxRate) {
        if (amount == null || taxRate == null) return ZERO;
        return round(amount.multiply(taxRate));
    }

    public static BigDecimal applyDiscount(BigDecimal amount, BigDecimal discountPercent) {
        if (amount == null) return ZERO;
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return round(amount);
        }
        BigDecimal discountMultiplier = BigDecimal.ONE.subtract(
                discountPercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        return round(amount.multiply(discountMultiplier));
    }

    public static String formatVnd(BigDecimal amount) {
        if (amount == null) amount = ZERO;
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return currencyFormat.format(amount);
    }
}
