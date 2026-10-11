package com.storage.facility.service;

import com.storage.facility.dto.CatalogDtos.AvailabilityResponse;
import com.storage.facility.dto.CatalogDtos.CatalogUnitTypeResponse;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.repository.RentalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

/**
 * Availability for the public catalog: a unit is bookable for a [start, end)
 * window when its physical state allows a new rental and no
 * availability-blocking rental overlaps the window (plan section 7.1).
 */
@Service
public class CatalogService {

    private static final List<RentalStatus> BLOCKING =
            List.copyOf(EnumSet.of(RentalStatus.PENDING_PAYMENT, RentalStatus.RESERVED,
                    RentalStatus.ACTIVE, RentalStatus.OVERDUE, RentalStatus.RETURN_REQUESTED));

    private final UnitTypeRepository unitTypes;
    private final FacilityRepository facilities;
    private final StorageUnitRepository units;
    private final RentalRepository rentals;
    private final com.storage.rental.service.RentalService rentalService;

    public CatalogService(UnitTypeRepository unitTypes,
                          FacilityRepository facilities,
                          StorageUnitRepository units,
                          RentalRepository rentals,
                          com.storage.rental.service.RentalService rentalService) {
        this.unitTypes = unitTypes;
        this.facilities = facilities;
        this.units = units;
        this.rentals = rentals;
        this.rentalService = rentalService;
    }

    @Transactional(readOnly = true)
    public List<CatalogUnitTypeResponse> listUnitTypes() {
        return unitTypes.findAll(org.springframework.data.domain.Sort.by("name")).stream()
                .map(CatalogUnitTypeResponse::from)
                .toList();
    }

    // Writable on purpose: the inline hold sweep below has to commit as part of
    // this transaction, which a readOnly flush mode would silently drop.
    @Transactional
    public List<AvailabilityResponse> availability(Long facilityId, LocalDate startDate,
                                                    LocalDate endDate) {
        // Expire stale holds first so an unpaid hold no longer hides a free slot.
        rentalService.expireStaleHolds();
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate");
        }
        List<Long> facilityIds = facilityId == null
                ? facilities.findAll().stream().map(com.storage.facility.entity.Facility::getId).toList()
                : List.of(facilityId);

        return facilityIds.stream()
                .flatMap(id -> availabilityForFacility(id, startDate, endDate).stream())
                .toList();
    }

    private List<AvailabilityResponse> availabilityForFacility(Long facilityId, LocalDate startDate,
                                                               LocalDate endDate) {
        Map<Long, Long> available = new java.util.HashMap<>();
        for (StorageUnitRepository.UnitTypeAvailability row :
                units.countAvailableByFacility(facilityId, null, startDate, endDate, BLOCKING)) {
            available.merge(row.getUnitTypeId(), row.getAvailableCount(), Long::sum);
        }
        Map<Long, Long> total = new java.util.HashMap<>();
        for (StorageUnitRepository.UnitTotalCount row : units.countTotalByFacility(facilityId, null)) {
            total.merge(row.getUnitTypeId(), row.getTotalCount(), Long::sum);
        }
        return total.entrySet().stream()
                .map(entry -> new AvailabilityResponse(facilityId, entry.getKey(),
                        available.getOrDefault(entry.getKey(), 0L).intValue(),
                        entry.getValue().intValue()))
                .toList();
    }
}
