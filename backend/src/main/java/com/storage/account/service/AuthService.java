package com.storage.account.service;

import com.storage.account.dto.AuthResponse;
import com.storage.account.dto.LoginRequest;
import com.storage.account.dto.RefreshTokenRequest;
import com.storage.account.dto.RegisterRequest;
import com.storage.account.dto.UserDto;
import com.storage.account.entity.RefreshToken;
import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.RefreshTokenRepository;
import com.storage.account.repository.UserRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.JwtTokenProvider;
import com.storage.shared.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwt;
    private final AuthenticationManager authenticationManager;
    private final ActivityLogService audit;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwt,
                       AuthenticationManager authenticationManager,
                       ActivityLogService audit) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.authenticationManager = authenticationManager;
        this.audit = audit;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        users.save(user);
        audit.record(user.getId(), "USER_REGISTERED", "USER", user.getId(),
                Map.<String, Object>of("email", email));
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizeEmail(request.email()), request.password()));
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = users.findById(principal.getId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
            audit.record(user.getId(), "LOGIN_SUCCESS", "USER", user.getId(), null);
            return issueTokens(user);
        } catch (BadCredentialsException ex) {
            audit.recordStandalone(null, "LOGIN_FAILED", null, null,
                    Map.<String, Object>of("email", normalizeEmail(request.email())));
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException ex) {
            audit.recordStandalone(null, "LOGIN_FAILED", null, null,
                    Map.<String, Object>of("email", normalizeEmail(request.email()), "reason", "DISABLED"));
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawToken = request.refreshToken();
        Claims claims = parseRefreshToken(rawToken);
        Long userId = jwt.getUserId(claims);

        RefreshToken stored = refreshTokens.findByTokenHash(sha256Hex(rawToken))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));
        if (stored.getRevokedAt() != null || !stored.getExpiresAt().isAfter(Instant.now())) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        stored.setRevokedAt(Instant.now());
        return issueTokens(user);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokens.findByTokenHash(sha256Hex(request.refreshToken()))
                .ifPresent(token -> token.setRevokedAt(Instant.now()));
    }

    @Transactional(readOnly = true)
    public UserDto me(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        return UserDto.from(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwt.generateAccessToken(UserPrincipal.create(user));
        String refreshToken = jwt.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken stored = new RefreshToken();
        stored.setUserId(user.getId());
        stored.setTokenHash(sha256Hex(refreshToken));
        stored.setExpiresAt(Instant.now().plusMillis(jwt.getRefreshExpirationMs()));
        refreshTokens.save(stored);

        return new AuthResponse(accessToken, refreshToken, "Bearer", jwt.getAccessExpirationMs(),
                UserDto.from(user));
    }

    private Claims parseRefreshToken(String rawToken) {
        try {
            Claims claims = jwt.parse(rawToken);
            if (!jwt.isRefreshToken(claims) || jwt.getUserId(claims) == null) {
                throw new BusinessException(ErrorCode.INVALID_TOKEN);
            }
            return claims;
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }

    private static String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
