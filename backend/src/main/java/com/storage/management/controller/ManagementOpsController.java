package com.storage.management.controller;

import com.storage.management.dto.ManagementDtos.FacilityInputRequest;
import com.storage.management.dto.ManagementDtos.FacilityOverviewResponse;
import com.storage.management.dto.ManagementDtos.FacilityStatusRequest;
import com.storage.management.dto.ManagementDtos.FeeTypeResponse;
import com.storage.management.dto.ManagementDtos.FeeTypeUpdateRequest;
import com.storage.management.dto.ManagementDtos.PolicyRequest;
import com.storage.management.dto.ManagementDtos.PolicyResponse;
import com.storage.management.dto.ManagementDtos.ReportSummary;
import com.storage.management.service.ManagementOpsService;
import com.storage.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Business-manager endpoints. Paths mirror the FE2 adapter
 * frontend/src/features/management/api/managementApi.ts.
 */
@RestController
@RequestMapping("/management")
public class ManagementOpsController {

    private final ManagementOpsService managementOpsService;

    public ManagementOpsController(ManagementOpsService managementOpsService) {
        this.managementOpsService = managementOpsService;
    }

    @GetMapping("/policy")
    public ApiResponse<PolicyResponse> policy() {
        return ApiResponse.success(managementOpsService.policy());
    }

    @PutMapping("/policy")
    public ApiResponse<PolicyResponse> updatePolicy(@Valid @RequestBody PolicyRequest request) {
        return ApiResponse.success(managementOpsService.updatePolicy(request));
    }

    @GetMapping("/fee-types")
    public ApiResponse<List<FeeTypeResponse>> feeTypes() {
        return ApiResponse.success(managementOpsService.feeTypes());
    }

    @PutMapping("/fee-types/{feeTypeId}")
    public ApiResponse<FeeTypeResponse> updateFeeType(@PathVariable Long feeTypeId,
                                                      @Valid @RequestBody FeeTypeUpdateRequest request) {
        return ApiResponse.success(managementOpsService.updateFeeType(feeTypeId, request));
    }

    @GetMapping("/facilities")
    public ApiResponse<List<FacilityOverviewResponse>> facilityOverviews() {
        return ApiResponse.success(managementOpsService.facilityOverviews());
    }

    @PostMapping("/facilities")
    public ResponseEntity<ApiResponse<FacilityOverviewResponse>> createFacility(
            @Valid @RequestBody FacilityInputRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(managementOpsService.createFacility(request)));
    }

    @PutMapping("/facilities/{facilityId}")
    public ApiResponse<FacilityOverviewResponse> updateFacility(@PathVariable Long facilityId,
            @Valid @RequestBody FacilityInputRequest request) {
        return ApiResponse.success(managementOpsService.updateFacility(facilityId, request));
    }

    @PatchMapping("/facilities/{facilityId}/status")
    public ApiResponse<FacilityOverviewResponse> changeFacilityStatus(
            @PathVariable Long facilityId, @Valid @RequestBody FacilityStatusRequest request) {
        return ApiResponse.success(managementOpsService.changeFacilityStatus(facilityId, request));
    }

    @GetMapping("/reports")
    public ApiResponse<ReportSummary> report(@RequestParam(defaultValue = "month") String period,
                                            @RequestParam(required = false) Long facilityId) {
        return ApiResponse.success(managementOpsService.report(period, facilityId));
    }
}
