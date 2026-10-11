package com.storage.management.service;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.management.dto.ManagementDtos.FacilityInputRequest;
import com.storage.management.dto.ManagementDtos.FacilityOverviewResponse;
import com.storage.management.dto.ManagementDtos.FacilityStatusRequest;
import com.storage.management.dto.ManagementDtos.FeeTypeResponse;
import com.storage.management.dto.ManagementDtos.FeeTypeUpdateRequest;
import com.storage.management.dto.ManagementDtos.PolicyRequest;
import com.storage.management.dto.ManagementDtos.PolicyResponse;
import com.storage.management.dto.ManagementDtos.FacilityReportRow;
import com.storage.management.dto.ManagementDtos.ReportSummary;
import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.FeeType;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.FeeTypeRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.repository.RentalRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.service.Analytics;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Business-manager workspace: policy, extra fee types, facility overview and the
 * report page consumed by frontend/src/features/management.
 */
@Service
public class ManagementOpsService {
    private final BusinessPolicyService policyService;
    private final BusinessPolicyRepository policies;
    private final FeeTypeRepository feeTypes;
    private final FacilityRepository facilities;
    private final StorageUnitRepository units;
    private final RentalRepository rentals;
    private final UserRepository users;
    private final Analytics analytics;

    public ManagementOpsService(BusinessPolicyService policyService,
                                BusinessPolicyRepository policies,
                                FeeTypeRepository feeTypes,
                                FacilityRepository facilities,
                                StorageUnitRepository units,
                                RentalRepository rentals,
                                UserRepository users,
                                Analytics analytics) {
        this.policyService = policyService;
        this.policies = policies;
        this.feeTypes = feeTypes;
        this.facilities = facilities;
        this.units = units;
        this.rentals = rentals;
        this.users = users;
        this.analytics = analytics;
    }

    @Transactional(readOnly = true)
    public PolicyResponse policy() {
        return withUpdatedByName(policies.findById(BusinessPolicy.ID)
                .orElseThrow(() -> new IllegalStateException("business policy is not configured")));
    }

    @Transactional
    public PolicyResponse updatePolicy(PolicyRequest request) {
        BusinessPolicy updated = policyService.setPolicy(request.depositPercent(),
                request.renewalNoticeDays(), request.cancellationFee(), request.returnNoticeDays(),
                request.overdueGraceDays(), request.overdueFeePerDay(),
                request.maxDiscountPercent(), SecurityUtils.requireCurrentUserId());
        return withUpdatedByName(updated);
    }

    @Transactional(readOnly = true)
    public List<FeeTypeResponse> feeTypes() {
        return feeTypes.findAll(Sort.by("id")).stream()
                .map(type -> new FeeTypeResponse(type.getId(), type.getCode(), type.getName(),
                        type.getDefaultAmount(), type.isActive()))
                .toList();
    }

