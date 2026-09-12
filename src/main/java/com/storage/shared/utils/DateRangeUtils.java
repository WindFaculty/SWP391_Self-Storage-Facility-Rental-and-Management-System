package com.storage.shared.utils;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class DateRangeUtils {

    private DateRangeUtils() {
    }

    public static long calculateDaysBetween(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Ngày bắt đầu và ngày kết thúc không được null");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Ngày kết thúc không được trước ngày bắt đầu");
        }
        return ChronoUnit.DAYS.between(start, end);
    }

    public static long calculateMonthsBetween(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Ngày bắt đầu và ngày kết thúc không được null");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Ngày kết thúc không được trước ngày bắt đầu");
        }
        return ChronoUnit.MONTHS.between(start, end);
    }

    public static boolean isOverlapping(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) {
            return false;
        }
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    public static boolean isValidRentalPeriod(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return false;
        }
        return !end.isBefore(start);
    }
}
