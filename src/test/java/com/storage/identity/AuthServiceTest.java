package com.storage.identity;

import com.storage.identity.domain.entity.Role;
import com.storage.identity.domain.entity.User;
import com.storage.identity.domain.enums.RoleName;
import com.storage.identity.domain.enums.UserStatus;
import com.storage.identity.dto.AuthResponse;
import com.storage.identity.dto.LoginRequest;
import com.storage.identity.dto.RegisterRequest;
import com.storage.identity.repository.RoleRepository;
import com.storage.identity.repository.UserRepository;
import com.storage.identity.service.AuthService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.security.JwtTokenProvider;
import com.storage.shared.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                roleRepository,
                passwordEncoder,
                jwtTokenProvider,
                authenticationManager
        );
    }

    @Test
    @DisplayName("BE1: Register customer success")
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@customer.com")
                .password("Password123!")
                .fullName("Test Customer")
                .phoneNumber("0912345678")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        Role customerRole = Role.builder()
                .id(1)
                .name(RoleName.CUSTOMER)
                .description("Customer role")
                .build();
        when(roleRepository.findByName(RoleName.CUSTOMER)).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed_pwd");

        User savedUser = User.builder()
                .email(request.getEmail())
                .passwordHash("hashed_pwd")
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>(Collections.singletonList(customerRole)))
                .build();
        savedUser.setId(UUID.randomUUID());

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateAccessToken(any(Authentication.class))).thenReturn("mock_access_token");
        when(jwtTokenProvider.generateRefreshToken(any(), any())).thenReturn("mock_refresh_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        assertEquals("test@customer.com", response.getUser().getEmail());
        assertTrue(response.getUser().getRoles().contains("CUSTOMER"));
    }

    @Test
    @DisplayName("BE1: Register duplicate email throws BusinessException")
    void testRegisterDuplicateEmailThrows() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@storage.com")
                .password("Password123!")
                .fullName("Existing User")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.register(request));
        assertEquals(ErrorCode.EMAIL_ALREADY_EXISTS, exception.getErrorCode());
    }

    @Test
    @DisplayName("BE1: Login success with valid credentials")
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("user@storage.com")
                .password("Password123!")
                .build();

        Role role = Role.builder().id(1).name(RoleName.CUSTOMER).build();
        User user = User.builder()
                .email("user@storage.com")
                .passwordHash("hashed_pwd")
                .fullName("Storage User")
                .status(UserStatus.ACTIVE)
                .roles(new HashSet<>(Collections.singletonList(role)))
                .build();
        user.setId(UUID.randomUUID());

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail("user@storage.com")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateAccessToken(authentication)).thenReturn("jwt_token_123");
        when(jwtTokenProvider.generateRefreshToken(any(), any())).thenReturn("refresh_token_123");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt_token_123", response.getAccessToken());
        assertEquals("user@storage.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("BE1: Login fails with invalid credentials")
    void testLoginInvalidCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("wrong@storage.com")
                .password("wrongpassword")
                .build();

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
    }
}