    @Transactional
    public FeeTypeResponse updateFeeType(Long feeTypeId, FeeTypeUpdateRequest request) {
        FeeType feeType = feeTypes.findById(feeTypeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        feeType.setName(request.name().trim());
        feeType.setDefaultAmount(request.defaultAmount());
        feeType.setActive(request.active());
        return new FeeTypeResponse(feeType.getId(), feeType.getCode(), feeType.getName(),
                feeType.getDefaultAmount(), feeType.isActive());
    }

@Transactional(readOnly = true)
    public List<FacilityOverviewResponse> facilityOverviews() {
        List<Facility> all = facilities.findAll(Sort.by("name"));
        Stats stats = statsOf(all);
        return all.stream().map(facility -> toOverview(facility, stats)).toList();
    }

    @Transactional
    public FacilityOverviewResponse createFacility(FacilityInputRequest request) {
        String code = request.code().trim();
        if (facilities.existsByCode(code)) {
            throw new BusinessException(ErrorCode.FACILITY_CODE_EXISTS);
        }
        Facility facility = new Facility();
        facility.setCode(code);
        facility.setName(request.name().trim());
        facility.setAddress(request.address());
        facility.setStatus(FacilityStatus.ACTIVE);
        return toOverview(facilities.save(facility));
    }

    @Transactional
    public FacilityOverviewResponse updateFacility(Long facilityId, FacilityInputRequest request) {
        Facility facility = facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
        String code = request.code().trim();
        if (!facility.getCode().equals(code) && facilities.existsByCode(code)) {
            throw new BusinessException(ErrorCode.FACILITY_CODE_EXISTS);
        }
        facility.setCode(code);
        facility.setName(request.name().trim());
        facility.setAddress(request.address());
        return toOverview(facility);
    }

    @Transactional
    public FacilityOverviewResponse changeFacilityStatus(Long facilityId,
                                                         FacilityStatusRequest request) {
        Facility facility = facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
        FacilityStatus next = FacilityStatus.valueOf(request.status().toUpperCase(Locale.ROOT));
        if (next == FacilityStatus.INACTIVE && facility.getStatus() == FacilityStatus.ACTIVE) {
            long active = rentals.findByFacilityId(facilityId).stream()
                    .filter(rental -> rental.getStatus() == RentalStatus.ACTIVE
                            || rental.getStatus() == RentalStatus.RESERVED
                            || rental.getStatus() == RentalStatus.OVERDUE)
                    .count();
            if (active > 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Còn " + active + " hợp đồng hiệu lực, không thể tạm ngừng cơ sở");
            }
        }
        facility.setStatus(next);
        return toOverview(facility);
    }

@Transactional(readOnly = true)
    public ReportSummary report(String period, Long facilityId) {
        List<Facility> scoped = facilityId == null ? facilities.findAll(Sort.by("name"))
                : facilities.findAll(Sort.by("name")).stream()
                .filter(facility -> facility.getId().equals(facilityId)).toList();
        Stats stats = statsOf(scoped);

        long activeRentals = 0;
        long overdueRentals = 0;
        long unitTotal = 0;
        long unitOccupied = 0;
        List<FacilityReportRow> rows = new ArrayList<>();
        Map<String, BigDecimal> revenueByMonth = new HashMap<>();

        for (Facility facility : scoped) {
            List<StorageUnit> facilityUnits = stats.units(facility.getId());
            List<Rental> facilityRentals = stats.rentals(facility.getId());
            long occupied = facilityUnits.stream()
                    .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
            unitTotal += facilityUnits.size();
            unitOccupied += occupied;
            long facilityActive = Analytics.count(facilityRentals,
                    rental -> rental.getStatus() == RentalStatus.ACTIVE);
            long facilityOverdue = Analytics.count(facilityRentals,
                    rental -> rental.getStatus() == RentalStatus.OVERDUE);
            activeRentals += facilityActive;
            overdueRentals += facilityOverdue;

            Map<String, BigDecimal> facilityRevenue = analytics.paidByMonth(
                    facilityRentals.stream().map(Rental::getId).toList());
            facilityRevenue.forEach((month, amount) ->
                    revenueByMonth.merge(month, amount, BigDecimal::add));

            rows.add(new FacilityReportRow(facility.getId(), facility.getName(),
                    facilityUnits.size(), occupied, facilityUnits.size() - occupied,
                    Analytics.rate(occupied, facilityUnits.size()),
                    Analytics.sum(facilityRevenue), facilityActive, facilityOverdue));
        }

        return new ReportSummary(Analytics.sum(revenueByMonth),
                Analytics.rate(unitOccupied, unitTotal), activeRentals, overdueRentals,
                Analytics.window(revenueByMonth, monthsOf(period)), rows);
    }

    private static int monthsOf(String period) {
        return switch (period == null ? "month" : period) {
            case "month" -> 1;
            case "quarter" -> 3;
            case "halfYear" -> 6;
            default -> 12;
        };
    }

    /**
     * Per-facility units, rentals and manager name, loaded in one query each
     * regardless of how many facilities the page covers.
     */
    private record Stats(Map<Long, List<StorageUnit>> unitsByFacility,
                         Map<Long, List<Rental>> rentalsByFacility,
                         Map<Long, String> managerNames) {

        List<StorageUnit> units(Long facilityId) {
            return unitsByFacility.getOrDefault(facilityId, List.of());
        }

        List<Rental> rentals(Long facilityId) {
            return rentalsByFacility.getOrDefault(facilityId, List.of());
        }

        String manager(Long facilityId) {
            return managerNames.get(facilityId);
        }
    }

    private Stats statsOf(List<Facility> scope) {
        List<Long> ids = scope.stream().map(Facility::getId).toList();
        if (ids.isEmpty()) {
            return new Stats(Map.of(), Map.of(), Map.of());
        }
        Map<Long, List<StorageUnit>> unitsByFacility = units.findByFacilityIdIn(ids).stream()
                .collect(Collectors.groupingBy(unit -> unit.getFacility().getId()));
        Map<Long, Long> facilityOfUnit = new HashMap<>();
        unitsByFacility.values().forEach(list ->
                list.forEach(unit -> facilityOfUnit.put(unit.getId(), unit.getFacility().getId())));
        Map<Long, List<Rental>> rentalsByFacility = rentals.findByFacilityIdIn(ids).stream()
                .filter(rental -> facilityOfUnit.containsKey(rental.getUnitId()))
                .collect(Collectors.groupingBy(rental -> facilityOfUnit.get(rental.getUnitId())));
        Map<Long, String> managerNames =
                users.findByFacilityIdInAndRoleInAndStatus(ids, List.of(UserRole.FACILITY_MANAGER),
                                UserStatus.ACTIVE).stream()
                        .filter(user -> user.getFacilityId() != null)
                        .collect(Collectors.toMap(User::getFacilityId, User::getFullName,
                                (first, second) -> first));
        return new Stats(unitsByFacility, rentalsByFacility, managerNames);
    }

    private FacilityOverviewResponse toOverview(Facility facility) {
        return toOverview(facility, statsOf(List.of(facility)));
    }

    private FacilityOverviewResponse toOverview(Facility facility, Stats stats) {
        List<StorageUnit> facilityUnits = stats.units(facility.getId());
        List<Rental> facilityRentals = stats.rentals(facility.getId());
        long occupied = facilityUnits.stream()
                .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
        return new FacilityOverviewResponse(facility.getId(), facility.getCode(),
                facility.getName(), facility.getAddress(), facility.getStatus().name(),
                stats.manager(facility.getId()), facilityUnits.size(), occupied,
                Analytics.rate(occupied, facilityUnits.size()),
                Analytics.count(facilityRentals, rental -> rental.getStatus() == RentalStatus.ACTIVE),
                Analytics.count(facilityRentals, rental -> rental.getStatus() == RentalStatus.OVERDUE));
    }

    private PolicyResponse withUpdatedByName(BusinessPolicy policy) {
        String updatedBy = policy.getUpdatedByUserId() == null ? null
                : users.findById(policy.getUpdatedByUserId()).map(User::getFullName).orElse(null);
        return PolicyResponse.from(policy, updatedBy);
    }
}
