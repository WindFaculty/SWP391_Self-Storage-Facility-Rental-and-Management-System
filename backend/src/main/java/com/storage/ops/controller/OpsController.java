package com.storage.ops.controller;

import com.storage.facility.entity.StorageUnitStatus;
import com.storage.rental.entity.TaskStatus;
import com.storage.ops.dto.OpsDtos;
import com.storage.ops.dto.OpsDtos.AssignTicketInput;
import com.storage.ops.dto.OpsDtos.FacilityDto;
import com.storage.ops.dto.OpsDtos.FacilityDashboard;
import com.storage.ops.dto.OpsDtos.HandoverInput;
import com.storage.ops.dto.OpsDtos.RentalDto;
import com.storage.ops.dto.OpsDtos.RentalList;
import com.storage.ops.dto.OpsDtos.ReturnInput;
import com.storage.shared.service.Analytics.MonthPoint;
import com.storage.ops.dto.OpsDtos.StaffMemberDto;
import com.storage.ops.dto.OpsDtos.StaffTaskDto;
import com.storage.ops.dto.OpsDtos.StorageUnitDto;
import com.storage.ops.dto.OpsDtos.StorageUnitInput;
import com.storage.ops.dto.OpsDtos.TaskList;
import com.storage.ops.dto.OpsDtos.TaskRentalPair;
import com.storage.ops.dto.OpsDtos.TicketDto;
import com.storage.ops.dto.OpsDtos.TicketList;
import com.storage.ops.dto.OpsDtos.TicketTaskPair;
import com.storage.ops.dto.OpsDtos.UnitInspectionInput;
import com.storage.ops.dto.OpsDtos.UnitList;
import com.storage.ops.dto.OpsDtos.UnitStatusInput;
import com.storage.ops.dto.OpsDtos.UnitTypeDto;
import com.storage.ops.service.OpsService;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

/**
 * Facility workspace endpoints. Paths mirror the FE2 adapters in
 * frontend/src/features/facility/api and frontend/src/features/staff.
 */
@RestController
@RequestMapping("/ops")
public class OpsController {

    private final OpsService ops;

    public OpsController(OpsService ops) {
        this.ops = ops;
    }

    // ---------- catalog ----------

    @GetMapping("/facilities")
    public com.storage.shared.response.ApiResponse<List<FacilityDto>> facilities() {
        return com.storage.shared.response.ApiResponse.success(ops.facilities());
    }

    @GetMapping("/unit-types")
    public com.storage.shared.response.ApiResponse<List<UnitTypeDto>> unitTypes() {
        return com.storage.shared.response.ApiResponse.success(ops.unitTypes());
    }

    // ---------- units ----------

    @GetMapping("/units")
    public com.storage.shared.response.ApiResponse<UnitList> units(
            @RequestParam Long facilityId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long unitTypeId,
            @RequestParam(required = false) StorageUnitStatus status,
            @RequestParam(required = false) String priceBand) {
        return com.storage.shared.response.ApiResponse.success(
                ops.units(facilityId, search, unitTypeId, status, priceBand));
    }

    @PostMapping("/units")
    public org.springframework.http.ResponseEntity<com.storage.shared.response.ApiResponse<StorageUnitDto>> createUnit(
            @Valid @RequestBody StorageUnitInput input) {
        return org.springframework.http.ResponseEntity.status(
                        org.springframework.http.HttpStatus.CREATED)
                .body(com.storage.shared.response.ApiResponse.success(ops.createUnit(input)));
    }

    @PutMapping("/units/{unitId}")
    public com.storage.shared.response.ApiResponse<StorageUnitDto> updateUnit(
            @PathVariable Long unitId, @Valid @RequestBody StorageUnitInput input) {
        return com.storage.shared.response.ApiResponse.success(ops.updateUnit(unitId, input));
    }

    @PatchMapping("/units/{unitId}/status")
    public com.storage.shared.response.ApiResponse<StorageUnitDto> changeUnitStatus(
            @PathVariable Long unitId, @Valid @RequestBody UnitStatusInput input) {
        return com.storage.shared.response.ApiResponse.success(ops.changeUnitStatus(unitId, input));
    }

    // ---------- rentals ----------

    @GetMapping("/rentals")
    public com.storage.shared.response.ApiResponse<RentalList> rentals(
            @RequestParam Long facilityId,
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentState,
            @RequestParam(required = false) Long unitTypeId) {
        return com.storage.shared.response.ApiResponse.success(
                ops.rentals(facilityId, tab, search, paymentState, unitTypeId));
    }

    @GetMapping("/rentals/{rentalId}")
    public com.storage.shared.response.ApiResponse<RentalDto> rental(@PathVariable Long rentalId) {
        return com.storage.shared.response.ApiResponse.success(ops.rental(rentalId));
    }

    // ---------- staff ----------

    @GetMapping("/staff")
    public com.storage.shared.response.ApiResponse<List<StaffMemberDto>> staff(
            @RequestParam Long facilityId) {
        return com.storage.shared.response.ApiResponse.success(ops.staff(facilityId));
    }

    // ---------- tasks ----------

