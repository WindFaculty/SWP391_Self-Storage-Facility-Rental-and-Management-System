package com.storage.payment.service;

import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.InvoiceRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private static final short POLICY_ID = 1;

    private final InvoiceRepository invoiceRepository;
    private final BusinessPolicyRepository businessPolicyRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          BusinessPolicyRepository businessPolicyRepository) {
        this.invoiceRepository = invoiceRepository;
        this.businessPolicyRepository = businessPolicyRepository;
    }

    @Transactional
    public Invoice create(Invoice.Type type, Long rentalId, Long renewalId, Long feeTypeId,
                          String description, BigDecimal amount, BigDecimal discountAmount,
                          Instant dueAt) {
        Invoice invoice = Invoice.create(type, rentalId, renewalId, feeTypeId, description,
                amount, discountAmount, dueAt);
        BusinessPolicy policy = businessPolicyRepository.findById(POLICY_ID)
                .orElseThrow(() -> new IllegalStateException("business policy is not configured"));
        if (invoice.getDiscountAmount().multiply(BigDecimal.valueOf(100))
                .compareTo(policy.getMaxDiscountPercent().multiply(invoice.getAmount())) > 0) {
            throw new IllegalArgumentException("discount exceeds policy ceiling of "
                    + policy.getMaxDiscountPercent() + "%");
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public List<Invoice> invoicesForRental(Long rentalId) {
        return invoiceRepository.findByRentalIdOrderByCreatedAtDesc(rentalId);
    }
}
