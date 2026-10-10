package com.storage.payment.repository;

import com.storage.payment.entity.PaymentAttempt;
import java.math.BigDecimal;
import java.time.Instant;
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

    interface AmountCount {
        BigDecimal getTotal();

        long getCount();
    }

    @Query("select coalesce(sum(a.amount), 0) as total, count(a) as count "
            + "from PaymentAttempt a where a.paidAt >= :from and a.paidAt < :to")
    AmountCount summarizeByPaidAt(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select coalesce(sum(a.amount), 0) as total, count(a) as count "
            + "from PaymentAttempt a where a.refundedAt >= :from and a.refundedAt < :to")
    AmountCount summarizeByRefundedAt(@Param("from") Instant from, @Param("to") Instant to);
}
