package com.storage.rental.service;

import com.storage.account.repository.UserRepository;
import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.rental.dto.RentalDtos;
import com.storage.rental.dto.RentalDtos.HoldRequest;
import com.storage.rental.dto.RentalDtos.HoldResponse;
import com.storage.rental.dto.RentalDtos.InvoiceSummary;
import com.storage.rental.dto.RentalDtos.RenewalRequest;
import com.storage.rental.dto.RentalDtos.RenewalResponse;
import com.storage.rental.dto.RentalDtos.RentalResponse;
import com.storage.rental.dto.RentalDtos.ReturnRequest;
import com.storage.rental.dto.RentalDtos.ReturnResponse;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalRenewal;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskType;
import com.storage.rental.repository.RentalRenewalRepository;
import com.storage.rental.repository.RentalRepository;
import com.storage.rental.repository.StaffTaskRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Customer rental lifecycle: hold -> (payment handled elsewhere) -> renewal ->
 * return request. Availability is decided against the database, not in memory,
 * and the chosen unit row is locked before the overlap re-check so concurrent
 * holds cannot double-book the same unit.
 */
@Service
public class RentalService {

    private static final Set<RentalStatus> AVAILABILITY_BLOCKING =
            EnumSet.of(RentalStatus.PENDING_PAYMENT, RentalStatus.RESERVED, RentalStatus.ACTIVE,
                    RentalStatus.OVERDUE, RentalStatus.RETURN_REQUESTED);
    private static final java.time.Duration HOLD_WINDOW = java.time.Duration.ofMinutes(15);
    private static final int HOLD_CANDIDATES = 25;

    private final RentalRepository rentals;
    private final RentalRenewalRepository renewals;
    private final StaffTaskRepository staffTasks;
    private final InvoiceRepository invoices;
    private final BusinessPolicyRepository policies;
    private final UnitTypeRepository unitTypes;
    private final FacilityRepository facilities;
    private final StorageUnitRepository units;
    private final UserRepository users;

    public RentalService(RentalRepository rentals,
                         RentalRenewalRepository renewals,
                         StaffTaskRepository staffTasks,
                         InvoiceRepository invoices,
                         BusinessPolicyRepository policies,
                         UnitTypeRepository unitTypes,
                         FacilityRepository facilities,
                         StorageUnitRepository units,
                         UserRepository users) {
        this.rentals = rentals;
        this.renewals = renewals;
        this.staffTasks = staffTasks;
        this.invoices = invoices;
        this.policies = policies;
        this.unitTypes = unitTypes;
        this.facilities = facilities;
        this.units = units;
        this.users = users;
    }

    @Transactional
    public HoldResponse createHold(Long customerId, HoldRequest request) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (request.startDate().isBefore(today)) {
throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Ngày bắt đầu không được trước quá khứ");
        }
        LocalDate endDate = request.startDate().plusMonths(request.rentalMonths());
        UnitType unitType = unitType(request.unitTypeId());
        Facility facility = facility(request.facilityId());
        if (facility.getStatus() != FacilityStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Cơ sở kho đang tạm ngừng hoạt động, không thể đặt chỗ");
        }

        StorageUnit unit = assignUnit(facility.getId(), unitType.getId(), request.startDate(), endDate);

        Rental hold = Rental.createHold(customerId, unit.getId(), request.startDate(), endDate,
                unit.getMonthlyPrice(), Instant.now().plus(HOLD_WINDOW));
        Rental saved = rentals.save(hold);

        BigDecimal deposit = depositOf(unit.getMonthlyPrice(), request.rentalMonths());
        BigDecimal rent = unit.getMonthlyPrice().multiply(BigDecimal.valueOf(request.rentalMonths()));
        Invoice invoice = invoices.save(Invoice.create(Invoice.Type.RENTAL, saved.getId(), null, null,
                "Tiền đặt kho " + unit.getUnitCode() + " (" + request.rentalMonths() + " tháng)",
                rent.add(deposit), BigDecimal.ZERO, saved.getPaymentExpiresAt()));

