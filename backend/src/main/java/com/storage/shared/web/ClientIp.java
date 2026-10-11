package com.storage.shared.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Client IP behind a reverse proxy, resolved the same way in every caller. */
public final class ClientIp {

    private ClientIp() {
    }

    /** Null when called outside a servlet request (schedulers, async jobs). */
    public static String current() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return of(attributes.getRequest());
        }
        return null;
    }

    public static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}