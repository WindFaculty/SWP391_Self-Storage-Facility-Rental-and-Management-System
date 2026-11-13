package com.storage.ops.service;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.facility.service.FacilityAccessService;
import com.storage.ops.dto.OpsDtos.AssignTaskInput;
import com.storage.ops.dto.OpsDtos.FacilityDashboard;
import com.storage.ops.dto.OpsDtos.StaffTaskDto;
import com.storage.ops.dto.OpsDtos.TaskList;
import com.storage.ops.dto.OpsDtos.TicketTaskPair;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;
import com.storage.rental.repository.RentalRepository;
import com.storage.rental.repository.StaffTaskRepository;
import com.storage.rental.service.RentalService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.service.Analytics;
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsServiceTest {

    @Mock private FacilityRepository facilities;
    @Mock private UnitTypeRepository unitTypes;
    @Mock private StorageUnitRepository units;
    @Mock private RentalRepository rentals;
    @Mock private StaffTaskRepository staffTasks;
    @Mock private UserRepository users;
    @Mock private InvoiceRepository invoices;
    @Mock private SupportTicketRepository tickets;
    @Mock private FacilityAccessService facilityAccess;
    @Mock private Analytics analytics;
    @Mock private RentalService rentalService;

    private OpsService service;

    @BeforeEach
    void setUp() {
        service = new OpsService(facilities, unitTypes, units, rentals, staffTasks, users,
                invoices, tickets, facilityAccess, analytics, rentalService);
    }

    @Test
    void tasksFiltersByDayTodayUpcomingAllAndResolvesSupportFacilityId() {
        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant todayNoon = LocalDate.now(vn).atTime(12, 0).atZone(vn).toInstant();
        Instant tomorrowMorning = LocalDate.now(vn).plusDays(1).atTime(9, 0).atZone(vn).toInstant();

        User staff = user(7L, 1L, UserRole.FACILITY_STAFF, "Nhân viên A");
        User customer = user(90L, null, UserRole.CUSTOMER, "Khách Hỗ Trợ");
        SupportTicket ticket = SupportTicket.open(90L, 1L, null, SupportTicket.Category.LOCK,
                "Kẹt khóa", "Không mở được");
        ReflectionTestUtils.setField(ticket, "id", 55L);

        StaffTask todayTask = new StaffTask(7L, null, 55L, TaskType.SUPPORT, todayNoon);
        ReflectionTestUtils.setField(todayTask, "id", 1L);
        StaffTask upcomingTask = new StaffTask(7L, null, 55L, TaskType.SUPPORT, tomorrowMorning);
        ReflectionTestUtils.setField(upcomingTask, "id", 2L);
        StaffTask cancelledTask = new StaffTask(7L, null, 55L, TaskType.SUPPORT, todayNoon);
        ReflectionTestUtils.setField(cancelledTask, "id", 3L);
        cancelledTask.cancel();

        when(users.findByFacilityIdAndRoleInAndStatus(eqListFacility(), any(), eqActive()))
                .thenReturn(List.of(staff));
        when(staffTasks.findByAssignedStaffIdIn(List.of(7L)))
                .thenReturn(List.of(todayTask, upcomingTask, cancelledTask));
        when(tickets.findAllById(anyCollection())).thenReturn(List.of(ticket));
        when(users.findAllById(anyCollection())).thenReturn(List.of(staff, customer));

        TaskList todayList = service.tasks(1L, "all", null, "all", "today", null, null, false);
        assertThat(todayList.items()).hasSize(1);
        assertThat(todayList.items().get(0).id()).isEqualTo(1L);
        assertThat(todayList.items().get(0).facilityId()).isEqualTo(1L);
        assertThat(todayList.items().get(0).customerName()).isEqualTo("Khách Hỗ Trợ");
        assertThat(todayList.summary().byStatus().get(TaskStatus.ASSIGNED)).isEqualTo(1L);

        TaskList upcomingList = service.tasks(1L, "all", null, "all", "upcoming", null, null, false);
        assertThat(upcomingList.items()).hasSize(1);
        assertThat(upcomingList.items().get(0).id()).isEqualTo(2L);

        TaskList allList = service.tasks(1L, "all", null, "all", "all", null, null, false);
        assertThat(allList.items()).hasSize(2);
    }

    @Test
    void assignTaskRejectsMismatchedRentalStatus() {
        User staff = user(7L, 1L, UserRole.FACILITY_STAFF, "Nhân viên A");
        Facility facility = new Facility();
        ReflectionTestUtils.setField(facility, "id", 1L);
        StorageUnit unit = new StorageUnit();
        ReflectionTestUtils.setField(unit, "id", 10L);
        unit.setFacility(facility);

        Rental reserved = Rental.createHold(90L, 10L, LocalDate.now(), LocalDate.now().plusMonths(1),
                new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        ReflectionTestUtils.setField(reserved, "id", 100L);
        reserved.transitionTo(RentalStatus.RESERVED);

        when(users.findById(7L)).thenReturn(Optional.of(staff));
        when(rentals.findById(100L)).thenReturn(Optional.of(reserved));
        when(units.findById(10L)).thenReturn(Optional.of(unit));

        assertThatThrownBy(() -> service.assignTask(new AssignTaskInput(
                1L, 100L, TaskType.RETURN_INSPECTION, 7L, Instant.now(), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Loại công việc");
    }

    @Test
    void startAndCompleteSupportTaskSyncsSupportTicketLifecycle() {
        User staff = user(7L, 1L, UserRole.FACILITY_STAFF, "Nhân viên A");
        User customer = user(90L, null, UserRole.CUSTOMER, "Khách Hỗ Trợ");
        SupportTicket ticket = SupportTicket.open(90L, 1L, null, SupportTicket.Category.ACCESS,
                "Lỗi mã PIN", "Không vào được kho");
        ReflectionTestUtils.setField(ticket, "id", 66L);
        ticket.assign(7L);

        StaffTask task = new StaffTask(7L, null, 66L, TaskType.SUPPORT, Instant.now());
        ReflectionTestUtils.setField(task, "id", 11L);

        when(staffTasks.findById(11L)).thenReturn(Optional.of(task));
        when(tickets.findById(66L)).thenReturn(Optional.of(ticket));
        when(tickets.findAllById(anyCollection())).thenReturn(List.of(ticket));
        when(users.findAllById(anyCollection())).thenReturn(List.of(staff, customer));

        StaffTaskDto started = service.startTask(11L);
        assertThat(started.status()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(ticket.getStatus()).isEqualTo(SupportTicket.Status.IN_PROGRESS);

        StaffTaskDto completed = service.completeTask(11L, "Đã cấp lại mã");
        assertThat(completed.status()).isEqualTo(TaskStatus.DONE);
        assertThat(completed.notes()).isEqualTo("Đã cấp lại mã");
        assertThat(ticket.getStatus()).isEqualTo(SupportTicket.Status.RESOLVED);
        verify(facilityAccess, times(2)).requireFacilityAccess(1L);
    }

    @Test
    void assignTicketDeduplicatesExistingOpenTaskForSameStaff() {
        User staff = user(7L, 1L, UserRole.FACILITY_STAFF, "Nhân viên A");
        SupportTicket ticket = SupportTicket.open(90L, 1L, null, SupportTicket.Category.LOCK,
                "Kẹt khóa", "Không mở được");
        ReflectionTestUtils.setField(ticket, "id", 77L);
        ticket.assign(7L);

        StaffTask existingTask = new StaffTask(7L, null, 77L, TaskType.SUPPORT, Instant.now());
        ReflectionTestUtils.setField(existingTask, "id", 31L);

        when(tickets.findById(77L)).thenReturn(Optional.of(ticket));
        when(users.findById(7L)).thenReturn(Optional.of(staff));
        when(staffTasks.findByTicketId(77L)).thenReturn(List.of(existingTask));
        when(tickets.findAllById(anyCollection())).thenReturn(List.of(ticket));
        lenient().when(users.findAllById(anyCollection())).thenReturn(List.of(staff));

        TicketTaskPair pair = service.assignTicket(77L, 7L, Instant.now(), "Lần 2");

        assertThat(pair.task().id()).isEqualTo(31L);
        verify(staffTasks, never()).save(any());
    }

    @Test
    void dashboardExcludesCancelledTasksFromOpenCount() {
        User staff = user(7L, 1L, UserRole.FACILITY_STAFF, "Nhân viên A");
        StaffTask openTask = new StaffTask(7L, null, 88L, TaskType.SUPPORT, Instant.now());
        ReflectionTestUtils.setField(openTask, "id", 41L);
        StaffTask cancelledTask = new StaffTask(7L, null, 89L, TaskType.SUPPORT, Instant.now());
        ReflectionTestUtils.setField(cancelledTask, "id", 42L);
        cancelledTask.cancel();

        when(units.findByFacilityId(1L)).thenReturn(List.of());
        when(rentals.findByFacilityId(1L)).thenReturn(List.of());
        when(users.findByFacilityIdAndRoleInAndStatus(eqListFacility(), any(), eqActive()))
                .thenReturn(List.of(staff));
        when(staffTasks.findByAssignedStaffIdIn(List.of(7L)))
                .thenReturn(List.of(openTask, cancelledTask));
        when(tickets.countByFacilityIdAndStatusNot(1L, SupportTicket.Status.CLOSED)).thenReturn(0L);

        FacilityDashboard dashboard = service.dashboard(1L);

        assertThat(dashboard.tasksOpen()).isEqualTo(1L);
        verify(rentalService).markOverdueRentals();
    }

    private static Long eqListFacility() {
        return org.mockito.ArgumentMatchers.eq(1L);
    }

    private static UserStatus eqActive() {
        return org.mockito.ArgumentMatchers.eq(UserStatus.ACTIVE);
    }

    private static User user(Long id, Long facilityId, UserRole role, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setFacilityId(facilityId);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setFullName(name);
        user.setEmail("u" + id + "@demo.local");
        return user;
    }
}
