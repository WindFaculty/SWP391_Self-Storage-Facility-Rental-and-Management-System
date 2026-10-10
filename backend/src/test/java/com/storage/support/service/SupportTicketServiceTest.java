package com.storage.support.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private UserRepository userRepository;

    private SupportTicketService supportTicketService;

    @BeforeEach
    void setUp() {
        supportTicketService = new SupportTicketService(supportTicketRepository, userRepository);
    }

    private static SupportTicket openTicket() {
        return SupportTicket.open(9L, 3L, null, SupportTicket.Category.ACCESS,
                "Gate code lost", "Please reset my gate code");
    }

    private static User facilityStaff(Long facilityId) {
        User staff = new User();
        staff.setRole(UserRole.FACILITY_STAFF);
        staff.setStatus(UserStatus.ACTIVE);
        staff.setFacilityId(facilityId);
        return staff;
    }

    @Test
    void createsOpenTicket() {
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
    void assignsStaffFromSameFacility() {
        SupportTicket ticket = openTicket();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(7L)).thenReturn(Optional.of(facilityStaff(3L)));

        SupportTicket assigned = supportTicketService.assign(1L, 7L);

        assertEquals(7L, assigned.getAssignedStaffId());
        assertEquals(SupportTicket.Status.OPEN, assigned.getStatus());
    }

    @Test
    void rejectsStaffFromAnotherFacility() {
        SupportTicket ticket = openTicket();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(7L)).thenReturn(Optional.of(facilityStaff(4L)));

        assertThrows(IllegalStateException.class, () -> supportTicketService.assign(1L, 7L));

        assertNull(ticket.getAssignedStaffId());
    }

    @Test
    void rejectsUnknownInactiveOrNonStaffUser() {
        SupportTicket ticket = openTicket();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> supportTicketService.assign(1L, 7L));

        User inactive = facilityStaff(3L);
        inactive.setStatus(UserStatus.DISABLED);
        when(userRepository.findById(8L)).thenReturn(Optional.of(inactive));

        assertThrows(IllegalStateException.class, () -> supportTicketService.assign(1L, 8L));
    }

    @Test
    void runsFullTicketWorkflow() {
        SupportTicket ticket = openTicket();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        supportTicketService.start(1L);
        assertEquals(SupportTicket.Status.IN_PROGRESS, ticket.getStatus());

        supportTicketService.resolve(1L);
        assertEquals(SupportTicket.Status.RESOLVED, ticket.getStatus());
        assertNotNull(ticket.getResolvedAt());

        supportTicketService.close(1L);
        assertEquals(SupportTicket.Status.CLOSED, ticket.getStatus());
    }

    @Test
    void rejectsTransitionsOutOfOrder() {
        SupportTicket ticket = openTicket();
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThrows(IllegalStateException.class, () -> supportTicketService.resolve(1L));
        assertThrows(IllegalStateException.class, () -> supportTicketService.close(1L));

        assertEquals(SupportTicket.Status.OPEN, ticket.getStatus());
    }

    @Test
    void rejectsAssignmentAfterResolution() {
        SupportTicket ticket = openTicket();
        ticket.start();
        ticket.resolve(java.time.Instant.now());
        when(supportTicketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(7L)).thenReturn(Optional.of(facilityStaff(3L)));

        assertThrows(IllegalStateException.class, () -> supportTicketService.assign(1L, 7L));
    }

    @Test
    void requiresTitleAndDescription() {
        assertThrows(IllegalArgumentException.class, () -> supportTicketService.create(
                9L, 3L, null, SupportTicket.Category.OTHER, " ", "desc"));

        verifyNoInteractions(supportTicketRepository);
    }
}
