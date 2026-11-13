package com.storage.support.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.facility.entity.Facility;
import com.storage.facility.entity.StorageUnit;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.repository.RentalRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    private SupportTicketService supportTicketService;

    @BeforeEach
    void setUp() {
        supportTicketService = new SupportTicketService(
                supportTicketRepository, facilityRepository, rentalRepository, storageUnitRepository);
    }

    @Test
    void createsOpenTicket() {
        when(facilityRepository.existsById(3L)).thenReturn(true);
        when(supportTicketRepository.save(any(SupportTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SupportTicket ticket = supportTicketService.create(9L, 3L, null,
                SupportTicket.Category.ACCESS, "Gate code lost", "Please reset");

        assertEquals(SupportTicket.Status.OPEN, ticket.getStatus());
        assertEquals(SupportTicket.Category.ACCESS, ticket.getCategory());
        assertNotNull(ticket.getCreatedAt());
        assertNull(ticket.getAssignedStaffId());
    }

    @Test
    void rejectsForeignRentalIdor() {
        when(facilityRepository.existsById(3L)).thenReturn(true);
        Rental foreignRental = Rental.createHold(99L, 10L, LocalDate.now(),
                LocalDate.now().plusMonths(1), new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        when(rentalRepository.findById(55L)).thenReturn(Optional.of(foreignRental));

        BusinessException ex = assertThrows(BusinessException.class, () -> supportTicketService.create(
                9L, 3L, 55L, SupportTicket.Category.UNIT, "Unit lock", "Cannot open"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verifyNoInteractions(supportTicketRepository);
    }

    @Test
    void rejectsMismatchedFacilityForOwnedRental() {
        when(facilityRepository.existsById(3L)).thenReturn(true);
        Rental owned = Rental.createHold(9L, 10L, LocalDate.now(),
                LocalDate.now().plusMonths(1), new BigDecimal("1000000"), Instant.now().plusSeconds(900));
        when(rentalRepository.findById(55L)).thenReturn(Optional.of(owned));
        Facility otherFacility = new Facility();
        ReflectionTestUtils.setField(otherFacility, "id", 88L);
        StorageUnit unit = new StorageUnit();
        unit.setFacility(otherFacility);
        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(unit));

        BusinessException ex = assertThrows(BusinessException.class, () -> supportTicketService.create(
                9L, 3L, 55L, SupportTicket.Category.UNIT, "Unit lock", "Cannot open"));

        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        verifyNoInteractions(supportTicketRepository);
    }

    @Test
    void rejectsMissingFacility() {
        when(facilityRepository.existsById(999L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> supportTicketService.create(
                9L, 999L, null, SupportTicket.Category.OTHER, "Help", "Missing facility"));
        verifyNoInteractions(supportTicketRepository);
    }

    @Test
    void requiresTitleAndDescription() {
        assertThrows(IllegalArgumentException.class, () -> supportTicketService.create(
                9L, 3L, null, SupportTicket.Category.OTHER, " ", "desc"));

        verifyNoInteractions(supportTicketRepository);
    }

    @Test
    void listsCustomerTickets() {
        SupportTicket ticket = SupportTicket.open(9L, 3L, null, SupportTicket.Category.ACCESS,
                "Gate code lost", "Please reset my gate code");
        when(supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(9L))
                .thenReturn(List.of(ticket));

        assertEquals(List.of(ticket), supportTicketService.ticketsOfCustomer(9L));
    }
}
