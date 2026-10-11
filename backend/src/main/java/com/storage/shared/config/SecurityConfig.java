package com.storage.shared.config;

import com.storage.shared.exception.ErrorCode;
import com.storage.shared.security.JwtAuthenticationFilter;
import com.storage.shared.security.AuthCookies;
import com.storage.shared.security.GoogleOAuthHandlers;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectProvider<ClientRegistrationRepository> clients,
                                                   GoogleOAuthHandlers google,
                                                   @Value("${app.auth.cookie-secure:false}") boolean secure) throws Exception {
        CookieCsrfTokenRepository csrfRepository = new CookieCsrfTokenRepository();
        csrfRepository.setCookieCustomizer(cookie -> cookie.httpOnly(true).secure(secure).sameSite("Lax"));
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .requireCsrfProtectionMatcher(request -> {
                            if (List.of("GET", "HEAD", "OPTIONS", "TRACE").contains(request.getMethod())) return false;
                            String path = request.getRequestURI().substring(request.getContextPath().length());
                            if (path.startsWith("/auth/cookie/")) return true;
                            String header = request.getHeader("Authorization");
                            return (header == null || !header.startsWith("Bearer "))
                                    && AuthCookies.read(request, AuthCookies.ACCESS) != null;
                        }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .securityContext(context -> context.securityContextRepository(new NullSecurityContextRepository()))
                .requestCache(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/oauth2/**", "/login/oauth2/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/payments/vnpay/ipn", "/payments/vnpay/return").permitAll()
                        .requestMatchers(HttpMethod.GET, "/facilities", "/facilities/*",
                                "/facilities/*/unit-types", "/facilities/*/available-units",
                                "/unit-types", "/availability")
                        .permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/business/**").hasAnyRole("ADMIN", "BUSINESS_MANAGER")
                        .requestMatchers("/management/**").hasAnyRole("ADMIN", "BUSINESS_MANAGER")
                        .requestMatchers("/manager/**").hasAnyRole("ADMIN", "FACILITY_MANAGER")
                        .requestMatchers("/staff/**").hasAnyRole("ADMIN", "FACILITY_MANAGER", "FACILITY_STAFF")
                        .requestMatchers("/ops/**").hasAnyRole("ADMIN", "BUSINESS_MANAGER",
                                "FACILITY_MANAGER", "FACILITY_STAFF")
                        .requestMatchers("/customer/**").hasAnyRole("ADMIN", "CUSTOMER")
                        .requestMatchers("/rentals/**", "/invoices/**", "/support-tickets/**",
                                "/payments/**").hasAnyRole("ADMIN", "CUSTOMER")
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                                        ErrorCode.UNAUTHORIZED,
                                        "Yêu cầu xác thực tài khoản để truy cập tài nguyên này."))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeError(response, HttpServletResponse.SC_FORBIDDEN,
                                        ErrorCode.FORBIDDEN,
                                        "Bạn không có quyền truy cập tài nguyên này.")))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        ClientRegistrationRepository registrations = clients.getIfAvailable();
        if (registrations != null) {
            var resolver = new DefaultOAuth2AuthorizationRequestResolver(registrations, "/oauth2/authorization");
            resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
            http.oauth2Login(oauth -> oauth.authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                    .authorizedClientRepository(new org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository() {
                        public <T extends org.springframework.security.oauth2.client.OAuth2AuthorizedClient> T loadAuthorizedClient(
                                String id, org.springframework.security.core.Authentication principal, jakarta.servlet.http.HttpServletRequest request) { return null; }
                        public void saveAuthorizedClient(org.springframework.security.oauth2.client.OAuth2AuthorizedClient client,
                                org.springframework.security.core.Authentication principal, jakarta.servlet.http.HttpServletRequest request,
                                jakarta.servlet.http.HttpServletResponse response) { }
                        public void removeAuthorizedClient(String id, org.springframework.security.core.Authentication principal,
                                jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) { }
                    })
                    .successHandler(google::success).failureHandler(google::failure));
        }
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static void writeError(HttpServletResponse response, int status, ErrorCode code, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"" + code.getCode()
                + "\",\"message\":\"" + message + "\"}}");
    }
}
