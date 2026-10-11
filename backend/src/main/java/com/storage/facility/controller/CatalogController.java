package com.storage.facility.controller;

import com.storage.facility.dto.CatalogDtos.AvailabilityResponse;
import com.storage.facility.dto.CatalogDtos.CatalogUnitTypeResponse;
import com.storage.facility.service.CatalogService;
import com.storage.shared.response.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Public catalog endpoints consumed by the FE1 adapters in
 * frontend/src/features/catalog/api/catalogApi.ts. Facilities and per-facility
 * unit types already live in FacilityController; only the endpoints that need
 * rental-aware availability live here.
 */
@RestController
@RequestMapping
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/unit-types")
    public ApiResponse<List<CatalogUnitTypeResponse>> unitTypes() {
        return ApiResponse.success(catalogService.listUnitTypes());
    }

    @GetMapping("/availability")
    public ApiResponse<List<AvailabilityResponse>> availability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long facilityId) {
        return ApiResponse.success(
                catalogService.availability(facilityId, startDate, endDate));
    }
}
