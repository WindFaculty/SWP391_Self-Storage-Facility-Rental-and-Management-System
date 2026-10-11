package com.storage.payment.repository;

import com.storage.payment.entity.PaymentAttempt;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {

    Optional<PaymentAttempt> findByProviderReference(String providerReference);

    boolean existsByProviderReference(String providerReference);

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
