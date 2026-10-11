package com.storage.account;

import com.storage.account.entity.*;
import com.storage.account.repository.*;
import com.storage.account.service.*;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SocialAuthServiceTests {
    private final UserRepository users = mock(UserRepository.class);
    private final RefreshTokenRepository refresh = mock(RefreshTokenRepository.class);
    private final SocialIdentityRepository identities = mock(SocialIdentityRepository.class);
    private final SocialTokenVerifier verifier = mock(SocialTokenVerifier.class);
    private final JwtTokenProvider jwt = mock(JwtTokenProvider.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private AuthService service;

    @BeforeEach
    void setup() {
        service = new AuthService(users, refresh, encoder, jwt, mock(AuthenticationManager.class),
                mock(ActivityLogService.class), identities, verifier);
        when(verifier.verify("facebook", "valid")).thenReturn(
                new SocialTokenVerifier.Profile("google-subject", "customer@example.com", "Customer"));
        when(identities.findByProviderAndSubject("facebook", "google-subject")).thenReturn(Optional.empty());
    }

    @Test
    void existingEmailDoesNotGrantAccessOrLinkIdentity() {
        when(users.existsByEmail("customer@example.com")).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.socialLogin("facebook", "valid"));
        verify(users, never()).save(any());
        verify(identities, never()).save(any());
        verifyNoInteractions(jwt, refresh);
    }

    @Test
    void inactiveIdentityCannotObtainTokens() {
        when(identities.findByProviderAndSubject("facebook", "google-subject"))
                .thenReturn(Optional.of(new SocialIdentity("facebook", "google-subject", 42L)));
        User user = new User();
        user.setStatus(UserStatus.DISABLED);
        when(users.findById(42L)).thenReturn(Optional.of(user));
        assertThrows(BusinessException.class, () -> service.socialLogin("facebook", "valid"));
        verifyNoInteractions(jwt, refresh);
    }

    @Test
    void returningIdentityUsesStoredUserEvenWhenProviderEmailChanges() {
        when(identities.findByProviderAndSubject("facebook", "google-subject"))
                .thenReturn(Optional.of(new SocialIdentity("facebook", "google-subject", 42L)));
        User user = mock(User.class);
        when(user.getId()).thenReturn(42L);
        when(user.getEmail()).thenReturn("original@example.com");
        when(user.getRole()).thenReturn(UserRole.CUSTOMER);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(users.findById(42L)).thenReturn(Optional.of(user));
        when(jwt.generateAccessToken(any())).thenReturn("access");
        when(jwt.generateRefreshToken(42L, "original@example.com")).thenReturn("refresh");
        var result = service.socialLogin("facebook", "valid");
        assertEquals(42L, result.user().id());
        verify(users, never()).findByEmail(anyString());
        verify(users, never()).save(any());
        verify(refresh).save(any());
    }

    @Test
    void rejectedProviderTokenCannotTouchAccounts() {
        when(verifier.verify("facebook", "invalid")).thenThrow(new BusinessException(
                com.storage.shared.exception.ErrorCode.INVALID_CREDENTIALS));
        assertThrows(BusinessException.class, () -> service.socialLogin("facebook", "invalid"));
        verifyNoInteractions(users, identities, jwt, refresh);
    }
}
