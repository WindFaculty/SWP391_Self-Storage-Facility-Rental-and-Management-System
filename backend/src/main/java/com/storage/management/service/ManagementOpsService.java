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
import com.storage.management.dto.ManagementDtos.RevenuePoint;
import com.storage.management.dto.ManagementDtos.FacilityReportRow;
import com.storage.management.dto.ManagementDtos.ReportSummary;
import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.FeeType;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.FeeTypeRepository;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.repository.RentalRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Business-manager workspace: policy, extra fee types, facility overview and the
 * report page consumed by frontend/src/features/management.
 */
@Service
public class ManagementOpsService {

    private static final short POLICY_ID = 1;
    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MM/yyyy", Locale.forLanguageTag("vi"));

    private final BusinessPolicyService policyService;
    private final BusinessPolicyRepository policies;
    private final FeeTypeRepository feeTypes;
    private final FacilityRepository facilities;
    private final StorageUnitRepository units;
    private final RentalRepository rentals;
    private final InvoiceRepository invoices;
    private final PaymentAttemptRepository paymentAttempts;
    private final UserRepository users;

    public ManagementOpsService(BusinessPolicyService policyService,
                                BusinessPolicyRepository policies,
                                FeeTypeRepository feeTypes,
                                FacilityRepository facilities,
                                StorageUnitRepository units,
                                RentalRepository rentals,
                                InvoiceRepository invoices,
                                PaymentAttemptRepository paymentAttempts,
                                UserRepository users) {
        this.policyService = policyService;
        this.policies = policies;
        this.feeTypes = feeTypes;
        this.facilities = facilities;
        this.units = units;
        this.rentals = rentals;
        this.invoices = invoices;
        this.paymentAttempts = paymentAttempts;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public PolicyResponse policy() {
        return withUpdatedByName(policies.findById(POLICY_ID)
                .orElseThrow(() -> new IllegalStateException("business policy is not configured")));
    }

    @Transactional
    public PolicyResponse updatePolicy(PolicyRequest request) {
        Long actorId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        BusinessPolicy updated = policyService.setPolicy(request.depositPercent(),
                request.renewalNoticeDays(), request.cancellationFee(), request.returnNoticeDays(),
                request.overdueGraceDays(), request.overdueFeePerDay(),
                request.maxDiscountPercent(), actorId);
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
        return facilities.findAll(Sort.by("name")).stream()
                .map(this::toOverview)
                .toList();
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

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long activeRentals = 0;
        long overdueRentals = 0;
        long unitTotal = 0;
        long unitOccupied = 0;
        List<RevenuePoint> revenuePoints = new ArrayList<>();
        List<FacilityReportRow> rows = new ArrayList<>();
        Map<String, BigDecimal> revenueByMonth = new HashMap<>();

        for (Facility facility : scoped) {
            List<StorageUnit> facilityUnits = units.findByFacilityId(facility.getId());
            List<Rental> facilityRentals = rentals.findByFacilityId(facility.getId());
            long occupied = facilityUnits.stream()
                    .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
            unitTotal += facilityUnits.size();
            unitOccupied += occupied;
            activeRentals += facilityRentals.stream()
                    .filter(rental -> rental.getStatus() == RentalStatus.ACTIVE).count();
            overdueRentals += facilityRentals.stream()
                    .filter(rental -> rental.getStatus() == RentalStatus.OVERDUE).count();

            BigDecimal revenue = revenueOf(facility.getId(), revenueByMonth);
            totalRevenue = totalRevenue.add(revenue);
            rows.add(new FacilityReportRow(facility.getId(), facility.getName(),
                    facilityUnits.size(), occupied,
                    facilityUnits.size() - occupied, rate(occupied, facilityUnits.size()),
                    revenue, activeRentalsOf(facilityRentals),
                    overdueRentalsOf(facilityRentals)));
        }

        revenuePoints = monthsOf(period, revenueByMonth);
        return new ReportSummary(totalRevenue, rate(unitOccupied, unitTotal), activeRentals,
                overdueRentals, revenuePoints, rows);
    }

    private BigDecimal revenueOf(Long facilityId, Map<String, BigDecimal> revenueByMonth) {
        List<Long> rentalIds = rentals.findByFacilityId(facilityId).stream()
                .map(Rental::getId).toList();
        if (rentalIds.isEmpty()) {
            return BigDecimal.ZERO;
        }
        List<Long> invoiceIds = invoices.findByRentalIdIn(rentalIds).stream()
                .map(Invoice::getId).toList();
        if (invoiceIds.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (PaymentAttemptRepository.MonthlyAmount row :
                paymentAttempts.summarizePaidByMonth(invoiceIds)) {
            BigDecimal amount = row.getTotal();
            total = total.add(amount);
            String key = "%04d-%02d".formatted(row.getYear(), row.getMonth());
            revenueByMonth.merge(key, amount, BigDecimal::add);
        }
        return total;
    }

    private static List<RevenuePoint> monthsOf(String period, Map<String, BigDecimal> byMonth) {
        int months = switch (period == null ? "month" : period) {
            case "month" -> 1;
            case "quarter" -> 3;
            case "halfYear" -> 6;
            default -> 12;
        };
        YearMonth cursor = YearMonth.now(ZoneOffset.UTC).minusMonths(months - 1L);
        List<RevenuePoint> points = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            String key = "%04d-%02d".formatted(cursor.getYear(), cursor.getMonthValue());
            points.add(new RevenuePoint(key, cursor.format(MONTH_LABEL),
                    byMonth.getOrDefault(key, BigDecimal.ZERO)));
            cursor = cursor.plusMonths(1);
        }
        return points;
    }

    private FacilityOverviewResponse toOverview(Facility facility) {
        List<StorageUnit> facilityUnits = units.findByFacilityId(facility.getId());
        List<Rental> facilityRentals = rentals.findByFacilityId(facility.getId());
        long occupied = facilityUnits.stream()
                .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
        String managerName = users.findByFacilityIdAndRoleInAndStatus(facility.getId(),
                        List.of(UserRole.FACILITY_MANAGER), UserStatus.ACTIVE).stream()
                .findFirst().map(User::getFullName).orElse(null);
        return new FacilityOverviewResponse(facility.getId(), facility.getCode(),
                facility.getName(), facility.getAddress(), facility.getStatus().name(),
                managerName, facilityUnits.size(), occupied, rate(occupied, facilityUnits.size()),
                activeRentalsOf(facilityRentals), overdueRentalsOf(facilityRentals));
    }

    private static long activeRentalsOf(List<Rental> rentals) {
        return rentals.stream().filter(rental -> rental.getStatus() == RentalStatus.ACTIVE).count();
    }

    private static long overdueRentalsOf(List<Rental> rentals) {
        return rentals.stream().filter(rental -> rental.getStatus() == RentalStatus.OVERDUE)
                .count();
    }

    private PolicyResponse withUpdatedByName(BusinessPolicy policy) {
        String updatedBy = policy.getUpdatedByUserId() == null ? null
                : users.findById(policy.getUpdatedByUserId()).map(User::getFullName).orElse(null);
        return PolicyResponse.from(policy, updatedBy);
    }

    private static double rate(long part, long total) {
        return total == 0 ? 0d : BigDecimal.valueOf(part).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP).doubleValue();
    }
}
