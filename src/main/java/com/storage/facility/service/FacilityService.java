package com.storage.facility.service;

import com.storage.facility.domain.entity.*;
import com.storage.facility.domain.enums.UnitStatus;
import com.storage.facility.dto.FacilityDtos.*;
import com.storage.facility.repository.*;
import com.storage.shared.exception.*;
import com.storage.shared.response.PageResponse;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class FacilityService {
    private final FacilityRepository facilities; private final UnitTypeRepository unitTypes;
    private final StorageUnitRepository units; private final FacilityAccessService access;
    public FacilityService(FacilityRepository facilities, UnitTypeRepository unitTypes, StorageUnitRepository units, FacilityAccessService access) {
        this.facilities = facilities; this.unitTypes = unitTypes; this.units = units; this.access = access;
    }
    @Transactional(readOnly = true) public List<FacilityResponse> listFacilities() { return facilities.findByStatusOrderByNameAsc(FacilityStatus.ACTIVE).stream().map(this::facilityResponse).toList(); }
    @Transactional(readOnly = true) public FacilityResponse getFacility(UUID id) { return facilityResponse(facility(id)); }
    public FacilityResponse createFacility(FacilityRequest r) { access.requireBusinessManager(); Facility f = new Facility(); copy(f, r); return facilityResponse(facilities.save(f)); }
    public FacilityResponse updateFacility(UUID id, FacilityRequest r) { access.requireBusinessManager(); Facility f = facility(id); copy(f, r); return facilityResponse(f); }
    public UnitTypeResponse createUnitType(UnitTypeRequest r) { access.requireBusinessManager(); if (r.minMonthlyPrice().compareTo(r.maxMonthlyPrice()) > 0) throw new BusinessException(ErrorCode.BAD_REQUEST, "Giá tối thiểu không được lớn hơn giá tối đa"); UnitType t = new UnitType(); copy(t, r); return unitTypeResponse(unitTypes.save(t)); }
    @Transactional(readOnly = true) public List<UnitTypeResponse> listUnitTypes(UUID facilityId) { facility(facilityId); return unitTypes.findAll(Sort.by("name")).stream().map(this::unitTypeResponse).toList(); }
    public StorageUnitResponse createUnit(UUID facilityId, StorageUnitRequest r) { access.requireFacilityAccess(facilityId); if (units.existsByFacility_IdAndCode(facilityId, r.code())) throw new BusinessException(ErrorCode.STORAGE_UNIT_CODE_EXISTS); UnitType type = unitTypes.findById(r.unitTypeId()).orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND)); price(r.monthlyPrice(), type); StorageUnit u = new StorageUnit(); u.setFacility(facility(facilityId)); u.setUnitType(type); u.setCode(r.code()); u.setFloor(r.floor()); u.setLocation(r.location()); u.setMonthlyPrice(r.monthlyPrice()); return unitResponse(units.save(u)); }
    @Transactional(readOnly = true) public PageResponse<StorageUnitResponse> listUnits(UUID facilityId, UnitStatus status, UUID unitTypeId, int page, int size) { facility(facilityId); Page<StorageUnitResponse> result = units.search(facilityId, status, unitTypeId, pageable(page,size)).map(this::unitResponse); return PageResponse.from(result); }
    @Transactional(readOnly = true) public PageResponse<StorageUnitResponse> listAvailableUnits(UUID facilityId, UUID unitTypeId, int page, int size) { return listUnits(facilityId, UnitStatus.AVAILABLE, unitTypeId, page, size); }
    public StorageUnitResponse updateUnitStatus(UUID id, StatusUpdateRequest r) { StorageUnit u = units.findById(id).orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND)); access.requireFacilityAccess(u.getFacility().getId()); UnitStatusTransitionValidator.validate(u.getStatus(), r.status()); u.setStatus(r.status()); return unitResponse(u); }
    private Pageable pageable(int page, int size) { return PageRequest.of(Math.max(page,0), Math.min(Math.max(size,1),100), Sort.by("code")); }
    private Facility facility(UUID id) { return facilities.findById(id).orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND)); }
    private void copy(Facility f, FacilityRequest r) { f.setName(r.name()); f.setAddress(r.address()); f.setPhone(r.phone()); f.setDescription(r.description()); f.setStatus(r.status() == null ? FacilityStatus.ACTIVE : r.status()); }
    private void copy(UnitType t, UnitTypeRequest r) { t.setName(r.name()); t.setWidth(r.width()); t.setLength(r.length()); t.setHeight(r.height()); t.setDescription(r.description()); t.setMinMonthlyPrice(r.minMonthlyPrice()); t.setMaxMonthlyPrice(r.maxMonthlyPrice()); }
    private void price(BigDecimal amount, UnitType t) { if (amount.compareTo(t.getMinMonthlyPrice()) < 0 || amount.compareTo(t.getMaxMonthlyPrice()) > 0) throw new BusinessException(ErrorCode.BAD_REQUEST, "Giá kho phải nằm trong khoảng giá của loại kho"); }
    private FacilityResponse facilityResponse(Facility f) { return new FacilityResponse(f.getId(), f.getName(), f.getAddress(), f.getPhone(), f.getDescription(), f.getStatus()); }
    private UnitTypeResponse unitTypeResponse(UnitType t) { return new UnitTypeResponse(t.getId(), t.getName(), t.getWidth(), t.getLength(), t.getHeight(), t.getDescription(), t.getMinMonthlyPrice(), t.getMaxMonthlyPrice()); }
    private StorageUnitResponse unitResponse(StorageUnit u) { return new StorageUnitResponse(u.getId(),u.getFacility().getId(),u.getUnitType().getId(),u.getUnitType().getName(),u.getCode(),u.getFloor(),u.getLocation(),u.getMonthlyPrice(),u.getStatus()); }
}
