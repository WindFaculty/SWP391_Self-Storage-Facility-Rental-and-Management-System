package com.storage.management.controller;

import com.storage.management.dto.InvoiceStatusSummary;
import com.storage.management.dto.ManagementDtos.PolicyRequest;
import com.storage.management.dto.ManagementDtos.PolicyResponse;
import com.storage.management.dto.RevenueReport;
import com.storage.management.service.BusinessPolicyService;
import com.storage.management.service.ReportService;
import com.storage.payment.entity.BusinessPolicy;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/business")
public class ManagementController {

    private final BusinessPolicyService businessPolicyService;
    private final ReportService reportService;

    public ManagementController(BusinessPolicyService businessPolicyService, ReportService reportService) {
        this.businessPolicyService = businessPolicyService;
        this.reportService = reportService;
    }

    @GetMapping("/policy")
    public ApiResponse<PolicyResponse> currentPolicy() {
        return ApiResponse.success(PolicyResponse.from(businessPolicyService.current()));
    }

    @PutMapping("/policy")
    public ApiResponse<PolicyResponse> updatePolicy(@Valid @RequestBody PolicyRequest request) {
        BusinessPolicy policy = businessPolicyService.setPolicy(request.depositPercent(),
                request.renewalNoticeDays(), request.cancellationFee(), request.returnNoticeDays(),
                request.overdueGraceDays(), request.overdueFeePerDay(), request.maxDiscountPercent(),
                currentUserId());
        return ApiResponse.success(PolicyResponse.from(policy));
    }

    @GetMapping("/reports/revenue")
    public ApiResponse<RevenueReport> revenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ApiResponse.success(reportService.revenue(from, to));
    }

    @GetMapping("/reports/invoices")
    public ApiResponse<List<InvoiceStatusSummary>> invoiceSummary() {
        return ApiResponse.success(reportService.invoiceStatusSummary());
    }

    private static Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
