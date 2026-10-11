package com.storage.facility.service;

import com.storage.facility.dto.CatalogDtos.FacilityResponse;
import com.storage.facility.dto.CatalogDtos.UnitTypeResponse;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.exception.ErrorCode;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Public catalog reads for FE1. Facility/unit writes live in
 * ManagementOpsService (/management/facilities) and OpsService (/ops/units).
 */
@Service
public class FacilityService {

    private final FacilityRepository facilities;
    private final UnitTypeRepository unitTypes;

    public FacilityService(FacilityRepository facilities, UnitTypeRepository unitTypes) {
        this.facilities = facilities;
        this.unitTypes = unitTypes;
    }

    @Transactional(readOnly = true)
    public List<FacilityResponse> listFacilities() {
        return facilities.findByStatusOrderByNameAsc(FacilityStatus.ACTIVE).stream()
                .map(FacilityResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacilityResponse getFacility(Long facilityId) {
        return FacilityResponse.from(facility(facilityId));
    }

    @Transactional(readOnly = true)
    public List<UnitTypeResponse> listUnitTypes(Long facilityId) {
        facility(facilityId);
        return unitTypes.findAll(Sort.by("name")).stream().map(UnitTypeResponse::from).toList();
    }

    private Facility facility(Long facilityId) {
        return facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
    }
}
