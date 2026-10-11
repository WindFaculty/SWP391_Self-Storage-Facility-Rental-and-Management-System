package com.storage.support.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    private SupportTicketService supportTicketService;

    @BeforeEach
    void setUp() {
        supportTicketService = new SupportTicketService(supportTicketRepository);
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
