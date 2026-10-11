package com.storage.support.controller;

import com.storage.account.entity.UserRole;
import com.storage.account.service.ActivityLogService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.security.UserPrincipal;
import com.storage.support.dto.SupportDtos.AssignRequest;
import com.storage.support.dto.SupportDtos.CreateTicketRequest;
import com.storage.support.dto.SupportDtos.TicketResponse;
import com.storage.support.entity.SupportTicket;
import com.storage.support.service.SupportTicketService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SupportController {

    private final SupportTicketService supportTicketService;
    private final ActivityLogService activityLogService;

    public SupportController(SupportTicketService supportTicketService,
                             ActivityLogService activityLogService) {
        this.supportTicketService = supportTicketService;
        this.activityLogService = activityLogService;
    }

    @PostMapping("/customer/support-tickets")
    public ResponseEntity<ApiResponse<TicketResponse>> create(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createTicket(currentUserId(), request)));
    }

    @PostMapping("/support-tickets")
    public ResponseEntity<ApiResponse<TicketResponse>> createCustomerAlias(
            @Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createTicket(currentUserId(), request)));
    }

    @GetMapping("/customer/support-tickets")
    public ApiResponse<List<TicketResponse>> mine() {
        return ApiResponse.success(supportTicketService.ticketsOfCustomer(currentUserId()).stream()
                .map(TicketResponse::from)
                .toList());
    }

    @GetMapping("/support-tickets/me")
    public ApiResponse<List<TicketResponse>> mineCustomerAlias() {
        return mine();
    }

    private TicketResponse createTicket(Long customerId, CreateTicketRequest request) {
        SupportTicket ticket = supportTicketService.create(customerId, request.facilityId(),
                request.rentalId(), request.category(), request.title(), request.description());
        activityLogService.record(customerId, "SUPPORT_TICKET_CREATED", "SUPPORT_TICKET",
                ticket.getId(), null);
        return TicketResponse.from(ticket);
    }

    @GetMapping("/staff/support-tickets")
    public ApiResponse<List<TicketResponse>> facilityTickets(@RequestParam(required = false) Long facilityId) {
        return ApiResponse.success(supportTicketService.ticketsOfFacility(resolveFacilityScope(facilityId))
                .stream()
                .map(TicketResponse::from)
                .toList());
    }

    @PostMapping("/staff/support-tickets/{ticketId}/assign")
    public ApiResponse<TicketResponse> assign(@PathVariable Long ticketId,
                                              @Valid @RequestBody AssignRequest request) {
        requireSameFacility(supportTicketService.get(ticketId).getFacilityId());
        SupportTicket ticket = supportTicketService.assign(ticketId, request.staffId());
        activityLogService.record(currentUserId(), "SUPPORT_TICKET_ASSIGNED", "SUPPORT_TICKET", ticketId, null);
        return ApiResponse.success(TicketResponse.from(ticket));
    }

    @PostMapping("/staff/support-tickets/{ticketId}/start")
    public ApiResponse<TicketResponse> start(@PathVariable Long ticketId) {
        requireSameFacility(supportTicketService.get(ticketId).getFacilityId());
        SupportTicket ticket = supportTicketService.start(ticketId);
        activityLogService.record(currentUserId(), "SUPPORT_TICKET_STARTED", "SUPPORT_TICKET", ticketId, null);
        return ApiResponse.success(TicketResponse.from(ticket));
    }

    @PostMapping("/staff/support-tickets/{ticketId}/resolve")
    public ApiResponse<TicketResponse> resolve(@PathVariable Long ticketId) {
        requireSameFacility(supportTicketService.get(ticketId).getFacilityId());
        SupportTicket ticket = supportTicketService.resolve(ticketId);
        activityLogService.record(currentUserId(), "SUPPORT_TICKET_RESOLVED", "SUPPORT_TICKET", ticketId, null);
        return ApiResponse.success(TicketResponse.from(ticket));
    }

    @PostMapping("/staff/support-tickets/{ticketId}/close")
    public ApiResponse<TicketResponse> close(@PathVariable Long ticketId) {
        requireSameFacility(supportTicketService.get(ticketId).getFacilityId());
        SupportTicket ticket = supportTicketService.close(ticketId);
        activityLogService.record(currentUserId(), "SUPPORT_TICKET_CLOSED", "SUPPORT_TICKET", ticketId, null);
        return ApiResponse.success(TicketResponse.from(ticket));
    }

    private static Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }

    private static UserPrincipal currentPrincipal() {
        return SecurityUtils.getCurrentUserPrincipal()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }

    private static void requireSameFacility(Long facilityId) {
        UserPrincipal principal = currentPrincipal();
        if (principal.getRole() == UserRole.ADMIN) {
            return;
        }
        if (principal.getFacilityId() == null || !principal.getFacilityId().equals(facilityId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private static Long resolveFacilityScope(Long requestedFacilityId) {
        UserPrincipal principal = currentPrincipal();
        if (principal.getRole() == UserRole.ADMIN) {
            if (requestedFacilityId == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "facilityId là bắt buộc với admin");
            }
            return requestedFacilityId;
        }
        if (principal.getFacilityId() == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (requestedFacilityId != null && !requestedFacilityId.equals(principal.getFacilityId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return principal.getFacilityId();
    }
}
