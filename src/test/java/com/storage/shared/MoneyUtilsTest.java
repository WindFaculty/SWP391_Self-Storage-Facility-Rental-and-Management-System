package com.storage.shared;

import com.storage.shared.utils.MoneyUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MoneyUtilsTest {

    @Test
    @DisplayName("BE3: Money rounding HALF_UP")
    void testRounding() {
        BigDecimal val1 = new BigDecimal("150000.49");
        BigDecimal val2 = new BigDecimal("150000.50");

        assertEquals(new BigDecimal("150000"), MoneyUtils.round(val1));
        assertEquals(new BigDecimal("150001"), MoneyUtils.round(val2));
    }

    @Test
    @DisplayName("BE3: Calculate 10% VAT tax")
    void testCalculateTax() {
        BigDecimal amount = new BigDecimal("1000000");
        BigDecimal tax = MoneyUtils.calculateTax(amount, MoneyUtils.DEFAULT_VAT_RATE);

        assertEquals(new BigDecimal("100000"), tax);
    }

    @Test
    @DisplayName("BE3: Apply discount percentage")
    void testApplyDiscount() {
        BigDecimal original = new BigDecimal("1000000");
        BigDecimal discounted = MoneyUtils.applyDiscount(original, new BigDecimal("15")); // 15% discount

        assertEquals(new BigDecimal("850000"), discounted);
    }

    @Test
    @DisplayName("BE3: Format currency VND")
    void testFormatVnd() {
        BigDecimal amount = new BigDecimal("2500000");
        String formatted = MoneyUtils.formatVnd(amount);

        assertNotNull(formatted);
        assertTrue(formatted.contains("2.500.000") || formatted.contains("2,500,000"));
    }
}
