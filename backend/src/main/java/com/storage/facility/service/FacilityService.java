package com.storage.facility.service;

import com.storage.facility.dto.FacilityDtos.FacilityRequest;
import com.storage.facility.dto.FacilityDtos.FacilityResponse;
import com.storage.facility.dto.FacilityDtos.StorageUnitRequest;
import com.storage.facility.dto.FacilityDtos.StorageUnitResponse;
import com.storage.facility.dto.FacilityDtos.UnitStatusRequest;
import com.storage.facility.dto.FacilityDtos.UnitTypeRequest;
import com.storage.facility.dto.FacilityDtos.UnitTypeResponse;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.facility.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FacilityService {

    private final FacilityRepository facilities;
    private final UnitTypeRepository unitTypes;
    private final StorageUnitRepository units;
    private final FacilityAccessService access;

    public FacilityService(FacilityRepository facilities,
                           UnitTypeRepository unitTypes,
                           StorageUnitRepository units,
                           FacilityAccessService access) {
        this.facilities = facilities;
        this.unitTypes = unitTypes;
        this.units = units;
        this.access = access;
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

    @Transactional
    public FacilityResponse createFacility(FacilityRequest request) {
        String code = request.code().trim();
        if (facilities.existsByCode(code)) {
            throw new BusinessException(ErrorCode.FACILITY_CODE_EXISTS);
        }
        Facility facility = new Facility();
        request.applyTo(facility);
        return FacilityResponse.from(facilities.save(facility));
    }

    @Transactional
    public FacilityResponse updateFacility(Long facilityId, FacilityRequest request) {
        Facility facility = facility(facilityId);
        String code = request.code().trim();
        if (!facility.getCode().equals(code) && facilities.existsByCode(code)) {
            throw new BusinessException(ErrorCode.FACILITY_CODE_EXISTS);
        }
        request.applyTo(facility);
        return FacilityResponse.from(facility);
    }

    @Transactional
    public UnitTypeResponse createUnitType(UnitTypeRequest request) {
        String name = request.name().trim();
        if (unitTypes.existsByName(name)) {
            throw new BusinessException(ErrorCode.UNIT_TYPE_NAME_EXISTS);
        }
        if (request.minMonthlyPrice().compareTo(request.maxMonthlyPrice()) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Giá tối thiểu không được lớn hơn giá tối đa");
        }
        UnitType unitType = new UnitType();
        unitType.setName(name);
        unitType.setSizeM2(request.sizeM2());
        unitType.setMinMonthlyPrice(request.minMonthlyPrice());
        unitType.setMaxMonthlyPrice(request.maxMonthlyPrice());
        unitType.setDescription(request.description());
        return UnitTypeResponse.from(unitTypes.save(unitType));
    }

    @Transactional(readOnly = true)
    public List<UnitTypeResponse> listUnitTypes(Long facilityId) {
        facility(facilityId);
        return unitTypes.findAll(Sort.by("name")).stream().map(UnitTypeResponse::from).toList();
    }

    @Transactional
    public StorageUnitResponse createUnit(Long facilityId, StorageUnitRequest request) {
        access.requireFacilityAccess(facilityId);
        Facility facility = facility(facilityId);
        String unitCode = request.unitCode().trim();
        if (units.existsByFacilityIdAndUnitCode(facilityId, unitCode)) {
            throw new BusinessException(ErrorCode.STORAGE_UNIT_CODE_EXISTS);
        }
        UnitType unitType = unitTypes.findById(request.unitTypeId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND));
        if (request.monthlyPrice().compareTo(unitType.getMinMonthlyPrice()) < 0
                || request.monthlyPrice().compareTo(unitType.getMaxMonthlyPrice()) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Giá kho phải nằm trong khoảng giá của loại kho");
        }
        StorageUnit unit = new StorageUnit();
        unit.setFacility(facility);
        unit.setUnitType(unitType);
        unit.setUnitCode(unitCode);
        unit.setLocationLabel(request.locationLabel());
        unit.setMonthlyPrice(request.monthlyPrice());
        unit.setStatus(StorageUnitStatus.AVAILABLE);
        return StorageUnitResponse.from(units.save(unit));
    }

    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> listUnits(Long facilityId, StorageUnitStatus status,
                                                       Long unitTypeId, int page, int size) {
        access.requireFacilityAccess(facilityId);
        facility(facilityId);
        Page<StorageUnitResponse> result = units.search(facilityId, status, unitTypeId, pageable(page, size))
                .map(StorageUnitResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> listAvailableUnits(Long facilityId, Long unitTypeId,
                                                               int page, int size) {
        facility(facilityId);
        Page<StorageUnitResponse> result = units.search(facilityId, StorageUnitStatus.AVAILABLE, unitTypeId,
                        pageable(page, size))
                .map(StorageUnitResponse::from);
        return PageResponse.from(result);
    }

    @Transactional
    public StorageUnitResponse updateUnitStatus(Long unitId, UnitStatusRequest request) {
        StorageUnit unit = units.findById(unitId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        access.requireFacilityAccess(unit.getFacility().getId());
        UnitStatusTransitionValidator.validate(unit.getStatus(), request.status());
        unit.setStatus(request.status());
        return StorageUnitResponse.from(unit);
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("unitCode"));
    }

    private Facility facility(Long facilityId) {
        return facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
    }
}
