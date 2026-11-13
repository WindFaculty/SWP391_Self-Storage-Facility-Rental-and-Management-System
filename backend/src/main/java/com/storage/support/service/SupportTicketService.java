package com.storage.support.service;

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
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final FacilityRepository facilityRepository;
    private final RentalRepository rentalRepository;
    private final StorageUnitRepository storageUnitRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                FacilityRepository facilityRepository,
                                RentalRepository rentalRepository,
                                StorageUnitRepository storageUnitRepository) {
        this.supportTicketRepository = supportTicketRepository;
        this.facilityRepository = facilityRepository;
        this.rentalRepository = rentalRepository;
        this.storageUnitRepository = storageUnitRepository;
    }

    @Transactional
    public SupportTicket create(Long customerId, Long facilityId, Long rentalId,
                                SupportTicket.Category category, String title,
                                String description) {
        SupportTicket ticket = SupportTicket.open(
                customerId, facilityId, rentalId, category, title, description);
        if (facilityId == null || !facilityRepository.existsById(facilityId)) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
        if (rentalId != null) {
            Rental rental = rentalRepository.findById(rentalId)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.RENTAL_NOT_FOUND));
            if (!rental.getCustomerId().equals(customerId)) {
                throw new BusinessException(ErrorCode.FORBIDDEN,
                        "Không thể tạo ticket cho hợp đồng của người khác");
            }
            StorageUnit unit = storageUnitRepository.findById(rental.getUnitId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
            if (!unit.getFacility().getId().equals(facilityId)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Hợp đồng không thuộc cơ sở đã chọn");
            }
        }
        return supportTicketRepository.save(ticket);
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
