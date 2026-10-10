package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.InvoiceRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private BusinessPolicyRepository businessPolicyRepository;

    private InvoiceService invoiceService;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(invoiceRepository, businessPolicyRepository);
    }

    private static BusinessPolicy policy(String maxDiscountPercent) {
        BusinessPolicy policy = mock(BusinessPolicy.class);
        when(policy.getMaxDiscountPercent()).thenReturn(new BigDecimal(maxDiscountPercent));
        return policy;
    }

    @Test
    void createsRenewalInvoiceWithinPolicyCeiling() {
        BusinessPolicy policy = policy("10.00");
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.of(policy));
        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Invoice invoice = invoiceService.create(Invoice.Type.RENEWAL, 1L, 2L, null,
                "Renewal 1 month", new BigDecimal("100.00"), new BigDecimal("10.00"), null);

        assertEquals(Invoice.Status.PENDING, invoice.getStatus());
        assertEquals(new BigDecimal("90.00"), invoice.totalAmount());
        assertEquals(2L, invoice.getRenewalId());
    }

    @Test
    void createsExtraInvoiceWithFeeType() {
        BusinessPolicy policy = policy("10.00");
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.of(policy));
        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Invoice invoice = invoiceService.create(Invoice.Type.EXTRA, 1L, null, 5L,
                "Late fee", new BigDecimal("50.00"), null, null);

        assertEquals(Invoice.Type.EXTRA, invoice.getType());
        assertEquals(5L, invoice.getFeeTypeId());
        assertEquals(BigDecimal.ZERO, invoice.getDiscountAmount());
    }

    @Test
    void rejectsDiscountAbovePolicyCeiling() {
        BusinessPolicy policy = policy("10.00");
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.of(policy));

        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.create(Invoice.Type.RENTAL, 1L, null, null, "Rent",
                        new BigDecimal("100.00"), new BigDecimal("10.01"), null));

        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    void rejectsWhenPolicyMissing() {
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> invoiceService.create(Invoice.Type.DEPOSIT, 1L, null, null, "Deposit",
                        new BigDecimal("100.00"), null, null));

        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    void rejectsExtraInvoiceWithoutFeeType() {
        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.create(Invoice.Type.EXTRA, 1L, null, null, "Extra",
                        new BigDecimal("50.00"), null, null));

        verify(invoiceRepository, never()).save(any(Invoice.class));
    }
}
