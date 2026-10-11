package com.storage.account.service;

import com.storage.account.dto.AuthResponse;
import com.storage.account.entity.*;
import com.storage.account.repository.*;
import com.storage.shared.exception.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.Locale;
import java.util.UUID;

/** Links only an already verified provider subject; matching email is never proof of ownership. */
@Service
public class GoogleAccountService {
    private final UserRepository users;
    private final SocialIdentityRepository identities;
    private final PasswordEncoder passwords;
    private final AuthService auth;
    private final TransactionTemplate transactions;
    public GoogleAccountService(UserRepository users, SocialIdentityRepository identities,
                                PasswordEncoder passwords, AuthService auth, PlatformTransactionManager manager) {
        this.users = users; this.identities = identities; this.passwords = passwords; this.auth = auth;
        this.transactions = new TransactionTemplate(manager);
    }
    public AuthResponse login(OidcUser principal) {
        if (!Boolean.TRUE.equals(principal.getEmailVerified()) || principal.getSubject() == null
                || principal.getSubject().isBlank() || principal.getSubject().length() > 255
                || principal.getEmail() == null || principal.getEmail().length() > 255
                || !principal.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        try { return transactions.execute(status -> resolve(principal, true)); }
        catch (DataIntegrityViolationException race) {
            // Retry only after the failed transaction has rolled back, including any newly inserted user.
            return transactions.execute(status -> resolve(principal, false));
        }
    }
    private AuthResponse resolve(OidcUser principal, boolean create) {
        var identity = identities.findByProviderAndSubject("google", principal.getSubject());
        User user;
        if (identity.isPresent()) user = users.findById(identity.get().getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        else {
            String email = principal.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!create || users.existsByEmail(email)) throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
            user = new User(); user.setEmail(email);
            String name = principal.getFullName();
            if (name == null || name.isBlank()) name = email;
            user.setFullName(name.substring(0, Math.min(name.length(), 120)));
            user.setPasswordHash(passwords.encode(UUID.randomUUID().toString()));
            user.setRole(UserRole.CUSTOMER); user.setStatus(UserStatus.ACTIVE);
            users.saveAndFlush(user);
            identities.saveAndFlush(new SocialIdentity("google", principal.getSubject(), user.getId()));
        }
        if (user.getStatus() != UserStatus.ACTIVE) throw new BusinessException(ErrorCode.USER_INACTIVE);
        return auth.issueTokens(user);
    }
}
