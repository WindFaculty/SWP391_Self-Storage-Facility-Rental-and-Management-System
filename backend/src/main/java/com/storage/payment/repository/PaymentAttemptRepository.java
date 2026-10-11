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

    List<PaymentAttempt> findByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);

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

    interface MonthlyAmount {
        int getYear();

        int getMonth();

        BigDecimal getTotal();
    }

    @Query("""
            select year(a.paidAt) as year, month(a.paidAt) as month,
                   coalesce(sum(a.amount), 0) as total
            from PaymentAttempt a
            where a.paidAt is not null and a.invoiceId in :invoiceIds
            group by year(a.paidAt), month(a.paidAt)
            order by year(a.paidAt), month(a.paidAt)
            """)
    List<MonthlyAmount> summarizePaidByMonth(@Param("invoiceIds") List<Long> invoiceIds);
}
