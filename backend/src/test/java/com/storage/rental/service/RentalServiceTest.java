package com.storage.rental.service;

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
import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.rental.dto.RentalDtos.ReturnRequest;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.repository.RentalRenewalRepository;
import com.storage.rental.repository.RentalRepository;
import com.storage.rental.repository.StaffTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RentalServiceTest {

    @Mock private RentalRepository rentals;
    @Mock private RentalRenewalRepository renewals;
    @Mock private StaffTaskRepository staffTasks;
    @Mock private InvoiceRepository invoices;
    @Mock private BusinessPolicyRepository policies;
    @Mock private UnitTypeRepository unitTypes;
    @Mock private FacilityRepository facilities;
    @Mock private StorageUnitRepository units;
    @Mock private UserRepository users;

    private RentalService service;

    @BeforeEach
    void setUp() {
        service = new RentalService(rentals, renewals, staffTasks, invoices, policies,
                unitTypes, facilities, units, users);
    }

    @Test
    void requestReturnPrefersFacilityStaffOrderedByIdOverManager() {
        Facility facility = new Facility();
        ReflectionTestUtils.setField(facility, "id", 1L);
        facility.setName("Kho Quận 1");

        UnitType unitType = new UnitType();
        ReflectionTestUtils.setField(unitType, "id", 2L);
        unitType.setName("Locker");

        StorageUnit unit = new StorageUnit();
        ReflectionTestUtils.setField(unit, "id", 10L);
        unit.setFacility(facility);
        unit.setUnitType(unitType);
        unit.setUnitCode("Q1-01");
        unit.setMonthlyPrice(new BigDecimal("1000000"));

        Rental rental = Rental.createHold(50L, 10L, LocalDate.now().minusMonths(1),
                LocalDate.now().plusMonths(1), new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        ReflectionTestUtils.setField(rental, "id", 100L);
        rental.transitionTo(RentalStatus.RESERVED);
        rental.transitionTo(RentalStatus.ACTIVE);

        User staff9 = user(9L, 1L, UserRole.FACILITY_STAFF);
        User staff4 = user(4L, 1L, UserRole.FACILITY_STAFF);

        when(rentals.findByIdAndCustomerId(100L, 50L)).thenReturn(Optional.of(rental));
        when(units.findById(10L)).thenReturn(Optional.of(unit));
        when(users.findByFacilityIdAndRoleInAndStatus(1L, List.of(UserRole.FACILITY_STAFF), UserStatus.ACTIVE))
                .thenReturn(List.of(staff9, staff4));
        lenient().when(invoices.findByRentalIdOrderByCreatedAtDesc(100L)).thenReturn(List.of());

        service.requestReturn(50L, 100L, new ReturnRequest(LocalDate.now().plusDays(1), "Trả sớm"));

        ArgumentCaptor<StaffTask> taskCaptor = ArgumentCaptor.forClass(StaffTask.class);
        verify(staffTasks).save(taskCaptor.capture());
        assertThat(taskCaptor.getValue().getAssignedStaffId()).isEqualTo(4L);
        assertThat(rental.getStatus()).isEqualTo(RentalStatus.RETURN_REQUESTED);
    }

    @Test
    void requestReturnFallsBackToFacilityManagerWhenNoStaffExists() {
        Facility facility = new Facility();
        ReflectionTestUtils.setField(facility, "id", 1L);
        UnitType unitType = new UnitType();
        ReflectionTestUtils.setField(unitType, "id", 2L);
        StorageUnit unit = new StorageUnit();
        ReflectionTestUtils.setField(unit, "id", 10L);
        unit.setFacility(facility);
        unit.setUnitType(unitType);
        unit.setUnitCode("Q1-01");
        unit.setMonthlyPrice(new BigDecimal("1000000"));

        Rental rental = Rental.createHold(50L, 10L, LocalDate.now().minusMonths(1),
                LocalDate.now().plusMonths(1), new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        ReflectionTestUtils.setField(rental, "id", 101L);
        rental.transitionTo(RentalStatus.RESERVED);
        rental.transitionTo(RentalStatus.ACTIVE);

        User manager = user(2L, 1L, UserRole.FACILITY_MANAGER);
        when(rentals.findByIdAndCustomerId(101L, 50L)).thenReturn(Optional.of(rental));
        when(units.findById(10L)).thenReturn(Optional.of(unit));
        when(users.findByFacilityIdAndRoleInAndStatus(1L, List.of(UserRole.FACILITY_STAFF), UserStatus.ACTIVE))
                .thenReturn(List.of());
        when(users.findByFacilityIdAndRoleInAndStatus(1L, List.of(UserRole.FACILITY_MANAGER), UserStatus.ACTIVE))
                .thenReturn(List.of(manager));
        when(invoices.findByRentalIdOrderByCreatedAtDesc(101L)).thenReturn(List.of());

        service.requestReturn(50L, 101L, new ReturnRequest(null, null));

        ArgumentCaptor<StaffTask> taskCaptor = ArgumentCaptor.forClass(StaffTask.class);
        verify(staffTasks).save(taskCaptor.capture());
        assertThat(taskCaptor.getValue().getAssignedStaffId()).isEqualTo(2L);
    }

    @Test
    void markOverdueRentalsTransitionsActiveRentalsPastGraceAndCreatesPenaltyInvoiceIdempotently() {
        BusinessPolicy policy = BusinessPolicy.initial();
        policy.update(new BigDecimal("20"), 7, new BigDecimal("100000"), 3,
                2, new BigDecimal("50000"), new BigDecimal("10"), 1L);

        LocalDate vnToday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        Rental overdue = Rental.createHold(50L, 10L, vnToday.minusMonths(1),
                vnToday.minusDays(4), new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        ReflectionTestUtils.setField(overdue, "id", 200L);
        overdue.transitionTo(RentalStatus.RESERVED);
        overdue.transitionTo(RentalStatus.ACTIVE);

        when(policies.findById(BusinessPolicy.ID)).thenReturn(Optional.of(policy));
        when(rentals.findByStatusAndEndDateBefore(eq(RentalStatus.ACTIVE), eq(vnToday.minusDays(2))))
                .thenReturn(List.of(overdue));
        when(invoices.existsByRentalIdAndTypeAndStatus(200L, Invoice.Type.OVERDUE, Invoice.Status.PENDING))
                .thenReturn(false);

        int count = service.markOverdueRentals();

        assertThat(count).isEqualTo(1);
        assertThat(overdue.getStatus()).isEqualTo(RentalStatus.OVERDUE);
        ArgumentCaptor<Invoice> invCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoices).save(invCaptor.capture());
        assertThat(invCaptor.getValue().getType()).isEqualTo(Invoice.Type.OVERDUE);
        assertThat(invCaptor.getValue().getAmount()).isEqualByComparingTo("200000.00");
    }

    private static User user(Long id, Long facilityId, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setFacilityId(facilityId);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setFullName("User " + id);
        user.setEmail("u" + id + "@demo.local");
        return user;
    }
}