    @GetMapping("/tasks")
    public com.storage.shared.response.ApiResponse<TaskList> tasks(
            @RequestParam Long facilityId,
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) String slot,
            @RequestParam(required = false) String day,
            @RequestParam(required = false) Long rentalId,
            @RequestParam(required = false) String search) {
        return com.storage.shared.response.ApiResponse.success(
                ops.tasks(facilityId, tab, status, slot, day, rentalId, search, isFacilityStaff()));
    }

    @PostMapping("/tasks")
    public org.springframework.http.ResponseEntity<com.storage.shared.response.ApiResponse<StaffTaskDto>> assignTask(
            @Valid @RequestBody OpsDtos.AssignTaskInput input) {
        return org.springframework.http.ResponseEntity.status(
                        org.springframework.http.HttpStatus.CREATED)
                .body(com.storage.shared.response.ApiResponse.success(ops.assignTask(input)));
    }

    @PostMapping("/tasks/{taskId}/start")
    public com.storage.shared.response.ApiResponse<StaffTaskDto> startTask(
            @PathVariable Long taskId) {
        return com.storage.shared.response.ApiResponse.success(ops.startTask(taskId));
    }

    @PostMapping("/tasks/{taskId}/complete")
    public com.storage.shared.response.ApiResponse<StaffTaskDto> completeTask(
            @PathVariable Long taskId, @RequestBody(required = false) String notes) {
        return com.storage.shared.response.ApiResponse.success(ops.completeTask(taskId, notes));
    }

    @PostMapping("/tasks/{taskId}/handover")
    public com.storage.shared.response.ApiResponse<TaskRentalPair> completeHandover(
            @PathVariable Long taskId, @Valid @RequestBody HandoverInput input) {
        return com.storage.shared.response.ApiResponse.success(
                ops.completeHandover(taskId, input));
    }

    @PostMapping("/tasks/{taskId}/return")
    public com.storage.shared.response.ApiResponse<TaskRentalPair> completeReturn(
            @PathVariable Long taskId, @Valid @RequestBody ReturnInput input) {
        return com.storage.shared.response.ApiResponse.success(ops.completeReturn(taskId, input));
    }

    @PostMapping("/tasks/{taskId}/inspection")
    public com.storage.shared.response.ApiResponse<TaskRentalPair> completeUnitInspection(
            @PathVariable Long taskId, @Valid @RequestBody UnitInspectionInput input) {
        return com.storage.shared.response.ApiResponse.success(
                ops.completeUnitInspection(taskId, input));
    }

    // ---------- tickets ----------

    @GetMapping("/tickets")
    public com.storage.shared.response.ApiResponse<TicketList> tickets(
            @RequestParam Long facilityId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return com.storage.shared.response.ApiResponse.success(
                ops.tickets(facilityId, status, search));
    }

    @GetMapping("/tickets/{ticketId}")
    public com.storage.shared.response.ApiResponse<TicketDto> ticket(@PathVariable Long ticketId) {
        return com.storage.shared.response.ApiResponse.success(ops.ticket(ticketId));
    }

    @PostMapping("/tickets/{ticketId}/assign")
    public com.storage.shared.response.ApiResponse<TicketTaskPair> assignTicket(
            @PathVariable Long ticketId, @Valid @RequestBody AssignTicketInput input) {
        return com.storage.shared.response.ApiResponse.success(
                ops.assignTicket(ticketId, input.staffId(), input.scheduledAt(), input.notes()));
    }

    @PostMapping("/tickets/{ticketId}/close")
    public com.storage.shared.response.ApiResponse<TicketDto> closeTicket(
            @PathVariable Long ticketId) {
        return com.storage.shared.response.ApiResponse.success(ops.closeTicket(ticketId));
    }

    @PostMapping("/tickets/{ticketId}/start")
    public com.storage.shared.response.ApiResponse<TicketDto> startTicket(
            @PathVariable Long ticketId) {
        return com.storage.shared.response.ApiResponse.success(ops.startTicket(ticketId));
    }

    @PostMapping("/tickets/{ticketId}/resolve")
    public com.storage.shared.response.ApiResponse<TicketDto> resolveTicket(
            @PathVariable Long ticketId) {
        return com.storage.shared.response.ApiResponse.success(ops.resolveTicket(ticketId));
    }

    // ---------- dashboard & revenue ----------

    @GetMapping("/facilities/{facilityId}/dashboard")
    public com.storage.shared.response.ApiResponse<FacilityDashboard> dashboard(
            @PathVariable Long facilityId) {
        return com.storage.shared.response.ApiResponse.success(ops.dashboard(facilityId));
    }

    @GetMapping("/facilities/{facilityId}/revenue")
    public com.storage.shared.response.ApiResponse<List<MonthPoint>> revenue(
            @PathVariable Long facilityId,
            @RequestParam(defaultValue = "6") int months) {
        return com.storage.shared.response.ApiResponse.success(
                ops.revenueSeries(facilityId, months));
    }

    private static boolean isFacilityStaff() {
        Optional<UserPrincipal> principal = SecurityUtils.getCurrentUserPrincipal();
        return principal.map(UserPrincipal::getRole)
                .filter(role -> role.name().equals("FACILITY_STAFF"))
                .isPresent();
    }
}
