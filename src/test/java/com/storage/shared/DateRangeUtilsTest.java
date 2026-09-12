package com.storage.shared;

import com.storage.shared.utils.DateRangeUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class DateRangeUtilsTest {

    @Test
    @DisplayName("BE2: Calculate days between dates")
    void testCalculateDaysBetween() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = LocalDate.of(2026, 1, 31);

        long days = DateRangeUtils.calculateDaysBetween(start, end);
        assertEquals(30, days);
    }

    @Test
    @DisplayName("BE2: Calculate months between dates")
    void testCalculateMonthsBetween() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = LocalDate.of(2026, 7, 1);

        long months = DateRangeUtils.calculateMonthsBetween(start, end);
        assertEquals(6, months);
    }

    @Test
    @DisplayName("BE2: Check date range overlapping")
    void testIsOverlapping() {
        LocalDate start1 = LocalDate.of(2026, 1, 1);
        LocalDate end1 = LocalDate.of(2026, 1, 15);

        LocalDate start2 = LocalDate.of(2026, 1, 10);
        LocalDate end2 = LocalDate.of(2026, 1, 25);

        assertTrue(DateRangeUtils.isOverlapping(start1, end1, start2, end2));

        LocalDate start3 = LocalDate.of(2026, 2, 1);
        LocalDate end3 = LocalDate.of(2026, 2, 28);

        assertFalse(DateRangeUtils.isOverlapping(start1, end1, start3, end3));
    }

    @Test
    @DisplayName("BE2: Valid rental period check")
    void testIsValidRentalPeriod() {
        assertTrue(DateRangeUtils.isValidRentalPeriod(LocalDate.now(), LocalDate.now().plusMonths(1)));
        assertFalse(DateRangeUtils.isValidRentalPeriod(LocalDate.now(), LocalDate.now().minusDays(1)));
    }
}
