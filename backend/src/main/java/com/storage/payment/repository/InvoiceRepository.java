package com.storage.payment.repository;

import com.storage.payment.entity.Invoice;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByRentalIdOrderByCreatedAtDesc(Long rentalId);

    List<Invoice> findByRentalIdInOrderByCreatedAtDesc(List<Long> rentalIds);

    List<Invoice> findByRentalIdIn(List<Long> rentalIds);

    interface StatusSummary {
        Invoice.Status getStatus();

        long getInvoiceCount();

        BigDecimal getTotalAmount();
    }

    @Query("select i.status as status, count(i) as invoiceCount, "
            + "coalesce(sum(i.amount - i.discountAmount), 0) as totalAmount "
            + "from Invoice i group by i.status order by i.status")
    List<StatusSummary> summarizeByStatus();
}
