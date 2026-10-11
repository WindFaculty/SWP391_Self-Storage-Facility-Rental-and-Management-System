package com.storage.support.controller;

import com.storage.account.service.ActivityLogService;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import com.storage.support.dto.SupportDtos.CreateTicketRequest;
import com.storage.support.dto.SupportDtos.TicketResponse;
import com.storage.support.entity.SupportTicket;
import com.storage.support.service.SupportTicketService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer-facing ticket creation. Facility staff work tickets through
 * /ops/tickets (OpsController).
 */
@RestController
public class SupportController {

    private final SupportTicketService supportTicketService;
    private final ActivityLogService activityLogService;

    public SupportController(SupportTicketService supportTicketService,
                             ActivityLogService activityLogService) {
        this.supportTicketService = supportTicketService;
        this.activityLogService = activityLogService;
    }

    @PostMapping("/support-tickets")
    public ResponseEntity<ApiResponse<TicketResponse>> create(@Valid @RequestBody CreateTicketRequest request) {
        Long customerId = SecurityUtils.requireCurrentUserId();
        SupportTicket ticket = supportTicketService.create(customerId, request.facilityId(),
                request.rentalId(), request.category(), request.title(), request.description());
        activityLogService.record(customerId, "SUPPORT_TICKET_CREATED", "SUPPORT_TICKET",
                ticket.getId(), null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(TicketResponse.from(ticket)));
    }

    @GetMapping("/support-tickets/me")
    public ApiResponse<List<TicketResponse>> mine() {
        return ApiResponse.success(supportTicketService.ticketsOfCustomer(SecurityUtils.requireCurrentUserId()).stream()
                .map(TicketResponse::from)
                .toList());
    }
}
