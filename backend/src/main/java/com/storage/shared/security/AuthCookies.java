package com.storage.shared.security;

import com.storage.account.dto.AuthResponse;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import java.time.Duration;

@Component
public class AuthCookies {
    public static final String ACCESS = "storage_access_token", REFRESH = "storage_refresh_token";
    private final boolean secure;
    private final String path;
    private final JwtTokenProvider jwt;
    public AuthCookies(@Value("${app.auth.cookie-secure:false}") boolean secure,
                       @Value("${server.servlet.context-path:/api/v1}") String path, JwtTokenProvider jwt) {
        this.secure = secure; this.path = path.isBlank() ? "/" : path; this.jwt = jwt;
    }
    public void write(HttpServletResponse response, AuthResponse auth) {
        add(response, ACCESS, auth.accessToken(), jwt.getAccessExpirationMs());
        add(response, REFRESH, auth.refreshToken(), jwt.getRefreshExpirationMs());
    }
    public void clear(HttpServletResponse response) { add(response, ACCESS, "", 0); add(response, REFRESH, "", 0); }
    private void add(HttpServletResponse response, String name, String value, long duration) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value).httpOnly(true).secure(secure)
                .path(path).sameSite("Lax").maxAge(Duration.ofMillis(duration)).build().toString());
    }
    public static String read(HttpServletRequest request, String name) {
        if (request.getCookies() != null) for (Cookie cookie : request.getCookies())
            if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
}
