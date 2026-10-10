package com.storage.support.service;

import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.time.Instant;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final JdbcTemplate jdbcTemplate;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                JdbcTemplate jdbcTemplate) {
        this.supportTicketRepository = supportTicketRepository;
        this.jdbcTemplate = jdbcTemplate;
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
        // ponytail: raw lookup until BE1's account module lands; staff must be active FACILITY_STAFF.
        Long staffFacilityId;
        try {
            staffFacilityId = jdbcTemplate.queryForObject(
                    "select facility_id from users where id = ? and role = 'FACILITY_STAFF' and status = 'ACTIVE'",
                    Long.class, staffId);
        } catch (EmptyResultDataAccessException e) {
            staffFacilityId = null;
        }
        if (staffFacilityId == null) {
            throw new IllegalStateException("staff not found, inactive or not a facility staff: " + staffId);
        }
        if (!staffFacilityId.equals(ticket.getFacilityId())) {
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

    private SupportTicket find(Long ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("ticket not found: " + ticketId));
    }
}