        return new HoldResponse(toResponse(saved, enrich(saved)), toSummary(invoice, rent, deposit));
    }

    @Transactional
    public void cancel(Long customerId, Long rentalId, String reason) {
        Rental rental = ownedRental(customerId, rentalId);
        if (rental.getStatus() != RentalStatus.PENDING_PAYMENT
                && rental.getStatus() != RentalStatus.RESERVED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ hủy được hợp đồng đang chờ thanh toán hoặc đã giữ chỗ");
        }
        rental.transitionTo(RentalStatus.CANCELLED);
        expirePendingInvoices(rental.getId());
    }

    @Transactional
    public RenewalResponse requestRenewal(Long customerId, Long rentalId, RenewalRequest request) {
        Rental rental = ownedRental(customerId, rentalId);
        if (rental.getStatus() != RentalStatus.ACTIVE && rental.getStatus() != RentalStatus.OVERDUE) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ được gia hạn hợp đồng đang hoạt động hoặc quá hạn");
        }
        LocalDate newEnd = rental.getEndDate().plusMonths(request.additionalMonths());
        assertUnitFree(rental.getUnitId(), rental.getEndDate(), newEnd, rental.getId());

        RentalRenewal renewal = RentalRenewal.request(rental, newEnd, Instant.now());
        renewals.save(renewal);

        BigDecimal amount = rental.getPricePerMonth()
                .multiply(BigDecimal.valueOf(request.additionalMonths()));
        Invoice invoice = invoices.save(Invoice.create(Invoice.Type.RENEWAL, rental.getId(),
                renewal.getId(), null, "Gia hạn hợp đồng thêm " + request.additionalMonths() + " tháng",
                amount, BigDecimal.ZERO, newEnd.atStartOfDay(ZoneOffset.UTC).toInstant()));

        return new RenewalResponse(toResponse(rental, enrich(rental)),
                toSummary(invoice, amount, BigDecimal.ZERO));
    }

    @Transactional
    public ReturnResponse requestReturn(Long customerId, Long rentalId, ReturnRequest request) {
        Rental rental = ownedRental(customerId, rentalId);
        if (rental.getStatus() != RentalStatus.ACTIVE && rental.getStatus() != RentalStatus.OVERDUE) {
throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ được yêu cầu trả kho khi hợp đồng đang hoạt động hoặc quá hạn");
        }
        StorageUnit unit = units.findById(rental.getUnitId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        Long staffId = firstStaffOf(unit.getFacility().getId());
        if (staffId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chưa có nhân viên kho nào trực để kiểm tra kho");
        }

        LocalDate requested = request.requestedDate() == null ? rental.getEndDate() : request.requestedDate();
        if (requested.isBefore(rental.getStartDate())) {
throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Ngày yêu cầu trả kho không được trước ngày bắt đầu hợp đồng");
        }
        rental.setAppointmentAt(requested.atStartOfDay(ZoneOffset.UTC).toInstant());
        rental.transitionTo(RentalStatus.RETURN_REQUESTED);

        StaffTask task = new StaffTask(staffId, rental.getId(), null, TaskType.RETURN_INSPECTION,
                requested.atStartOfDay(ZoneOffset.UTC).toInstant());
        staffTasks.save(task);

        return new ReturnResponse(toResponse(rental, enrich(rental)));
    }

    @Transactional
    public List<RentalResponse> listMine(Long customerId) {
        expireStaleHolds();
        return rentals.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(rental -> toResponse(rental, enrich(rental)))
                .toList();
    }

    @Transactional
    public RentalResponse getMine(Long customerId, Long rentalId) {
        expireStaleHolds();
        Rental rental = ownedRental(customerId, rentalId);
        return toResponse(rental, enrich(rental));
    }

    @Transactional(readOnly = true)
    public List<InvoiceSummary> listMyInvoices(Long customerId) {
        List<Long> rentalIds = rentals.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(Rental::getId)
                .toList();
        if (rentalIds.isEmpty()) {
            return List.of();
        }
        return invoices.findByRentalIdInOrderByCreatedAtDesc(rentalIds).stream()
                .map(invoice -> new InvoiceSummary(invoice.getId(), invoice.getStatus().name(), null, null,
                        invoice.getAmount().subtract(invoice.getDiscountAmount()), invoice.getDueAt()))
                .toList();
    }

    private StorageUnit assignUnit(Long facilityId, Long unitTypeId, LocalDate startDate,
                                   LocalDate endDate) {
        List<StorageUnit> candidates = units.findFreeUnitsForHold(facilityId, unitTypeId, startDate,
                endDate, List.copyOf(AVAILABILITY_BLOCKING), PageRequest.of(0, HOLD_CANDIDATES));
        for (StorageUnit candidate : candidates) {
            // Lock the unit row before re-checking overlap; another hold for the
            // same unit blocks here until it commits or rolls back.
            StorageUnit locked = units.findWithLockById(candidate.getId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
            if (RentalAvailability.isAvailable(locked.getStatus(),
                    rentals.findBlockingRentals(locked.getId(), List.copyOf(AVAILABILITY_BLOCKING)),
                    startDate, endDate)) {
                return locked;
            }
        }
        throw new BusinessException(ErrorCode.BAD_REQUEST,
                "Không tìm thấy kho trống phù hợp. Vui lòng chọn cơ sở hoặc loại kho khác.");
    }

    private void assertUnitFree(Long unitId, LocalDate startDate, LocalDate endDate,
                                Long excludeRentalId) {
        StorageUnit unit = units.findById(unitId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        List<Rental> blocking = rentals.findBlockingRentals(unitId,
                        List.copyOf(AVAILABILITY_BLOCKING)).stream()
                .filter(rental -> !rental.getId().equals(excludeRentalId))
                .toList();
        if (!RentalAvailability.isAvailable(unit.getStatus(), blocking, startDate, endDate)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                "Kho đã có hợp đồng khác trong khoảng thời gian gia hạn, vui lòng chọn kho khác");
        }
    }

    private Long firstStaffOf(Long facilityId) {
        List<User> staff = users.findByFacilityIdAndRoleInAndStatus(facilityId,
                List.of(UserRole.FACILITY_STAFF, UserRole.FACILITY_MANAGER), UserStatus.ACTIVE);
        return staff.isEmpty() ? null : staff.get(0).getId();
    }

    private void expirePendingInvoices(Long rentalId) {
        invoices.findByRentalIdOrderByCreatedAtDesc(rentalId).stream()
                .filter(invoice -> invoice.getStatus() == Invoice.Status.PENDING)
                .forEach(Invoice::markExpired);
    }

    /*
     * Holds whose payment window has closed release their unit: the status flips
     * to EXPIRED and any still-pending invoice dies with it, so the slot shows up
     * as available again. Runs inline on read paths so a customer never sees a
     * phantom "1 slot left" caused by a hold nobody will ever pay for.
     * ponytail: inline sweep instead of a scheduler; add @Scheduled when hold
     * volume makes the read-time cost visible.
     */
    @Transactional
    public int expireStaleHolds() {
        List<Rental> stale = rentals.findByStatusAndPaymentExpiresAtBefore(
                RentalStatus.PENDING_PAYMENT, Instant.now());
        for (Rental rental : stale) {
            rental.transitionTo(RentalStatus.EXPIRED);
            expirePendingInvoices(rental.getId());
        }
        return stale.size();
    }

    private BigDecimal depositOf(BigDecimal monthlyPrice, int months) {
        BusinessPolicy policy = policies.findById(BusinessPolicy.ID)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST,
                        "Chưa thiết lập chính sách kinh doanh"));
        return monthlyPrice.multiply(BigDecimal.valueOf(months))
                .multiply(policy.getDepositPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private Rental ownedRental(Long customerId, Long rentalId) {
        return rentals.findByIdAndCustomerId(rentalId, customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
    }

    private UnitType unitType(Long unitTypeId) {
        return unitTypes.findById(unitTypeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND));
    }

    private Facility facility(Long facilityId) {
        return facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
    }

    private InvoiceSummary toSummary(Invoice invoice, BigDecimal rent, BigDecimal deposit) {
        return new InvoiceSummary(invoice.getId(), invoice.getStatus().name(), rent, deposit,
                invoice.getAmount().subtract(invoice.getDiscountAmount()), invoice.getDueAt());
    }

    private RentalResponse toResponse(Rental rental, Long facilityId, String facilityName,
                                      String unitCode, Long unitTypeId, String unitTypeName,
                                      Long invoiceId) {
        return new RentalResponse(rental.getId(), rental.getStatus(), facilityId, facilityName,
                rental.getUnitId(), unitCode, unitTypeId, unitTypeName, rental.getStartDate(),
                rental.getEndDate(), rental.getPricePerMonth(), rental.getPaymentExpiresAt(),
                invoiceId, rental.getCreatedAt());
    }

    private RentalResponse toResponse(Rental rental, RentalNames names) {
        return RentalDtos.RentalResponse.of(rental, names.facilityId(), names.facilityName(),
                names.unitCode(), names.unitTypeId(), names.unitTypeName(), names.invoiceId());
    }

    private RentalNames enrich(Rental rental) {
        StorageUnit unit = units.findById(rental.getUnitId()).orElse(null);
        if (unit == null) {
            return new RentalNames(null, null, null, null, null, null);
        }
        // Most recent invoice of any status: the customer uses it to reach billing.
        Long invoiceId = invoices.findByRentalIdOrderByCreatedAtDesc(rental.getId()).stream()
                .map(Invoice::getId)
                .findFirst()
                .orElse(null);
        return new RentalNames(unit.getFacility().getId(), unit.getFacility().getName(),
                unit.getUnitCode(), unit.getUnitType().getId(), unit.getUnitType().getName(),
                invoiceId);
    }

    private record RentalNames(Long facilityId, String facilityName, String unitCode,
                               Long unitTypeId, String unitTypeName, Long invoiceId) {
    }
}
