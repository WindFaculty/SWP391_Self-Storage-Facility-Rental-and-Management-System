package com.storage.account.dto;

import com.storage.account.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }

    public record OverviewMetrics(
            long totalUsers,
            long activeUsers,
            long disabledUsers,
            long newUsersInPeriod,
            long activeSessions,
            long activeSessionUsers,
            long googleLinkedUsers,
            long totalEventsInPeriod,
            long activeActorsInPeriod,
            long uniqueIpsInPeriod,
            long activeFacilities,
            long totalFacilities,
            long occupiedUnits,
            long totalUnits,
            double occupancyRate
    ) {
    }

    public record AuthMetrics(
            long loginSuccessCount,
            long loginFailedCount,
            long registrationsCount,
            long adminChangesCount,
            Double loginSuccessRate
    ) {
    }

    public record RoleUsageRow(
            String role,
            long total,
            long active,
            long disabled,
            long newInPeriod
    ) {
    }

    public record DailyActivityPoint(
            String date,
            String label,
            long totalEvents,
            long loginSuccess,
            long loginFailed,
            long otherEvents
    ) {
    }

    public record ActionCountRow(
            String action,
            long count
    ) {
    }

    public record PlatformUsageMetrics(
            long totalRentals,
            long activeRentals,
            long reservedRentals,
            long pendingPaymentRentals,
            long overdueRentals,
            long returnRequestedRentals,
            long newRentalsInPeriod,
            long totalInvoices,
            long paidInvoices,
            long pendingInvoices,
            long paymentAttemptsInPeriod,
            long paymentSuccessInPeriod,
            long paymentFailedInPeriod,
            Double paymentSuccessRate,
            long totalTickets,
            long openTickets,
            long resolvedTickets,
            long ticketsInPeriod,
            long totalTasks,
            long openTasks,
            long completedTasks,
            long uploadedImageCount,
            long totalImageCount,
            long mediaStorageBytes
    ) {
    }

    public record FacilityUsageRow(
            Long facilityId,
            String code,
            String name,
            String status,
            long staffCount,
            long unitTotal,
            long unitOccupied,
            long unitMaintenance,
            double occupancyRate,
            long activeRentals,
            long overdueRentals,
            long openTickets
    ) {
    }

    public record SecurityEventRow(
            Long id,
            String actorName,
            String action,
            String entityType,
            Long entityId,
            String ipAddress,
            Instant createdAt
    ) {
    }

    public record SystemUsageDashboard(
            int periodDays,
            Instant generatedAt,
            OverviewMetrics overview,
            AuthMetrics auth,
            List<RoleUsageRow> usersByRole,
            List<DailyActivityPoint> dailyActivity,
            List<ActionCountRow> topActions,
            PlatformUsageMetrics platform,
            List<FacilityUsageRow> facilities,
            List<SecurityEventRow> recentEvents
    ) {
    }
}
