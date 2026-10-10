package com.storage.payment.repository;

import com.storage.payment.entity.PaymentAttempt;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {

    Optional<PaymentAttempt> findByProviderReference(String providerReference);

    boolean existsByProviderReference(String providerReference);

    @Query("select a from PaymentAttempt a, Invoice i "
            + "where a.invoiceId = i.id and i.rentalId = :rentalId "
            + "order by a.createdAt desc, a.id desc")
    List<PaymentAttempt> findByRentalId(@Param("rentalId") Long rentalId);
}
