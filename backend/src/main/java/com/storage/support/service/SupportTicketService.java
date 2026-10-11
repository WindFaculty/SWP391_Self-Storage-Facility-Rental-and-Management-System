package com.storage.support.service;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                UserRepository userRepository) {
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SupportTicket create(Long customerId, Long facilityId, Long rentalId,
                                SupportTicket.Category category, String title,
                                String description) {
        return supportTicketRepository.save(
                SupportTicket.open(customerId, facilityId, rentalId, category, title, description));
    }

    @Transactional
    public SupportTicket assign(Long ticketId, Long staffId) {
        SupportTicket ticket = find(ticketId);
        User staff = userRepository.findById(staffId)
                .filter(user -> user.getRole() == UserRole.FACILITY_STAFF
                        && user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new IllegalStateException(
                        "staff not found, inactive or not a facility staff: " + staffId));
        if (staff.getFacilityId() == null || !staff.getFacilityId().equals(ticket.getFacilityId())) {
            throw new IllegalStateException("staff " + staffId
                    + " does not belong to facility " + ticket.getFacilityId());
        }
        if (!ticket.assign(staffId)) {
            throw new IllegalStateException("ticket cannot be assigned in status " + ticket.getStatus());
        }
        return ticket;
    }

    @Transactional
    public SupportTicket start(Long ticketId) {
        SupportTicket ticket = find(ticketId);
        if (!ticket.start()) {
            throw new IllegalStateException("ticket cannot start in status " + ticket.getStatus());
        }
        return ticket;
    }

    @Transactional
    public SupportTicket resolve(Long ticketId) {
        SupportTicket ticket = find(ticketId);
        if (!ticket.resolve(Instant.now())) {
            throw new IllegalStateException("ticket cannot be resolved in status " + ticket.getStatus());
        }
        return ticket;
    }

    @Transactional
    public SupportTicket close(Long ticketId) {
        SupportTicket ticket = find(ticketId);
        if (!ticket.close()) {
            throw new IllegalStateException("ticket cannot be closed in status " + ticket.getStatus());
        }
        return ticket;
    }

    @Transactional(readOnly = true)
    public SupportTicket get(long ticketId) {
        return find(ticketId);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> ticketsOfCustomer(Long customerId) {
        return supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> ticketsOfFacility(Long facilityId) {
        return supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);
    }

    private SupportTicket find(Long ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("ticket not found: " + ticketId));
    }
}
