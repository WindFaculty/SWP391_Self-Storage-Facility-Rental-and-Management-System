package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VnPayIpnServiceTest {

    @Mock
    private VnPayService vnPayService;

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    @Mock
    private PaymentService paymentService;

    private VnPayIpnService ipnService;

    @BeforeEach
    void setUp() {
        ipnService = new VnPayIpnService(vnPayService, paymentAttemptRepository, paymentService);
    }

    private static Map<String, String> ipnParams() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "12345678");
        params.put("vnp_Amount", "9000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "14226112");
        params.put("vnp_PayDate", "20261010100500");
        return params;
    }

    private static PaymentAttempt pendingAttempt() {
        return PaymentAttempt.pending(1L, new BigDecimal("90.00"), "VNPAY", "12345678");
    }

    @Test
    void invalidSignatureReturns97() {
        when(vnPayService.verifyChecksum(any())).thenReturn(false);

        assertEquals("97", ipnService.handleIpn(ipnParams()).get("RspCode"));

        verifyNoInteractions(paymentAttemptRepository, paymentService);
    }

    @Test
    void unknownOrderReturns01() {
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.empty());

        assertEquals("01", ipnService.handleIpn(ipnParams()).get("RspCode"));

        verifyNoInteractions(paymentService);
    }

    @Test
    void amountMismatchReturns04() {
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(pendingAttempt()));
        Map<String, String> params = ipnParams();
        params.put("vnp_Amount", "8900");

        assertEquals("04", ipnService.handleIpn(params).get("RspCode"));

        verifyNoInteractions(paymentService);
    }

    @Test
    void duplicateCallbackReturns02() {
        PaymentAttempt attempt = pendingAttempt();
        attempt.succeed(Instant.parse("2026-10-10T03:05:00Z"), "14226112");
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(attempt));

        assertEquals("02", ipnService.handleIpn(ipnParams()).get("RspCode"));

        verifyNoInteractions(paymentService);
    }

    @Test
    void successfulIpnConfirmsAndRecordsResult() {
        Instant paidAt = Instant.parse("2026-10-10T03:05:00Z");
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(vnPayService.parsePayDate("20261010100500")).thenReturn(paidAt);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(pendingAttempt()));

        Map<String, String> response = ipnService.handleIpn(ipnParams());

        assertEquals("00", response.get("RspCode"));
        verify(paymentService).handleGatewayResult("12345678", true, paidAt, "14226112");
    }

    @Test
    void failedTransactionIsRecordedAsFailure() {
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(pendingAttempt()));
        Map<String, String> params = ipnParams();
        params.put("vnp_ResponseCode", "24");
        params.put("vnp_TransactionStatus", "02");

        Map<String, String> response = ipnService.handleIpn(params);

        assertEquals("00", response.get("RspCode"));
        verify(paymentService).handleGatewayResult("12345678", false, null, "14226112");
    }

    @Test
    void unexpectedErrorReturns99() {
        when(vnPayService.verifyChecksum(any())).thenReturn(true);
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenThrow(new IllegalStateException("db down"));

        assertEquals("99", ipnService.handleIpn(ipnParams()).get("RspCode"));
    }
}
