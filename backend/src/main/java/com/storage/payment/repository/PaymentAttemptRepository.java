package com.storage.payment.repository;

import com.storage.payment.entity.PaymentAttempt;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {

    Optional<PaymentAttempt> findByProviderReference(String providerReference);

    boolean existsByProviderReference(String providerReference);
}
