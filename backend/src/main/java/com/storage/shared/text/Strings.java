package com.storage.shared.text;

import java.util.Locale;

public final class Strings {

    private Strings() {
    }

    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** Case-insensitive containment on a pre-lowercased needle. */
    public static boolean containsIgnoreCase(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }
}
