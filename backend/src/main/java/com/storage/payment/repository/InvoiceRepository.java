package com.storage.payment.repository;

import com.storage.payment.entity.Invoice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByRentalIdOrderByCreatedAtDesc(Long rentalId);

    List<Invoice> findByRentalIdInOrderByCreatedAtDesc(List<Long> rentalIds);

    List<Invoice> findByRentalIdIn(List<Long> rentalIds);
}
