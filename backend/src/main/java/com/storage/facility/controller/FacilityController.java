package com.storage.facility.controller;

import com.storage.facility.dto.CatalogDtos.FacilityResponse;
import com.storage.facility.dto.CatalogDtos.UnitTypeResponse;
import com.storage.facility.service.FacilityService;
import com.storage.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public catalog reads for FE1. Writes live under /management and /ops.
 */
@RestController
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping("/facilities")
    public ApiResponse<List<FacilityResponse>> listFacilities() {
        return ApiResponse.success(facilityService.listFacilities());
    }

    @GetMapping("/facilities/{facilityId}")
    public ApiResponse<FacilityResponse> getFacility(@PathVariable Long facilityId) {
        return ApiResponse.success(facilityService.getFacility(facilityId));
    }

    @GetMapping("/facilities/{facilityId}/unit-types")
    public ApiResponse<List<UnitTypeResponse>> listUnitTypes(@PathVariable Long facilityId) {
        return ApiResponse.success(facilityService.listUnitTypes(facilityId));
    }
}
