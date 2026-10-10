package com.storage.facility.controller;

import com.storage.facility.dto.FacilityDtos.FacilityRequest;
import com.storage.facility.dto.FacilityDtos.FacilityResponse;
import com.storage.facility.dto.FacilityDtos.StorageUnitRequest;
import com.storage.facility.dto.FacilityDtos.StorageUnitResponse;
import com.storage.facility.dto.FacilityDtos.UnitStatusRequest;
import com.storage.facility.dto.FacilityDtos.UnitTypeRequest;
import com.storage.facility.dto.FacilityDtos.UnitTypeResponse;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.facility.service.FacilityService;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping("/facilities/{facilityId}/available-units")
    public ApiResponse<PageResponse<StorageUnitResponse>> listAvailableUnits(
            @PathVariable Long facilityId,
            @RequestParam(required = false) Long unitTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(facilityService.listAvailableUnits(facilityId, unitTypeId, page, size));
    }

    @PostMapping("/business/facilities")
    public ResponseEntity<ApiResponse<FacilityResponse>> createFacility(
            @Valid @RequestBody FacilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(facilityService.createFacility(request)));
    }

    @PutMapping("/business/facilities/{facilityId}")
    public ApiResponse<FacilityResponse> updateFacility(@PathVariable Long facilityId,
                                                        @Valid @RequestBody FacilityRequest request) {
        return ApiResponse.success(facilityService.updateFacility(facilityId, request));
    }

    @PostMapping("/business/unit-types")
    public ResponseEntity<ApiResponse<UnitTypeResponse>> createUnitType(
            @Valid @RequestBody UnitTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(facilityService.createUnitType(request)));
    }

    @PostMapping("/manager/facilities/{facilityId}/units")
    public ResponseEntity<ApiResponse<StorageUnitResponse>> createUnit(
            @PathVariable Long facilityId,
            @Valid @RequestBody StorageUnitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(facilityService.createUnit(facilityId, request)));
    }

    @GetMapping("/manager/facilities/{facilityId}/units")
    public ApiResponse<PageResponse<StorageUnitResponse>> listUnits(
            @PathVariable Long facilityId,
            @RequestParam(required = false) StorageUnitStatus status,
            @RequestParam(required = false) Long unitTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(facilityService.listUnits(facilityId, status, unitTypeId, page, size));
    }

    @PutMapping("/manager/units/{unitId}/status")
    public ApiResponse<StorageUnitResponse> updateUnitStatus(@PathVariable Long unitId,
                                                             @Valid @RequestBody UnitStatusRequest request) {
        return ApiResponse.success(facilityService.updateUnitStatus(unitId, request));
    }
}
