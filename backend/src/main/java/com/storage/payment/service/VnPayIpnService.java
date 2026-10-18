package com.storage.payment.service;

import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.math.BigInteger;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class VnPayIpnService {

    private final VnPayService vnPayService;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final PaymentService paymentService;

    public VnPayIpnService(VnPayService vnPayService,
                           PaymentAttemptRepository paymentAttemptRepository,
                           PaymentService paymentService) {
        this.vnPayService = vnPayService;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.paymentService = paymentService;
    }

    public Map<String, String> handleIpn(Map<String, String> params) {
        try {
            if (!vnPayService.verifyChecksum(params)) {
                return rsp("97", "Invalid signature");
            }
            String txnRef = params.get("vnp_TxnRef");
            if (!StringUtils.hasText(txnRef)) {
                return rsp("01", "Order not found");
            }
            Optional<PaymentAttempt> found = paymentAttemptRepository.findByProviderReference(txnRef);
            if (found.isEmpty()) {
                return rsp("01", "Order not found");
            }
            PaymentAttempt attempt = found.get();
            if (!amountMatches(params.get("vnp_Amount"), attempt)) {
                return rsp("04", "Invalid amount");
            }
            if (attempt.getStatus() != PaymentAttempt.Status.PENDING) {
                return rsp("02", "Order already confirmed");
            }

            boolean succeeded = "00".equals(params.get("vnp_ResponseCode"))
                    && "00".equals(params.get("vnp_TransactionStatus"));
            // ponytail: success on an invoice that is no longer PENDING (late IPN) still records the
            // attempt; staff resolves via manual refund (RefundService), querydr reconcile pending G1.
            paymentService.handleGatewayResult(txnRef, succeeded,
                    vnPayService.parsePayDate(params.get("vnp_PayDate")),
                    params.get("vnp_TransactionNo"));
            return rsp("00", "Confirm Success");
        } catch (Exception e) {
            return rsp("99", "Unknown error");
        }
    }

    private static boolean amountMatches(String vnpAmount, PaymentAttempt attempt) {
        if (!StringUtils.hasText(vnpAmount) || attempt.getAmount() == null) {
            return false;
        }
        try {
            return new BigInteger(vnpAmount)
                    .equals(attempt.getAmount().movePointRight(2).toBigIntegerExact());
        } catch (NumberFormatException | ArithmeticException e) {
            return false;
        }
    }

    private static Map<String, String> rsp(String code, String message) {
        return Map.of("RspCode", code, "Message", message);
    }
}
