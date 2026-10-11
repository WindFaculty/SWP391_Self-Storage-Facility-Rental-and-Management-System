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
import com.storage.ops.dto.OpsDtos.RevenuePoint;
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
import com.storage.payment.repository.PaymentAttemptRepository;
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
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
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

    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MM/yyyy", Locale.forLanguageTag("vi"));
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
    private final PaymentAttemptRepository paymentAttempts;
    private final SupportTicketRepository tickets;
    private final FacilityAccessService facilityAccess;

    public OpsService(FacilityRepository facilities,
                      UnitTypeRepository unitTypes,
                      StorageUnitRepository units,
                      RentalRepository rentals,
                      StaffTaskRepository staffTasks,
                      UserRepository users,
                      InvoiceRepository invoices,
                      PaymentAttemptRepository paymentAttempts,
                      SupportTicketRepository tickets,
                      FacilityAccessService facilityAccess) {
        this.facilities = facilities;
        this.unitTypes = unitTypes;
        this.units = units;
        this.rentals = rentals;
        this.staffTasks = staffTasks;
        this.users = users;
        this.invoices = invoices;
        this.paymentAttempts = paymentAttempts;
        this.tickets = tickets;
        this.facilityAccess = facilityAccess;
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
        if (input.status() == StorageUnitStatus.OCCUPIED && isBlank(input.reason())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "ChuyÃƒÂ¡Ã‚Â»Ã†â€™n kho sang OCCUPIED phÃƒÂ¡Ã‚ÂºÃ‚Â£i ghi rÃƒÆ’Ã‚Âµ lÃƒÆ’Ã‚Â½ do");
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
        Map<Long, UnitType> unitTypesById = unitTypesByUnitId(units.findByFacilityId(facilityId));
        List<RentalDto> items = all.stream()
                .filter(rental -> unitTypeId == null
                        || unitTypeIdOf(rental, unitTypesById).equals(unitTypeId))
                .filter(rental -> paymentState == null
                        || Objects.equals(paymentStateOf(rental), paymentState))
                .filter(rental -> tab == null || "all".equals(tab) || tabOf(rental).equals(tab))
                .filter(rental -> matchesRental(rental, search, unitTypesById))
                .map(rental -> toRentalDto(rental))
                .toList();
        return new RentalList(items, summaryOf(all));
    }

    @Transactional(readOnly = true)
    public RentalDto rental(Long rentalId) {
        Rental rental = rentals.findById(rentalId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
        requireAccess(facilityIdOf(rental));
        return toRentalDto(rental);
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
                ? List.of(currentUserId())
                : staffIdsOf(facilityId);
        List<StaffTask> all = staffIds.isEmpty() ? List.of()
                : staffTasks.findByAssignedStaffIdIn(staffIds);
        List<StaffTaskDto> items = all.stream()
                .filter(task -> task.getStatus() != TaskStatus.CANCELLED)
                .filter(task -> rentalId == null || Objects.equals(task.getRentalId(), rentalId))
                .filter(task -> tab == null || "all".equals(tab)
                        || task.getTaskType().name().equals(tab))
                .filter(task -> status == null || task.getStatus() == status)
                .filter(task -> slot == null || "all".equals(slot) || matchesSlot(task, slot))
                .filter(task -> day == null || "all".equals(day) || isToday(task))
                .filter(task -> matchesTask(task, search))
                .map(task -> toTaskDto(task))
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
                    "DÃƒÆ’Ã‚Â¹ng giao ticket cho viÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡c hÃƒÂ¡Ã‚Â»Ã¢â‚¬â€ trÃƒÂ¡Ã‚Â»Ã‚Â£");
        }
        User staff = staffOfFacility(input.assignedStaffId(), input.facilityId());
        Rental rental = rentals.findById(input.rentalId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
        requireAccess(facilityIdOf(rental));
        StaffTask task = new StaffTask(staff.getId(), rental.getId(), null, input.taskType(),
                input.scheduledAt() == null ? Instant.now() : input.scheduledAt());
        task.setNotes(input.notes());
        return toTaskDto(staffTasks.save(task));
    }

    @Transactional
    public StaffTaskDto startTask(Long taskId) {
        return toTaskDto(taskOf(taskId).start());
    }

    @Transactional
    public StaffTaskDto completeTask(Long taskId, String notes) {
        StaffTask task = taskOf(taskId).start();
        task.setNotes(notes);
        task.complete(Instant.now());
        return toTaskDto(task);
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
                    "ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â° nhÃƒÂ¡Ã‚ÂºÃ‚Â­n kho cho Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ thanh toÃƒÆ’Ã‚Â¡n vÃƒÆ’Ã‚Â  Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t chÃƒÂ¡Ã‚Â»Ã¢â‚¬â€");
        }
        task.startIfNotStarted();
        task.setNotes(input.handoverCondition());
        task.complete(Instant.now());
        rental.checkIn(Instant.now(), input.accessMethod(), input.handoverCondition());
        StorageUnit unit = units.findWithLockById(rental.getUnitId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        unit.setStatus(StorageUnitStatus.OCCUPIED);
        return new TaskRentalPair(toTaskDto(task), toRentalDto(rental));
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
        return new TaskRentalPair(toTaskDto(task), toRentalDto(rental));
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
        return new TaskRentalPair(toTaskDto(task), toRentalDto(rental));
    }

    // ---------- tickets ----------

    @Transactional(readOnly = true)
    public TicketList tickets(Long facilityId, String status, String search) {
        requireAccess(facilityId);
        List<SupportTicket> all = tickets.findByFacilityId(facilityId);
        List<TicketDto> items = all.stream()
                .filter(ticket -> status == null || ticket.getStatus().name().equals(status))
                .filter(ticket -> matchesText(ticket.getTitle(), ticket.getDescription(), search))
                .map(this::toTicketDto)
                .toList();
        return new TicketList(items,
                tickets.countByFacilityIdAndStatusNot(facilityId, SupportTicket.Status.CLOSED));
    }

    @Transactional(readOnly = true)
    public TicketDto ticket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        return toTicketDto(ticket);
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
                    "Ticket Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â³ng hoÃƒÂ¡Ã‚ÂºÃ‚Â·c Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ giÃƒÂ¡Ã‚ÂºÃ‚Â£i quyÃƒÂ¡Ã‚ÂºÃ‚Â¿t, khÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ giao lÃƒÂ¡Ã‚ÂºÃ‚Â¡i");
        }
        if (ticket.getAssignedStaffId() != null
                && !ticket.getAssignedStaffId().equals(staffId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ticket Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c giao cho ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi khÃƒÆ’Ã‚Â¡c");
        }
        ticket.assign(staffId);
        StaffTask task = new StaffTask(staffId, null, ticketId, TaskType.SUPPORT,
                scheduledAt == null ? Instant.now() : scheduledAt);
        task.setNotes(notes);
        return new TicketTaskPair(toTicketDto(ticket), toTaskDto(staffTasks.save(task)));
    }

    @Transactional
    public TicketDto closeTicket(Long ticketId) {
        SupportTicket ticket = tickets.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
        requireAccess(ticket.getFacilityId());
        if (!ticket.close()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â° Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â³ng Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c ticket Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ giÃƒÂ¡Ã‚ÂºÃ‚Â£i quyÃƒÂ¡Ã‚ÂºÃ‚Â¿t");
        }
        return toTicketDto(ticket);
    }

    // ---------- dashboard ----------

    @Transactional(readOnly = true)
    public FacilityDashboard dashboard(Long facilityId) {
        requireAccess(facilityId);
        List<StorageUnit> allUnits = units.findByFacilityId(facilityId);
        List<Rental> allRentals = rentals.findByFacilityId(facilityId);
        List<StaffTask> allTasks = staffTasks.findByAssignedStaffIdIn(staffIdsOf(facilityId));
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Map<StorageUnitStatus, Long> unitByStatus = tally(allUnits, StorageUnitStatus.class,
                StorageUnit::getStatus);
        long total = allUnits.size();
        long occupied = unitByStatus.getOrDefault(StorageUnitStatus.OCCUPIED, 0L);
        List<RentalDto> expiring = allRentals.stream()
                .filter(rental -> rental.getStatus() == RentalStatus.ACTIVE)
                .filter(rental -> !rental.getEndDate().isAfter(today.plusDays(EXPIRING_WINDOW_DAYS)))
                .sorted((a, b) -> a.getEndDate().compareTo(b.getEndDate()))
                .limit(10)
                .map(this::toRentalDto)
                .toList();
        List<OccupancyByType> occupancyByType = allUnits.stream()
                .collect(Collectors.groupingBy(unit -> unit.getUnitType().getName()))
                .entrySet().stream()
                .map(entry -> {
                    long typeTotal = entry.getValue().size();
                    long typeOccupied = entry.getValue().stream()
                            .filter(unit -> unit.getStatus() == StorageUnitStatus.OCCUPIED).count();
                    return new OccupancyByType(entry.getKey(), typeOccupied, typeTotal,
                            rate(typeOccupied, typeTotal));
                })
                .toList();

        List<AttentionItem> attention = new java.util.ArrayList<>();
        long overdue = allRentals.stream()
                .filter(rental -> rental.getStatus() == RentalStatus.OVERDUE).count();
        if (overdue > 0) {
            attention.add(new AttentionItem("overdue", "danger", "HÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng quÃƒÆ’Ã‚Â¡ hÃƒÂ¡Ã‚ÂºÃ‚Â¡n",
                    overdue + " hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng cÃƒÂ¡Ã‚ÂºÃ‚Â§n xÃƒÂ¡Ã‚Â»Ã‚Â­ lÃƒÆ’Ã‚Â½", "/facility/rentals"));
        }
        if (!expiring.isEmpty()) {
            attention.add(new AttentionItem("expiring", "warning", "HÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng sÃƒÂ¡Ã‚ÂºÃ‚Â¯p hÃƒÂ¡Ã‚ÂºÃ‚Â¿t hÃƒÂ¡Ã‚ÂºÃ‚Â¡n",
                    expiring.size() + " hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng hÃƒÂ¡Ã‚ÂºÃ‚Â¿t hÃƒÂ¡Ã‚ÂºÃ‚Â¡n trong " + EXPIRING_WINDOW_DAYS + " ngÃƒÆ’Ã‚Â y",
                    "/facility/rentals"));
        }
        long inInspection = unitByStatus.getOrDefault(StorageUnitStatus.INSPECTION, 0L);
        if (inInspection > 0) {
            attention.add(new AttentionItem("inspection", "warning", "Kho Ãƒâ€žÃ¢â‚¬Ëœang kiÃƒÂ¡Ã‚Â»Ã†â€™m tra",
                    inInspection + " kho chÃƒÂ¡Ã‚Â»Ã‚Â kiÃƒÂ¡Ã‚Â»Ã†â€™m Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh", "/facility/units"));
        }
        long activeTickets = tickets.countByFacilityIdAndStatusNot(facilityId,
                SupportTicket.Status.CLOSED);
        if (activeTickets > 0) {
            attention.add(new AttentionItem("tickets", "info", "Ticket Ãƒâ€žÃ¢â‚¬Ëœang mÃƒÂ¡Ã‚Â»Ã…Â¸",
                    activeTickets + " ticket cÃƒÂ¡Ã‚ÂºÃ‚Â§n xÃƒÂ¡Ã‚Â»Ã‚Â­ lÃƒÆ’Ã‚Â½", "/staff/operations"));
        }

        return new FacilityDashboard(total, occupied,
                unitByStatus.getOrDefault(StorageUnitStatus.AVAILABLE, 0L), inInspection,
                unitByStatus.getOrDefault(StorageUnitStatus.MAINTENANCE, 0L),
                rate(occupied, total), activeRentalsOf(allRentals), overdue, expiring.size(),
                allTasks.stream().filter(OpsService::isToday).count(),
                allTasks.stream().filter(task -> task.getStatus() != TaskStatus.DONE).count(),
                activeTickets, attention, expiring, occupancyByType);
    }

    @Transactional(readOnly = true)
    public List<RevenuePoint> revenueSeries(Long facilityId, int months) {
        requireAccess(facilityId);
        int window = Math.max(months, 1);
        List<Long> rentalIds = rentals.findByFacilityId(facilityId).stream()
                .map(Rental::getId).toList();
        if (rentalIds.isEmpty()) {
            return emptySeries(window);
        }
        List<Long> invoiceIds = invoices.findByRentalIdIn(rentalIds).stream()
                .map(Invoice::getId).toList();
        if (invoiceIds.isEmpty()) {
            return emptySeries(window);
        }
        Map<String, BigDecimal> byMonth = new HashMap<>();
        for (PaymentAttemptRepository.MonthlyAmount row :
                paymentAttempts.summarizePaidByMonth(invoiceIds)) {
            byMonth.put("%04d-%02d".formatted(row.getYear(), row.getMonth()), row.getTotal());
        }
        YearMonth cursor = YearMonth.now(ZoneOffset.UTC).minusMonths(window - 1L);
        List<RevenuePoint> points = new java.util.ArrayList<>();
        for (int i = 0; i < window; i++) {
            String key = "%04d-%02d".formatted(cursor.getYear(), cursor.getMonthValue());
            points.add(new RevenuePoint(key, cursor.format(MONTH_LABEL),
                    byMonth.getOrDefault(key, BigDecimal.ZERO)));
            cursor = cursor.plusMonths(1);
        }
        return points;
    }

    private static List<RevenuePoint> emptySeries(int window) {
        YearMonth cursor = YearMonth.now(ZoneOffset.UTC).minusMonths(window - 1L);
        List<RevenuePoint> points = new java.util.ArrayList<>();
        for (int i = 0; i < window; i++) {
            points.add(new RevenuePoint(
                    "%04d-%02d".formatted(cursor.getYear(), cursor.getMonthValue()),
                    cursor.format(MONTH_LABEL), BigDecimal.ZERO));
            cursor = cursor.plusMonths(1);
        }
        return points;
    }

    private static long activeRentalsOf(List<Rental> rentals) {
        return rentals.stream().filter(rental -> rental.getStatus() == RentalStatus.ACTIVE).count();
    }

    // ---------- helpers ----------

    private List<Long> staffIdsOf(Long facilityId) {
        return users.findByFacilityIdAndRoleInAndStatus(facilityId, List.copyOf(FACILITY_ROLES),
                        UserStatus.ACTIVE).stream()
                .map(User::getId).toList();
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
                        "NhÃƒÆ’Ã‚Â¢n viÃƒÆ’Ã‚Âªn khÃƒÆ’Ã‚Â´ng hÃƒÂ¡Ã‚Â»Ã‚Â£p lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ hoÃƒÂ¡Ã‚ÂºÃ‚Â·c Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ vÃƒÆ’Ã‚Â´ hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u hÃƒÆ’Ã‚Â³a"));
        if (!facilityId.equals(staff.getFacilityId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "NhÃƒÆ’Ã‚Â¢n viÃƒÆ’Ã‚Âªn khÃƒÆ’Ã‚Â´ng thuÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c cÃƒâ€ Ã‚Â¡ sÃƒÂ¡Ã‚Â»Ã…Â¸ nÃƒÆ’Ã‚Â y");
        }
        return staff;
    }

    private Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
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
                    "Thao tÃƒÆ’Ã‚Â¡c khÃƒÆ’Ã‚Â´ng ÃƒÆ’Ã‚Â¡p dÃƒÂ¡Ã‚Â»Ã‚Â¥ng cho viÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡c loÃƒÂ¡Ã‚ÂºÃ‚Â¡i " + task.getTaskType());
        }
    }

    private void requireTaskAccess(StaffTask task) {
        if (task.getRentalId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "ViÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡c hÃƒÂ¡Ã‚Â»Ã¢â‚¬â€ trÃƒÂ¡Ã‚Â»Ã‚Â£ khÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng Ãƒâ€žÃ¢â‚¬Ëœi kÃƒÆ’Ã‚Â¨m");
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

    private static Long unitTypeIdOf(Rental rental, Map<Long, UnitType> unitTypesById) {
        UnitType unitType = unitTypesById.get(rental.getUnitId());
        return unitType == null ? null : unitType.getId();
    }

    private boolean matchesRental(Rental rental, String search,
                                  Map<Long, UnitType> unitTypesById) {
        if (isBlank(search)) {
            return true;
        }
        StorageUnit unit = unit(rental.getUnitId());
        UnitType unitType = unitTypesById.get(rental.getUnitId());
        return matchesText(unit.getUnitCode(), unitType == null ? null : unitType.getName(), search);
    }

    private boolean matchesTask(StaffTask task, String search) {
        if (isBlank(search)) {
            return true;
        }
        String unitCode = task.getRentalId() == null ? null
                : units.findById(unitIdOfRental(task.getRentalId())).map(StorageUnit::getUnitCode)
                .orElse(null);
        return matchesText(String.valueOf(task.getId()), unitCode, search);
    }

    private Long unitIdOfRental(Long rentalId) {
        return rentalOf(rentalId).getUnitId();
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
                    "GiÃƒÆ’Ã‚Â¡ kho phÃƒÂ¡Ã‚ÂºÃ‚Â£i nÃƒÂ¡Ã‚ÂºÃ‚Â±m trong khoÃƒÂ¡Ã‚ÂºÃ‚Â£ng giÃƒÆ’Ã‚Â¡ cÃƒÂ¡Ã‚Â»Ã‚Â§a loÃƒÂ¡Ã‚ÂºÃ‚Â¡i kho");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean matchesText(String primary, String secondary, String search) {
        if (isBlank(search)) {
            return true;
        }
        String needle = search.trim().toLowerCase(Locale.ROOT);
        return (primary != null && primary.toLowerCase(Locale.ROOT).contains(needle))
                || (secondary != null && secondary.toLowerCase(Locale.ROOT).contains(needle));
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

    private static Map<Long, UnitType> unitTypesByUnitId(List<StorageUnit> units) {
        Map<Long, UnitType> byKey = new LinkedHashMap<>();
        for (StorageUnit unit : units) {
            byKey.put(unit.getId(), unit.getUnitType());
        }
        return byKey;
    }

    private static double rate(long part, long total) {
        return total == 0 ? 0d : BigDecimal.valueOf(part).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP).doubleValue();
    }

    private static StorageUnitDto toUnitDto(StorageUnit unit) {
        return new StorageUnitDto(unit.getId(), unit.getFacility().getId(),
                unit.getUnitType().getId(), unit.getUnitCode(), unit.getLocationLabel(),
                unit.getMonthlyPrice(), unit.getStatus());
    }

    private StaffTaskDto toTaskDto(StaffTask task) {
        Long unitId = task.getRentalId() == null ? null : unitIdOfRental(task.getRentalId());
        StorageUnit unit = unitId == null ? null : units.findById(unitId).orElse(null);
        String customerName = null;
        String paymentState = null;
        if (task.getRentalId() != null) {
            Rental rental = rentalOf(task.getRentalId());
            customerName = users.findById(rental.getCustomerId()).map(User::getFullName)
                    .orElse(null);
            paymentState = paymentStateOf(rental);
        }
        String assignedStaffName = users.findById(task.getAssignedStaffId())
                .map(User::getFullName).orElse(null);
        return new StaffTaskDto(task.getId(),
                unit == null ? null : unit.getFacility().getId(), task.getTaskType(),
                task.getStatus(), task.getAssignedStaffId(), assignedStaffName,
                task.getRentalId(), task.getTicketId(),
                unit == null ? null : unit.getUnitCode(), customerName, paymentState,
                task.getScheduledAt(), task.getCompletedAt(), task.getNotes());
    }

    private RentalDto toRentalDto(Rental rental) {
        StorageUnit unit = unit(rental.getUnitId());
        User customer = users.findById(rental.getCustomerId()).orElse(null);
        StaffTask openTask = staffTasks.findByRentalIdAndTaskTypeAndStatusNot(rental.getId(),
                        TaskType.HANDOVER, TaskStatus.CANCELLED).stream()
                .findFirst().orElse(null);
        return new RentalDto(rental.getId(), unit.getFacility().getId(),
                customer == null ? null : customer.getFullName(),
                customer == null ? null : customer.getPhone(), rental.getUnitId(),
                unit.getUnitCode(), unit.getUnitType().getId(), unit.getUnitType().getName(),
                rental.getStartDate(), rental.getEndDate(), rental.getPricePerMonth(),
                rental.getStatus(), paymentStateOf(rental), rental.getAppointmentAt(),
                rental.getCheckedInAt(), rental.getAccessMethod(), rental.getHandoverCondition(),
                rental.getReturnedAt(), rental.getReturnCondition(),
                openTask == null ? null : users.findById(openTask.getAssignedStaffId())
                        .map(User::getFullName).orElse(null),
                openTask == null ? null : openTask.getId());
    }

    private TicketDto toTicketDto(SupportTicket ticket) {
        String customerName = users.findById(ticket.getCustomerId()).map(User::getFullName)
                .orElse(null);
        String unitCode = ticket.getRentalId() == null ? null
                : units.findById(unitIdOfRental(ticket.getRentalId()))
                .map(StorageUnit::getUnitCode).orElse(null);
        String assignedStaffName = ticket.getAssignedStaffId() == null ? null
                : users.findById(ticket.getAssignedStaffId()).map(User::getFullName).orElse(null);
        return new TicketDto(ticket.getId(), ticket.getFacilityId(), customerName,
                ticket.getRentalId(), unitCode, ticket.getCategory(), ticket.getTitle(),
                ticket.getDescription(), ticket.getStatus(), ticket.getCreatedAt(),
                ticket.getResolvedAt(), assignedStaffName);
    }

    private String paymentStateOf(Rental rental) {
        List<Invoice> rentalInvoices = invoices.findByRentalIdOrderByCreatedAtDesc(rental.getId());
        boolean hasPending = false;
        for (Invoice invoice : rentalInvoices) {
            if (invoice.getStatus() == Invoice.Status.PAID) {
                return "PAID";
            }
            if (invoice.getStatus() == Invoice.Status.PENDING) {
                hasPending = true;
            }
        }
        if (!hasPending) {
            return null;
        }
        return rentalInvoices.stream()
                .filter(invoice -> invoice.getStatus() == Invoice.Status.PENDING)
                .anyMatch(invoice -> invoice.getDueAt() != null
                        && invoice.getDueAt().isBefore(Instant.now()))
                ? "OVERDUE" : "PENDING";
    }
}
