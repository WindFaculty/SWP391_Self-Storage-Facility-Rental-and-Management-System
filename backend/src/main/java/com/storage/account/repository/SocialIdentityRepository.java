package com.storage.account.repository;

import com.storage.account.entity.SocialIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SocialIdentityRepository extends JpaRepository<SocialIdentity, Long> {
    Optional<SocialIdentity> findByProviderAndSubject(String provider, String subject);
}
