package com.storage.ops.dto;

import com.storage.facility.entity.FacilityStatus;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.rental.entity.AccessMethod;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;
import com.storage.support.entity.SupportTicket;

import com.storage.account.entity.UserRole;

import java.math.BigDecimal;
import java.time.Instant;

public final class OpsDtos {

    private OpsDtos() {
    }

    public record FacilityDto(Long id, String code, String name, String address,
                              FacilityStatus status) {
    }

    public record UnitTypeDto(Long id, String name, BigDecimal sizeM2, String description,
                              BigDecimal minMonthlyPrice, BigDecimal maxMonthlyPrice) {
    }

    public record StorageUnitDto(Long id, Long facilityId, Long unitTypeId, String unitCode,
                                 String locationLabel, BigDecimal monthlyPrice,
                                 StorageUnitStatus status) {
    }

    public record StorageUnitInput(Long facilityId, Long unitTypeId, String unitCode,
                                   String locationLabel, BigDecimal monthlyPrice) {
    }

    public record UnitStatusInput(StorageUnitStatus status, String reason) {
    }

    public record UnitSummary(long total, java.util.Map<StorageUnitStatus, Long> byStatus) {
    }

    public record UnitList(java.util.List<StorageUnitDto> items, UnitSummary summary) {
    }

    public record RentalDto(Long id, Long facilityId, String customerName, String customerPhone,
                            Long unitId, String unitCode, Long unitTypeId, String unitTypeName,
                            java.time.LocalDate startDate, java.time.LocalDate endDate,
                            BigDecimal pricePerMonth, RentalStatus status, String paymentState,
                            Instant appointmentAt, Instant checkedInAt, AccessMethod accessMethod,
                            String handoverCondition, Instant returnedAt, String returnCondition,
                            String assignedStaffName, Long openHandoverTaskId) {
    }

    public record RentalSummary(long total, java.util.Map<RentalStatus, Long> byStatus,
                                java.util.Map<String, Long> byTab) {
    }

    public record RentalList(java.util.List<RentalDto> items, RentalSummary summary) {
    }

    public record StaffMemberDto(Long id, String fullName, Long facilityId) {
    }

    public record StaffTaskDto(Long id, Long facilityId, TaskType taskType, TaskStatus status,
                               Long assignedStaffId, String assignedStaffName, Long rentalId,
                               Long ticketId, String unitCode, String customerName,
                               String paymentState, Instant scheduledAt, Instant completedAt,
                               String notes) {
    }

    public record TaskSummary(java.util.Map<TaskStatus, Long> byStatus,
                              java.util.Map<TaskType, Long> byType) {
    }

    public record TaskList(java.util.List<StaffTaskDto> items, TaskSummary summary) {
    }

    public record AssignTaskInput(Long facilityId, Long rentalId, TaskType taskType,
                                  Long assignedStaffId, Instant scheduledAt, String notes) {
    }

    public record HandoverInput(AccessMethod accessMethod, String handoverCondition) {
    }

    public record ReturnInput(String condition) {
    }

    public record UnitInspectionInput(String result, String notes) {
    }

    public record TaskRentalPair(StaffTaskDto task, RentalDto rental) {
    }

    public record TicketDto(Long id, Long facilityId, String customerName, Long rentalId,
                            String unitCode, SupportTicket.Category category, String title,
                            String description, SupportTicket.Status status, Instant createdAt,
                            Instant resolvedAt, String assignedStaffName) {
    }

    public record TicketList(java.util.List<TicketDto> items, long activeCount) {
    }

    public record AssignTicketInput(Long facilityId, Long ticketId, Long staffId, Instant scheduledAt,
                                    String notes) {
    }

    public record TicketTaskPair(TicketDto ticket, StaffTaskDto task) {
    }

    public record AttentionItem(String id, String severity, String title, String detail,
                                String path) {
    }

    public record OccupancyByType(String name, long occupied, long total, double rate) {
    }

    public record FacilityDashboard(long unitTotal, long unitOccupied, long unitAvailable,
                                    long unitInspection, long unitMaintenance, double occupancyRate,
                                    long activeRentals, long overdueRentals, long expiringRentals,
                                    long tasksToday, long tasksOpen, long activeTickets,
                                    java.util.List<AttentionItem> attention,
                                    java.util.List<RentalDto> expiringRentalList,
                                    java.util.List<OccupancyByType> occupancyByType) {
    }

    public record RevenuePoint(String month, String label, BigDecimal amount) {
    }

    public record AdminUserDto(Long id, String email, String fullName, String phone, String role,
                               Long facilityId, String status, Instant createdAt) {
    }

    public record UserSummary(long total, long active, long disabled, long elevated) {
    }

    public record UserList(java.util.List<AdminUserDto> items, UserSummary summary) {
    }

    public record ActivityLogDto(Long id, String actorName, String action, String entityType,
                                 Long entityId, String detail, String ipAddress, Instant createdAt) {
    }

    public record AdminUserInput(String fullName, String email, String phone, String password,
                                 UserRole role, Long facilityId) {
    }
}
