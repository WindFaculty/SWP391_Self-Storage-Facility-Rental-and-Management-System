package com.storage.ops.service;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.facility.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.facility.service.FacilityAccessService;
import com.storage.ops.dto.OpsDtos.AssignTaskInput;
import com.storage.ops.dto.OpsDtos.AttentionItem;
import com.storage.ops.dto.OpsDtos.FacilityDto;
import com.storage.ops.dto.OpsDtos.FacilityDashboard;
import com.storage.ops.dto.OpsDtos.HandoverInput;
import com.storage.ops.dto.OpsDtos.OccupancyByType;
import com.storage.ops.dto.OpsDtos.RentalDto;
import com.storage.ops.dto.OpsDtos.RentalList;
import com.storage.ops.dto.OpsDtos.RentalSummary;
import com.storage.ops.dto.OpsDtos.ReturnInput;
import com.storage.ops.dto.OpsDtos.StaffMemberDto;
import com.storage.ops.dto.OpsDtos.StaffTaskDto;
import com.storage.ops.dto.OpsDtos.StorageUnitDto;
import com.storage.ops.dto.OpsDtos.StorageUnitInput;
import com.storage.ops.dto.OpsDtos.TaskList;
import com.storage.ops.dto.OpsDtos.TaskRentalPair;
import com.storage.ops.dto.OpsDtos.TaskSummary;
import com.storage.ops.dto.OpsDtos.TicketDto;
import com.storage.ops.dto.OpsDtos.TicketList;
import com.storage.ops.dto.OpsDtos.TicketTaskPair;
import com.storage.ops.dto.OpsDtos.UnitInspectionInput;
import com.storage.ops.dto.OpsDtos.UnitList;
import com.storage.ops.dto.OpsDtos.UnitStatusInput;
import com.storage.ops.dto.OpsDtos.UnitSummary;
import com.storage.ops.dto.OpsDtos.UnitTypeDto;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;
import com.storage.rental.repository.RentalRepository;
import com.storage.rental.repository.StaffTaskRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.service.Analytics;
import com.storage.shared.text.Strings;
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Facility workspace used by the FE2 pages under frontend/src/features/{facility,staff}.
 * Every read and write is limited to the facilities the caller may touch.
 */
@Service
public class OpsService {

    private static final int EXPIRING_WINDOW_DAYS = 30;
    private static final List<String> TABS =
            List.of("reserved", "active", "expiring", "overdue", "ended");
    private static final Set<UserRole> FACILITY_ROLES =
            EnumSet.of(UserRole.FACILITY_STAFF, UserRole.FACILITY_MANAGER);

    private final FacilityRepository facilities;
    private final UnitTypeRepository unitTypes;
    private final StorageUnitRepository units;
    private final RentalRepository rentals;
    private final StaffTaskRepository staffTasks;
    private final UserRepository users;
    private final InvoiceRepository invoices;
    private final SupportTicketRepository tickets;
    private final FacilityAccessService facilityAccess;
    private final Analytics analytics;

    public OpsService(FacilityRepository facilities,
                      UnitTypeRepository unitTypes,
                      StorageUnitRepository units,
                      RentalRepository rentals,
                      StaffTaskRepository staffTasks,
                      UserRepository users,
                      InvoiceRepository invoices,
                      SupportTicketRepository tickets,
                      FacilityAccessService facilityAccess,
                      Analytics analytics) {
        this.facilities = facilities;
        this.unitTypes = unitTypes;
        this.units = units;
        this.rentals = rentals;
        this.staffTasks = staffTasks;
        this.users = users;
        this.invoices = invoices;
        this.tickets = tickets;
        this.facilityAccess = facilityAccess;
        this.analytics = analytics;
    }

    // ---------- catalog ----------

