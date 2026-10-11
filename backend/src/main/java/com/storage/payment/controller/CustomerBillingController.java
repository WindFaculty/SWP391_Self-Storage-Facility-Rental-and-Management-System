package com.storage.payment.controller;

import com.storage.payment.dto.CustomerBillingDtos.CustomerInvoice;
import com.storage.payment.dto.CustomerBillingDtos.CustomerPaymentAttempt;
import com.storage.payment.dto.CustomerBillingDtos.VnPayUrlRequest;
import com.storage.payment.dto.CustomerBillingDtos.VnPayUrlResponse;
import com.storage.payment.service.CustomerBillingService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Customer billing endpoints consumed by frontend/src/features/billing/api.
 * Every response is scoped to the authenticated customer.
 */
@RestController
@RequestMapping
public class CustomerBillingController {

    private final CustomerBillingService customerBillingService;

    public CustomerBillingController(CustomerBillingService customerBillingService) {
        this.customerBillingService = customerBillingService;
    }

    @GetMapping("/invoices/me")
    public ApiResponse<List<CustomerInvoice>> myInvoices() {
        return ApiResponse.success(customerBillingService.myInvoices(currentUserId()));
    }

    @GetMapping("/invoices/{invoiceId}")
    public ApiResponse<CustomerInvoice> myInvoice(@PathVariable Long invoiceId) {
        return customerBillingService.myInvoice(currentUserId(), invoiceId)
                .map(invoice -> ApiResponse.success(invoice))
                .orElseThrow(() -> new NotFoundException(ErrorCode.INVOICE_NOT_FOUND));
    }

    @PostMapping("/payments/vnpay/url")
    public ApiResponse<VnPayUrlResponse> createVnPayUrl(@Valid @RequestBody VnPayUrlRequest request,
                                                        HttpServletRequest httpRequest) {
        String url = customerBillingService.createVnPayUrl(currentUserId(), request.invoiceId(),
                httpRequest);
        return ApiResponse.success(new VnPayUrlResponse(url));
    }

    @GetMapping("/payments/attempts/{reference}")
    public ApiResponse<CustomerPaymentAttempt> myAttempt(@PathVariable String reference) {
        return customerBillingService.myAttempt(currentUserId(), reference)
                .map(attempt -> ApiResponse.success(attempt))
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
    }

    private static Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
