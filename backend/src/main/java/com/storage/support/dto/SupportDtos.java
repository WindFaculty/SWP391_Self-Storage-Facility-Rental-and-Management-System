package com.storage.support.dto;

import com.storage.support.entity.SupportTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class SupportDtos {

    private SupportDtos() {
    }

    public record CreateTicketRequest(@NotNull Long facilityId,
                                      Long rentalId,
                                      @NotNull SupportTicket.Category category,
                                      @NotBlank @Size(max = 200) String title,
                                      @NotBlank String description) {
    }

    public record TicketResponse(Long id, Long customerId, Long facilityId, Long rentalId,
                                 Long assignedStaffId, String category, String title, String description,
                                 String status, Instant createdAt, Instant resolvedAt) {

        public static TicketResponse from(SupportTicket ticket) {
            return new TicketResponse(ticket.getId(), ticket.getCustomerId(), ticket.getFacilityId(),
                    ticket.getRentalId(), ticket.getAssignedStaffId(), ticket.getCategory().name(),
                    ticket.getTitle(), ticket.getDescription(), ticket.getStatus().name(),
                    ticket.getCreatedAt(), ticket.getResolvedAt());
        }
    }
}
