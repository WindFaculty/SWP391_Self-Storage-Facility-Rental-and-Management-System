package com.storage.shared.security;

import com.storage.account.service.GoogleAccountService;
import com.storage.shared.exception.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URI;
import java.util.List;

@Component
public class GoogleOAuthHandlers {
    private final GoogleAccountService accounts; private final AuthCookies cookies; private final String frontend;
    public GoogleOAuthHandlers(GoogleAccountService accounts, AuthCookies cookies,
            @Value("${app.google.frontend-url:http://localhost:5173}") String frontend,
            @Value("${app.cors.allowed-origins}") List<String> origins) {
        URI uri = URI.create(frontend);
        if (!origins.contains(frontend) || !List.of("http", "https").contains(uri.getScheme())
                || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null
                || uri.getFragment() != null || (uri.getPath() != null && !uri.getPath().isEmpty()))
            throw new IllegalArgumentException("Google frontend URL must be an allowed CORS origin without a path");
        this.accounts = accounts; this.cookies = cookies; this.frontend = frontend;
    }
    public void success(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        String outcome = "?oauth=success";
        try { cookies.write(response, accounts.login((OidcUser) authentication.getPrincipal())); }
        catch (BusinessException error) {
            cookies.clear(response);
            outcome = "?oauth_error=" + (error.getErrorCode() == ErrorCode.EMAIL_ALREADY_EXISTS ? "email_conflict"
                    : error.getErrorCode() == ErrorCode.USER_INACTIVE ? "account_disabled" : "authentication_failed");
        } catch (RuntimeException error) { cookies.clear(response); outcome = "?oauth_error=authentication_failed"; }
        cleanup(request); response.sendRedirect(frontend + "/auth" + outcome);
    }
    public void failure(HttpServletRequest request, HttpServletResponse response,
                        org.springframework.security.core.AuthenticationException error) throws IOException {
        cookies.clear(response); cleanup(request); response.sendRedirect(frontend + "/auth?oauth_error=authentication_failed");
    }
    private void cleanup(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false); if (session != null) session.invalidate();
    }
}
