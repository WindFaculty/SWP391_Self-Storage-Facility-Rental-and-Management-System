package com.storage.support.service;

import com.storage.support.entity.SupportTicket;
import com.storage.support.repository.SupportTicketRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository) {
        this.supportTicketRepository = supportTicketRepository;
    }

    @Transactional
    public SupportTicket create(Long customerId, Long facilityId, Long rentalId,
                                SupportTicket.Category category, String title,
                                String description) {
        return supportTicketRepository.save(
                SupportTicket.open(customerId, facilityId, rentalId, category, title, description));
    }

    @Transactional(readOnly = true)
    public SupportTicket get(long ticketId) {
        return find(ticketId);
    }

    @Transactional(readOnly = true)
    public List<SupportTicket> ticketsOfCustomer(Long customerId) {
        return supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    private SupportTicket find(Long ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("ticket not found: " + ticketId));
    }
}
