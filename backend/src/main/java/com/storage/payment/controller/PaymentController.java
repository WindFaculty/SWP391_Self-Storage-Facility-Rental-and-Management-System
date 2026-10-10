package com.storage.payment.controller;

import com.storage.payment.dto.PaymentDtos.CheckoutRequest;
import com.storage.payment.dto.PaymentDtos.CheckoutResponse;
import com.storage.payment.dto.PaymentDtos.PaymentAttemptResponse;
import com.storage.payment.dto.PaymentDtos.RefundRequest;
import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.service.InvoiceService;
import com.storage.payment.service.PaymentService;
import com.storage.payment.service.RefundService;
import com.storage.payment.service.VnPayService;
import com.storage.rental.service.RentalOwnershipService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {

    private static final Duration PAYMENT_WINDOW = Duration.ofMinutes(15);

    private final InvoiceService invoiceService;
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final VnPayService vnPayService;
    private final RentalOwnershipService rentalOwnershipService;

    public PaymentController(InvoiceService invoiceService,
                             PaymentService paymentService,
                             RefundService refundService,
                             VnPayService vnPayService,
                             RentalOwnershipService rentalOwnershipService) {
        this.invoiceService = invoiceService;
        this.paymentService = paymentService;
        this.refundService = refundService;
        this.vnPayService = vnPayService;
        this.rentalOwnershipService = rentalOwnershipService;
    }

    @PostMapping("/customer/payments/vnpay/checkout")
    public ApiResponse<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request,
                                                  HttpServletRequest httpRequest) {
        Invoice invoice = invoiceService.get(request.invoiceId());
        rentalOwnershipService.requireRentalOwner(invoice.getRentalId());
        Instant createdAt = Instant.now();
        Instant expiresAt = createdAt.plus(PAYMENT_WINDOW);
        PaymentAttempt attempt = paymentService.startAttempt(invoice.getId(), invoice.totalAmount(),
                "VNPAY", generateReference(invoice.getId()));
        String payUrl = vnPayService.createPaymentUrl(attempt, clientIp(httpRequest), createdAt, expiresAt);
        return ApiResponse.success(new CheckoutResponse(attempt.getProviderReference(), payUrl, expiresAt));
    }

    @GetMapping("/customer/invoices/{invoiceId}/payments")
    public ApiResponse<List<PaymentAttemptResponse>> history(@PathVariable Long invoiceId) {
        Invoice invoice = invoiceService.get(invoiceId);
        rentalOwnershipService.requireRentalOwner(invoice.getRentalId());
        return ApiResponse.success(paymentService.attemptsOfInvoice(invoiceId).stream()
                .map(PaymentAttemptResponse::from)
                .toList());
    }

    @PostMapping("/business/payments/refunds")
    public ApiResponse<PaymentAttemptResponse> recordRefund(@Valid @RequestBody RefundRequest request) {
        Long actorId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        PaymentAttempt attempt = refundService.recordManualRefund(
                request.providerReference(), actorId, request.note(), null);
        return ApiResponse.success(PaymentAttemptResponse.from(attempt));
    }

    private static String generateReference(Long invoiceId) {
        return "VNP-" + invoiceId + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