    @Transactional(readOnly = true)
    public List<FacilityDto> facilities() {
        return facilitiesInScope().stream()
                .map(facility -> new FacilityDto(facility.getId(), facility.getCode(),
                        facility.getName(), facility.getAddress(), facility.getStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UnitTypeDto> unitTypes() {
        return unitTypes.findAll(Sort.by("name")).stream()
                .map(type -> new UnitTypeDto(type.getId(), type.getName(), type.getSizeM2(),
                        type.getDescription(), type.getMinMonthlyPrice(), type.getMaxMonthlyPrice()))
                .toList();
    }

    // ---------- units ----------

    @Transactional(readOnly = true)
    public UnitList units(Long facilityId, String search, Long unitTypeId, StorageUnitStatus status,
                          String priceBand) {
        requireAccess(facilityId);
        List<StorageUnit> all = units.findByFacilityId(facilityId);
        List<StorageUnitDto> items = all.stream()
                .filter(unit -> unitTypeId == null || unit.getUnitType().getId().equals(unitTypeId))
                .filter(unit -> status == null || unit.getStatus() == status)
                .filter(unit -> matchesText(unit.getUnitCode(), unit.getLocationLabel(), search))
                .filter(unit -> inPriceBand(unit, priceBand))
                .map(OpsService::toUnitDto)
                .toList();
        return new UnitList(items, new UnitSummary(all.size(), tally(all, StorageUnitStatus.class,
                StorageUnit::getStatus)));
    }

    @Transactional
    public StorageUnitDto createUnit(StorageUnitInput input) {
        requireAccess(input.facilityId());
        Facility facility = facility(input.facilityId());
        UnitType unitType = unitTypes.findById(input.unitTypeId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND));
        String code = input.unitCode().trim();
        if (units.existsByFacilityIdAndUnitCode(facility.getId(), code)) {
            throw new BusinessException(ErrorCode.STORAGE_UNIT_CODE_EXISTS);
        }
        requirePriceInRange(input.monthlyPrice(), unitType);
        StorageUnit unit = new StorageUnit();
        unit.setFacility(facility);
        unit.setUnitType(unitType);
        unit.setUnitCode(code);
        unit.setLocationLabel(input.locationLabel());
        unit.setMonthlyPrice(input.monthlyPrice());
        unit.setStatus(StorageUnitStatus.AVAILABLE);
        return toUnitDto(units.save(unit));
    }

    @Transactional
    public StorageUnitDto updateUnit(Long unitId, StorageUnitInput input) {
        StorageUnit unit = unit(unitId);
        requireAccess(unit.getFacility().getId());
        UnitType unitType = unitTypes.findById(input.unitTypeId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND));
        String code = input.unitCode().trim();
        if (!unit.getUnitCode().equals(code)
                && units.existsByFacilityIdAndUnitCode(unit.getFacility().getId(), code)) {
            throw new BusinessException(ErrorCode.STORAGE_UNIT_CODE_EXISTS);
        }
        requirePriceInRange(input.monthlyPrice(), unitType);
        unit.setUnitCode(code);
        unit.setUnitType(unitType);
        unit.setLocationLabel(input.locationLabel());
        unit.setMonthlyPrice(input.monthlyPrice());
        return toUnitDto(unit);
    }

    @Transactional
    public StorageUnitDto changeUnitStatus(Long unitId, UnitStatusInput input) {
        StorageUnit unit = units.findWithLockById(unitId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        requireAccess(unit.getFacility().getId());
        if (!unit.getStatus().canTransitionTo(input.status())) {
            throw new BusinessException(ErrorCode.INVALID_UNIT_STATUS_TRANSITION);
        }
        if (input.status() == StorageUnitStatus.OCCUPIED && Strings.isBlank(input.reason())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chuyển kho sang OCCUPIED phải ghi rõ lý do");
        }
        unit.setStatus(input.status());
        return toUnitDto(unit);
    }

    // ---------- rentals ----------

    @Transactional(readOnly = true)
    public RentalList rentals(Long facilityId, String tab, String search, String paymentState,
                              Long unitTypeId) {
        requireAccess(facilityId);
        List<Rental> all = rentals.findByFacilityId(facilityId);
        Lookup lookup = lookup(all, List.of(), List.of());
        List<RentalDto> items = all.stream()
                .filter(rental -> Objects.equals(lookup.unitTypeIdOf(rental), unitTypeId)
                        || unitTypeId == null)
                .filter(rental -> Objects.equals(lookup.paymentStateOf(rental), paymentState)
                        || paymentState == null)
                .filter(rental -> tab == null || "all".equals(tab) || tabOf(rental).equals(tab))
                .filter(rental -> matchesRental(rental, search, lookup))
                .map(rental -> toRentalDto(rental, lookup))
                .toList();
        return new RentalList(items, summaryOf(all));
    }

    @Transactional(readOnly = true)
    public RentalDto rental(Long rentalId) {
        Rental rental = rentals.findById(rentalId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
        requireAccess(facilityIdOf(rental));
        return toRentalDto(rental, lookup(List.of(rental), List.of(), List.of()));
    }

    // ---------- staff ----------

    @Transactional(readOnly = true)
    public List<StaffMemberDto> staff(Long facilityId) {
        requireAccess(facilityId);
        return users.findByFacilityIdAndRoleInAndStatus(facilityId, List.copyOf(FACILITY_ROLES),
                        UserStatus.ACTIVE).stream()
                .map(user -> new StaffMemberDto(user.getId(), user.getFullName(),
                        user.getFacilityId()))
                .toList();
    }

    // ---------- tasks ----------

    @Transactional(readOnly = true)
    public TaskList tasks(Long facilityId, String tab, TaskStatus status, String slot, String day,
                          Long rentalId, String search, boolean onlyMine) {
        List<Long> staffIds = onlyMine
                ? List.of(SecurityUtils.requireCurrentUserId())
                : staffIdsOf(facilityId);
        List<StaffTask> all = staffIds.isEmpty() ? List.of()
                : staffTasks.findByAssignedStaffIdIn(staffIds);
        Lookup lookup = lookup(List.of(), all, List.of());
        List<StaffTaskDto> items = all.stream()
                .filter(task -> task.getStatus() != TaskStatus.CANCELLED)
                .filter(task -> rentalId == null || Objects.equals(task.getRentalId(), rentalId))
                .filter(task -> tab == null || "all".equals(tab)
                        || task.getTaskType().name().equals(tab))
                .filter(task -> status == null || task.getStatus() == status)
                .filter(task -> slot == null || "all".equals(slot) || matchesSlot(task, slot))
                .filter(task -> day == null || "all".equals(day) || isToday(task))
                .filter(task -> matchesTask(task, search, lookup))
                .map(task -> toTaskDto(task, lookup))
                .toList();
        List<StaffTask> open = all.stream()
                .filter(task -> task.getStatus() != TaskStatus.CANCELLED).toList();
        return new TaskList(items, new TaskSummary(tally(open, TaskStatus.class,
                StaffTask::getStatus), tally(open, TaskType.class, StaffTask::getTaskType)));
    }

    @Transactional
    public StaffTaskDto assignTask(AssignTaskInput input) {
        requireAccess(input.facilityId());
        if (input.taskType() == TaskType.SUPPORT) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Dùng giao ticket cho việc này trực tiếp");
        }
        User staff = staffOfFacility(input.assignedStaffId(), input.facilityId());
        Rental rental = rentals.findById(input.rentalId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
        requireAccess(facilityIdOf(rental));
        StaffTask task = new StaffTask(staff.getId(), rental.getId(), null, input.taskType(),
                input.scheduledAt() == null ? Instant.now() : input.scheduledAt());
        task.setNotes(input.notes());
        return toTaskDto(staffTasks.save(task), lookup(List.of(rental), List.of(task), List.of()));
    }

    @Transactional
    public StaffTaskDto startTask(Long taskId) {
        StaffTask task = taskOf(taskId).start();
        return toTaskDto(task, lookup(List.of(), List.of(task), List.of()));
    }

    @Transactional
    public StaffTaskDto completeTask(Long taskId, String notes) {
        StaffTask task = taskOf(taskId).start();
        task.setNotes(notes);
        task.complete(Instant.now());
        return toTaskDto(task, lookup(List.of(), List.of(task), List.of()));
    }

    @Transactional
    public TaskRentalPair completeHandover(Long taskId, HandoverInput input) {
        StaffTask task = taskOf(taskId);
        requireTaskType(task, TaskType.HANDOVER);
        requireTaskAccess(task);
        Rental rental = rentalOf(task.getRentalId());
        requireAccess(facilityIdOf(rental));
        if (rental.getStatus() != RentalStatus.RESERVED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ nhận kho cho hợp đồng đã thanh toán và xếp kho");
        }
        task.startIfNotStarted();
        task.setNotes(input.handoverCondition());
        task.complete(Instant.now());
        rental.checkIn(Instant.now(), input.accessMethod(), input.handoverCondition());
        StorageUnit unit = units.findWithLockById(rental.getUnitId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        unit.setStatus(StorageUnitStatus.OCCUPIED);
        Lookup lookup = lookup(List.of(rental), List.of(task), List.of());
        return new TaskRentalPair(toTaskDto(task, lookup), toRentalDto(rental, lookup));
    }

    @Transactional
    public TaskRentalPair completeReturn(Long taskId, ReturnInput input) {
        StaffTask task = taskOf(taskId);
        requireTaskType(task, TaskType.RETURN_INSPECTION);
        requireTaskAccess(task);
        Rental rental = rentalOf(task.getRentalId());
        requireAccess(facilityIdOf(rental));
        task.startIfNotStarted();
        task.setNotes(input.condition());
        task.complete(Instant.now());
        rental.checkOut(Instant.now(), input.condition());
        StorageUnit unit = units.findWithLockById(rental.getUnitId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        if (unit.getStatus().canTransitionTo(StorageUnitStatus.INSPECTION)) {
            unit.setStatus(StorageUnitStatus.INSPECTION);
        }
        Lookup lookup = lookup(List.of(rental), List.of(task), List.of());
        return new TaskRentalPair(toTaskDto(task, lookup), toRentalDto(rental, lookup));
    }

    @Transactional
    public TaskRentalPair completeUnitInspection(Long taskId, UnitInspectionInput input) {
        StaffTask task = taskOf(taskId);
        requireTaskType(task, TaskType.UNIT_INSPECTION);
        requireTaskAccess(task);
        Rental rental = rentalOf(task.getRentalId());
        requireAccess(facilityIdOf(rental));
        boolean passed = "PASS".equalsIgnoreCase(input.result());
        StorageUnit unit = units.findWithLockById(rental.getUnitId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        if (unit.getStatus() != StorageUnitStatus.INSPECTION) {
            throw new BusinessException(ErrorCode.INVALID_UNIT_STATUS_TRANSITION);
        }
        unit.setStatus(passed ? StorageUnitStatus.AVAILABLE : StorageUnitStatus.MAINTENANCE);
        task.startIfNotStarted();
        task.setNotes(input.notes());
        task.complete(Instant.now());
        Lookup lookup = lookup(List.of(rental), List.of(task), List.of());
        return new TaskRentalPair(toTaskDto(task, lookup), toRentalDto(rental, lookup));
    }

    // ---------- tickets ----------

    @Transactional(readOnly = true)
    public TicketList tickets(Long facilityId, String status, String search) {
        requireAccess(facilityId);
        List<SupportTicket> all = tickets.findByFacilityId(facilityId);
        Lookup lookup = lookup(List.of(), List.of(), all);
        List<TicketDto> items = all.stream()
                .filter(ticket -> status == null || ticket.getStatus().name().equals(status))
                .filter(ticket -> matchesText(ticket.getTitle(), ticket.getDescription(), search))
                .map(ticket -> toTicketDto(ticket, lookup))
                .toList();
        return new TicketList(items,
                tickets.countByFacilityIdAndStatusNot(facilityId, SupportTicket.Status.CLOSED));
    }

    @Transactional(readOnly = true)
    public TicketDto ticket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        return toTicketDto(ticket, lookup(List.of(), List.of(), List.of(ticket)));
    }

    @Transactional
    public TicketTaskPair assignTicket(Long ticketId, Long staffId, Instant scheduledAt,
                                       String notes) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        staffOfFacility(staffId, ticket.getFacilityId());
        if (ticket.getStatus() == SupportTicket.Status.RESOLVED
                || ticket.getStatus() == SupportTicket.Status.CLOSED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Ticket đã được hoàn giải quyết, không thể giao lại");
        }
        if (ticket.getAssignedStaffId() != null
                && !ticket.getAssignedStaffId().equals(staffId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ticket đã được giao cho người khác");
        }
        ticket.assign(staffId);
        StaffTask task = new StaffTask(staffId, null, ticketId, TaskType.SUPPORT,
                scheduledAt == null ? Instant.now() : scheduledAt);
        task.setNotes(notes);
        staffTasks.save(task);
        Lookup lookup = lookup(List.of(), List.of(task), List.of(ticket));
        return new TicketTaskPair(toTicketDto(ticket, lookup), toTaskDto(task, lookup));
    }

    @Transactional
    public TicketDto closeTicket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        if (!ticket.close()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ đóng được ticket đã giải quyết");
        }
        return toTicketDto(ticket, lookup(List.of(), List.of(), List.of(ticket)));
    }

    @Transactional
    public TicketDto startTicket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        if (!ticket.start()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ bắt đầu được ticket đang mở");
        }
        return toTicketDto(ticket, lookup(List.of(), List.of(), List.of(ticket)));
    }

    @Transactional
    public TicketDto resolveTicket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        if (!ticket.resolve(Instant.now())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ giải quyết được ticket đang xử lý");
        }
        return toTicketDto(ticket, lookup(List.of(), List.of(), List.of(ticket)));
    }

    // ---------- dashboard ----------

    @Transactional(readOnly = true)
    public FacilityDashboard dashboard(Long facilityId) {
        requireAccess(facilityId);
        List<StorageUnit> allUnits = units.findByFacilityId(facilityId);
        List<Rental> allRentals = rentals.findByFacilityId(facilityId);
        List<StaffTask> allTasks = staffTasks.findByAssignedStaffIdIn(staffIdsOf(facilityId));
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Lookup lookup = lookup(allRentals, List.of(), List.of());

        Map<StorageUnitStatus, Long> unitByStatus = tally(allUnits, StorageUnitStatus.class,
                StorageUnit::getStatus);
        long total = allUnits.size();
        long occupied = unitByStatus.getOrDefault(StorageUnitStatus.OCCUPIED, 0L);
        List<RentalDto> expiring = allRentals.stream()
                .filter(rental -> rental.getStatus() == RentalStatus.ACTIVE)
                .filter(rental -> !rental.getEndDate().isAfter(today.plusDays(EXPIRING_WINDOW_DAYS)))
                .sorted((a, b) -> a.getEndDate().compareTo(b.getEndDate()))
                .limit(10)
                .map(rental -> toRentalDto(rental, lookup))
                .toList();
        List<OccupancyByType> occupancyByType = allUnits.stream()
                .collect(Collectors.groupingBy(unit -> unit.getUnitType().getName()))
                .entrySet().stream()
                .map(entry -> {
                    long typeTotal = entry.getValue().size();
                    long typeOccupied = entry.getValue().stream()
                            .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
                    return new OccupancyByType(entry.getKey(), typeOccupied, typeTotal,
                            Analytics.rate(typeOccupied, typeTotal));
                })
                .toList();

        List<AttentionItem> attention = new ArrayList<>();
        long overdue = allRentals.stream()
                .filter(rental -> rental.getStatus() == RentalStatus.OVERDUE).count();
        if (overdue > 0) {
            attention.add(new AttentionItem("overdue", "danger", "Hợp đồng quá hạn",
                    overdue + " hợp đồng cần xử lý", "/facility/rentals"));
        }
        if (!expiring.isEmpty()) {
            attention.add(new AttentionItem("expiring", "warning", "Hợp đồng sắp hết hạn",
                    expiring.size() + " hợp đồng hết hạn trong " + EXPIRING_WINDOW_DAYS + " ngày",
                    "/facility/rentals"));
        }
        long inInspection = unitByStatus.getOrDefault(StorageUnitStatus.INSPECTION, 0L);
        if (inInspection > 0) {
            attention.add(new AttentionItem("inspection", "warning", "Kho đang kiểm tra",
                    inInspection + " kho chờ kiểm định", "/facility/units"));
        }
        long activeTickets = tickets.countByFacilityIdAndStatusNot(facilityId,
                SupportTicket.Status.CLOSED);
        if (activeTickets > 0) {
            attention.add(new AttentionItem("tickets", "info", "Ticket đang mở",
                    activeTickets + " ticket cần xử lý", "/staff/operations"));
        }

        return new FacilityDashboard(total, occupied,
                unitByStatus.getOrDefault(StorageUnitStatus.AVAILABLE, 0L), inInspection,
                unitByStatus.getOrDefault(StorageUnitStatus.MAINTENANCE, 0L),
                Analytics.rate(occupied, total),
                Analytics.count(allRentals, rental -> rental.getStatus() == RentalStatus.ACTIVE),
                overdue,
                expiring.size(),
                allTasks.stream().filter(OpsService::isToday).count(),
                allTasks.stream().filter(task -> task.getStatus() != TaskStatus.DONE).count(),
                activeTickets, attention, expiring, occupancyByType);
    }

    @Transactional(readOnly = true)
    public List<Analytics.MonthPoint> revenueSeries(Long facilityId, int months) {
        requireAccess(facilityId);
        Map<String, BigDecimal> byMonth = analytics.paidByMonth(rentalIdsOf(facilityId));
        return Analytics.window(byMonth, Math.max(months, 1));
    }

    // ---------- helpers ----------

    private List<Long> staffIdsOf(Long facilityId) {
        return users.findByFacilityIdAndRoleInAndStatus(facilityId, List.copyOf(FACILITY_ROLES),
                        UserStatus.ACTIVE).stream()
                .map(User::getId).toList();
    }

    private List<Long> rentalIdsOf(Long facilityId) {
        return rentals.findByFacilityId(facilityId).stream().map(Rental::getId).toList();
    }

    private List<Facility> facilitiesInScope() {
        return SecurityUtils.getCurrentUserPrincipal()
                .map(principal -> switch (principal.getRole()) {
                    case ADMIN, BUSINESS_MANAGER -> facilities.findAll(Sort.by("name"));
                    default -> principal.getFacilityId() == null ? List.<Facility>of()
                            : facilities.findById(principal.getFacilityId()).map(List::of)
                            .orElse(List.of());
                })
                .orElse(List.of());
    }

    private User staffOfFacility(Long staffId, Long facilityId) {
        User staff = users.findById(staffId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE
                        && FACILITY_ROLES.contains(user.getRole()))
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST,
                        "Nhân viên không hợp lệ hoặc bị vô hiệu hóa"));
        if (!facilityId.equals(staff.getFacilityId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Nhân viên không thuộc cơ sở này");
        }
        return staff;
    }

    private void requireAccess(Long facilityId) {
        facilityAccess.requireFacilityAccess(facilityId);
    }

    private Facility facility(Long facilityId) {
        return facilities.findById(facilityId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
    }

    private StorageUnit unit(Long unitId) {
        return units.findById(unitId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
    }

    private StaffTask taskOf(Long taskId) {
        return staffTasks.findById(taskId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
    }

    private Rental rentalOf(Long rentalId) {
        return rentals.findById(rentalId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
    }

    private Long facilityIdOf(Rental rental) {
        return unit(rental.getUnitId()).getFacility().getId();
    }

    private void requireTaskType(StaffTask task, TaskType expected) {
        if (task.getTaskType() != expected) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Thao tác không hợp lệ cho việc " + task.getTaskType());
        }
    }

    private void requireTaskAccess(StaffTask task) {
        if (task.getRentalId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Việc này không được gắn hợp đồng kèm");
        }
    }

    private RentalSummary summaryOf(List<Rental> rentals) {
        Map<RentalStatus, Long> byStatus = tally(rentals, RentalStatus.class, Rental::getStatus);
        Map<String, Long> byTab = new LinkedHashMap<>();
        for (String tab : TABS) {
            byTab.put(tab, 0L);
        }
        for (Rental rental : rentals) {
            byTab.merge(tabOf(rental), 1L, Long::sum);
        }
        return new RentalSummary(rentals.size(), byStatus, byTab);
    }

    private static String tabOf(Rental rental) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return switch (rental.getStatus()) {
            case ACTIVE -> rental.getEndDate().isAfter(today.plusDays(EXPIRING_WINDOW_DAYS))
                    ? "active" : "expiring";
            case OVERDUE -> "overdue";
            case PENDING_PAYMENT, RESERVED, EXPIRED, CANCELLED, RETURN_REQUESTED, RETURNED -> "ended";
        };
    }

    private static boolean matchesRental(Rental rental, String search, Lookup lookup) {
        if (Strings.isBlank(search)) {
            return true;
        }
        StorageUnit unit = lookup.units().get(rental.getUnitId());
        return matchesText(unit == null ? null : unit.getUnitCode(),
                unit == null ? null : unit.getUnitType().getName(), search);
    }

    private static boolean matchesTask(StaffTask task, String search, Lookup lookup) {
        if (Strings.isBlank(search)) {
            return true;
        }
        Rental rental = task.getRentalId() == null
                ? null : lookup.rentals().get(task.getRentalId());
        StorageUnit unit = rental == null ? null : lookup.units().get(rental.getUnitId());
        return matchesText(String.valueOf(task.getId()), unit == null ? null : unit.getUnitCode(),
                search);
    }

    private static boolean matchesSlot(StaffTask task, String slot) {
        int hour = task.getScheduledAt().atZone(ZoneOffset.UTC).getHour();
        return switch (slot) {
            case "morning" -> hour < 12;
            case "afternoon" -> hour >= 12;
            default -> true;
        };
    }

    private static boolean isToday(StaffTask task) {
        return task.getScheduledAt().atZone(ZoneOffset.UTC).toLocalDate()
                .equals(LocalDate.now(ZoneOffset.UTC));
    }

    private static boolean inPriceBand(StorageUnit unit, String priceBand) {
        if (priceBand == null) {
            return true;
        }
        BigDecimal price = unit.getMonthlyPrice();
        return switch (priceBand) {
            case "low" -> price.compareTo(new BigDecimal("600000")) < 0;
            case "mid" -> price.compareTo(new BigDecimal("600000")) >= 0
                    && price.compareTo(new BigDecimal("1500000")) <= 0;
            case "high" -> price.compareTo(new BigDecimal("1500000")) > 0;
            default -> true;
        };
    }

    private static void requirePriceInRange(BigDecimal price, UnitType unitType) {
        if (price.compareTo(unitType.getMinMonthlyPrice()) < 0
                || price.compareTo(unitType.getMaxMonthlyPrice()) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Giá kho phải nằm trong khoảng giá của loại kho");
        }
    }

    private static boolean matchesText(String primary, String secondary, String search) {
        if (Strings.isBlank(search)) {
            return true;
        }
        String needle = search.trim().toLowerCase(Locale.ROOT);
        return Strings.containsIgnoreCase(primary, needle)
                || Strings.containsIgnoreCase(secondary, needle);
    }

    private static <T, E extends Enum<E>> Map<E, Long> tally(List<T> items, Class<E> type,
                                                             Function<T, E> keyOf) {
        Map<E, Long> counts = new EnumMap<>(type);
        for (E value : type.getEnumConstants()) {
            counts.put(value, 0L);
        }
        for (T item : items) {
            counts.merge(keyOf.apply(item), 1L, Long::sum);
        }
        return counts;
    }

    private static StorageUnitDto toUnitDto(StorageUnit unit) {
        return new StorageUnitDto(unit.getId(), unit.getFacility().getId(),
                unit.getUnitType().getId(), unit.getUnitCode(), unit.getLocationLabel(),
                unit.getMonthlyPrice(), unit.getStatus());
    }

    private StaffTaskDto toTaskDto(StaffTask task, Lookup lookup) {
        Rental rental = task.getRentalId() == null
                ? null : lookup.rentals().get(task.getRentalId());
        StorageUnit unit = rental == null ? null : lookup.units().get(rental.getUnitId());
        User assigned = lookup.users().get(task.getAssignedStaffId());
        return new StaffTaskDto(task.getId(),
                unit == null ? null : unit.getFacility().getId(), task.getTaskType(),
                task.getStatus(), task.getAssignedStaffId(),
                assigned == null ? null : assigned.getFullName(),
                task.getRentalId(), task.getTicketId(),
                unit == null ? null : unit.getUnitCode(),
                rental == null ? null : fullNameOf(lookup.users().get(rental.getCustomerId())),
                rental == null ? null : lookup.paymentStateOf(rental),
                task.getScheduledAt(), task.getCompletedAt(), task.getNotes());
    }

    private RentalDto toRentalDto(Rental rental, Lookup lookup) {
        StorageUnit unit = lookup.units().get(rental.getUnitId());
        User customer = lookup.users().get(rental.getCustomerId());
        StaffTask openTask = lookup.openHandovers().get(rental.getId());
        return new RentalDto(rental.getId(), unit.getFacility().getId(),
                fullNameOf(customer), customer == null ? null : customer.getPhone(),
                rental.getUnitId(), unit.getUnitCode(), unit.getUnitType().getId(),
                unit.getUnitType().getName(),
                rental.getStartDate(), rental.getEndDate(), rental.getPricePerMonth(),
                rental.getStatus(), lookup.paymentStateOf(rental), rental.getAppointmentAt(),
                rental.getCheckedInAt(), rental.getAccessMethod(), rental.getHandoverCondition(),
                rental.getReturnedAt(), rental.getReturnCondition(),
                openTask == null ? null
                        : fullNameOf(lookup.users().get(openTask.getAssignedStaffId())),
                openTask == null ? null : openTask.getId());
    }

    private TicketDto toTicketDto(SupportTicket ticket, Lookup lookup) {
        Rental rental = ticket.getRentalId() == null ? null
                : lookup.rentals().get(ticket.getRentalId());
        StorageUnit unit = rental == null ? null : lookup.units().get(rental.getUnitId());
        return new TicketDto(ticket.getId(), ticket.getFacilityId(),
                fullNameOf(lookup.users().get(ticket.getCustomerId())),
                ticket.getRentalId(), unit == null ? null : unit.getUnitCode(),
                ticket.getCategory(), ticket.getTitle(), ticket.getDescription(),
                ticket.getStatus(), ticket.getCreatedAt(), ticket.getResolvedAt(),
                fullNameOf(lookup.users().get(ticket.getAssignedStaffId())));
    }

    private static String fullNameOf(User user) {
        return user == null ? null : user.getFullName();
    }

    /**
     * Everything the row mappers need, loaded in one pass. Listing N rows costs a
     * fixed handful of queries instead of ~4N.
     */
    private record Lookup(Map<Long, StorageUnit> units, Map<Long, Rental> rentals,
                          Map<Long, User> users, Map<Long, String> paymentStates,
                          Map<Long, StaffTask> openHandovers) {

        Long unitTypeIdOf(Rental rental) {
            StorageUnit unit = units.get(rental.getUnitId());
            return unit == null ? null : unit.getUnitType().getId();
        }

        String paymentStateOf(Rental rental) {
            return paymentStates.get(rental.getId());
        }
    }

    private Lookup lookup(List<Rental> rentalRows, List<StaffTask> taskRows,
                          List<SupportTicket> ticketRows) {
        Set<Long> rentalIds = new LinkedHashSet<>();
        rentalRows.forEach(row -> rentalIds.add(row.getId()));
        taskRows.stream().map(StaffTask::getRentalId).filter(Objects::nonNull)
                .forEach(rentalIds::add);
        ticketRows.stream().map(SupportTicket::getRentalId).filter(Objects::nonNull)
                .forEach(rentalIds::add);

        Map<Long, Rental> rentalById = rentalIds.isEmpty() ? Map.of()
                : index(rentals.findAllById(rentalIds), Rental::getId);

        Set<Long> unitIds = new LinkedHashSet<>();
        rentalById.values().forEach(rental -> unitIds.add(rental.getUnitId()));
        Map<Long, StorageUnit> unitById = unitIds.isEmpty() ? Map.of()
                : index(units.findAllById(unitIds), StorageUnit::getId);

        Map<Long, StaffTask> openHandovers = new LinkedHashMap<>();
        if (!rentalIds.isEmpty()) {
            for (StaffTask task : staffTasks.findByRentalIdIn(new ArrayList<>(rentalIds))) {
                if (task.getTaskType() == TaskType.HANDOVER
                        && task.getStatus() != TaskStatus.CANCELLED) {
                    openHandovers.putIfAbsent(task.getRentalId(), task);
                }
            }
        }

        // Handover assignees must be collected before the users query, otherwise
        // rentals()/rental() (which pass no task rows) render "Chưa phân công".
        Set<Long> userIds = new LinkedHashSet<>();
        rentalById.values().forEach(rental -> userIds.add(rental.getCustomerId()));
        taskRows.forEach(task -> userIds.add(task.getAssignedStaffId()));
        openHandovers.values().forEach(task -> userIds.add(task.getAssignedStaffId()));
        ticketRows.forEach(ticket -> {
            userIds.add(ticket.getCustomerId());
            if (ticket.getAssignedStaffId() != null) {
                userIds.add(ticket.getAssignedStaffId());
            }
        });
        Map<Long, User> userById = userIds.isEmpty() ? Map.of()
                : index(users.findAllById(userIds), User::getId);

        return new Lookup(unitById, rentalById, userById, paymentStatesOf(rentalIds),
                openHandovers);
    }

    private Map<Long, String> paymentStatesOf(Collection<Long> rentalIds) {
        if (rentalIds.isEmpty()) {
            return Map.of();
        }
        Instant now = Instant.now();
        Map<Long, String> states = new HashMap<>();
        for (List<Invoice> siblings : invoices.findByRentalIdIn(new ArrayList<>(rentalIds)).stream()
                .collect(Collectors.groupingBy(Invoice::getRentalId)).values()) {
            if (siblings.stream().anyMatch(row -> row.getStatus() == Invoice.Status.PAID)) {
                states.put(siblings.get(0).getRentalId(), "PAID");
            } else if (siblings.stream()
                    .anyMatch(row -> row.getStatus() == Invoice.Status.PENDING)) {
                boolean overdue = siblings.stream()
                        .filter(row -> row.getStatus() == Invoice.Status.PENDING)
                        .anyMatch(row -> row.getDueAt() != null && row.getDueAt().isBefore(now));
                states.put(siblings.get(0).getRentalId(), overdue ? "OVERDUE" : "PENDING");
            }
        }
        return states;
    }

    private static <T> Map<Long, T> index(Collection<T> rows, Function<T, Long> keyOf) {
        Map<Long, T> byKey = new LinkedHashMap<>();
        for (T row : rows) {
            byKey.put(keyOf.apply(row), row);
        }
        return byKey;
    }
}