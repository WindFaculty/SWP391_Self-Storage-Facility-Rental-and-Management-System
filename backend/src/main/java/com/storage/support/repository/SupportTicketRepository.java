package com.storage.support.repository;

import com.storage.support.entity.SupportTicket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<SupportTicket> findByFacilityIdOrderByCreatedAtDesc(Long facilityId);

    List<SupportTicket> findByFacilityId(Long facilityId);

    long countByFacilityIdAndStatusNot(Long facilityId, SupportTicket.Status status);
}
