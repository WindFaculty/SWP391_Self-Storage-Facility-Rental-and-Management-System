package com.storage.facility.controller;
import com.storage.facility.domain.enums.UnitStatus;
import com.storage.facility.dto.FacilityDtos.*;
import com.storage.facility.service.FacilityService;
import com.storage.shared.response.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController public class FacilityController {
 private final FacilityService service; public FacilityController(FacilityService service) { this.service=service; }
 @GetMapping("/facilities") public ApiResponse<List<FacilityResponse>> list() { return ApiResponse.success(service.listFacilities()); }
 @GetMapping("/facilities/{facilityId}") public ApiResponse<FacilityResponse> get(@PathVariable UUID facilityId) { return ApiResponse.success(service.getFacility(facilityId)); }
 @GetMapping("/facilities/{facilityId}/unit-types") public ApiResponse<List<UnitTypeResponse>> types(@PathVariable UUID facilityId) { return ApiResponse.success(service.listUnitTypes(facilityId)); }
 @GetMapping("/facilities/{facilityId}/available-units") public ApiResponse<PageResponse<StorageUnitResponse>> available(@PathVariable UUID facilityId,@RequestParam(required=false) UUID unitTypeId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return ApiResponse.success(service.listAvailableUnits(facilityId,unitTypeId,page,size)); }
 @PostMapping("/business/facilities") public ResponseEntity<ApiResponse<FacilityResponse>> createFacility(@Valid @RequestBody FacilityRequest r) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.createFacility(r))); }
 @PutMapping("/business/facilities/{id}") public ApiResponse<FacilityResponse> updateFacility(@PathVariable UUID id,@Valid @RequestBody FacilityRequest r) { return ApiResponse.success(service.updateFacility(id,r)); }
 @PostMapping("/business/unit-types") public ResponseEntity<ApiResponse<UnitTypeResponse>> createType(@Valid @RequestBody UnitTypeRequest r) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.createUnitType(r))); }
 @PostMapping("/manager/facilities/{facilityId}/units") public ResponseEntity<ApiResponse<StorageUnitResponse>> createUnit(@PathVariable UUID facilityId,@Valid @RequestBody StorageUnitRequest r) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.createUnit(facilityId,r))); }
 @GetMapping("/manager/facilities/{facilityId}/units") public ApiResponse<PageResponse<StorageUnitResponse>> units(@PathVariable UUID facilityId,@RequestParam(required=false) UnitStatus status,@RequestParam(required=false) UUID unitTypeId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return ApiResponse.success(service.listUnits(facilityId,status,unitTypeId,page,size)); }
 @PutMapping("/manager/units/{id}/status") public ApiResponse<StorageUnitResponse> status(@PathVariable UUID id,@Valid @RequestBody StatusUpdateRequest r) { return ApiResponse.success(service.updateUnitStatus(id,r)); }
}
