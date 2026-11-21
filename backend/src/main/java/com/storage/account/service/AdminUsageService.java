package com.storage.account.service;

import com.storage.account.dto.AdminDtos.ActionCountRow;
import com.storage.account.dto.AdminDtos.AuthMetrics;
import com.storage.account.dto.AdminDtos.DailyActivityPoint;
import com.storage.account.dto.AdminDtos.FacilityUsageRow;
import com.storage.account.dto.AdminDtos.OverviewMetrics;
import com.storage.account.dto.AdminDtos.PlatformUsageMetrics;
import com.storage.account.dto.AdminDtos.RoleUsageRow;
import com.storage.account.dto.AdminDtos.SecurityEventRow;
import com.storage.account.dto.AdminDtos.SystemUsageDashboard;
import com.storage.account.entity.UserRole;
import com.storage.shared.service.Analytics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Aggregates real-time system usage, access health, module adoption, facility load,
 * and recent audit signals for the admin dashboard.
 */
@Service
public class AdminUsageService {

    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_KEY = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DAY_LABEL =
            DateTimeFormatter.ofPattern("dd/MM", Locale.forLanguageTag("vi"));
    private static final Set<String> ADMIN_MUTATION_ACTIONS = Set.of(
            "USER_CREATED", "USER_UPDATED", "ADMIN_UPDATE_USER_STATUS", "USER_DISABLED", "USER_ENABLED");
    private static final int TOP_ACTIONS_LIMIT = 8;
    private static final int RECENT_EVENTS_LIMIT = 8;

    private final JdbcTemplate jdbc;
    private final Clock clock;

    @Autowired
    public AdminUsageService(JdbcTemplate jdbc) {
        this(jdbc, Clock.systemUTC());
    }

    AdminUsageService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    static int normalizePeriodDays(Integer requestedDays) {
        if (requestedDays == null) {
            return 30;
        }
        if (requestedDays <= 7) {
            return 7;
        }
        if (requestedDays <= 14) {
            return 14;
        }
        if (requestedDays <= 30) {
            return 30;
        }
        return 90;
    }

    @Transactional(readOnly = true)
    public SystemUsageDashboard getSystemUsage(Integer requestedDays) {
        int periodDays = normalizePeriodDays(requestedDays);
        Instant now = clock.instant();
        LocalDate today = LocalDate.now(clock.withZone(DISPLAY_ZONE));
        LocalDate startDate = today.minusDays(periodDays - 1L);
        Timestamp since = Timestamp.from(startDate.atStartOfDay(DISPLAY_ZONE).toInstant());
        Timestamp nowTs = Timestamp.from(now);

        List<RoleUsageRow> usersByRole = loadRoleUsage(since);
        long totalUsers = usersByRole.stream().mapToLong(RoleUsageRow::total).sum();
        long activeUsers = usersByRole.stream().mapToLong(RoleUsageRow::active).sum();
        long disabledUsers = usersByRole.stream().mapToLong(RoleUsageRow::disabled).sum();
        long newUsersInPeriod = usersByRole.stream().mapToLong(RoleUsageRow::newInPeriod).sum();

        SessionStats sessionStats = loadSessionStats(nowTs);
        long googleLinkedUsers = queryCount("SELECT COUNT(DISTINCT user_id) FROM social_identities");

        ActivityStats activityStats = loadActivityStats(since, startDate, periodDays);
        PlatformUsageMetrics platform = loadPlatformUsage(since);
        List<FacilityUsageRow> facilities = loadFacilityUsage();
        List<SecurityEventRow> recentEvents = loadRecentEvents();

        long totalFacilities = facilities.size();
        long activeFacilities = facilities.stream()
                .filter(facility -> "ACTIVE".equals(facility.status()))
                .count();
        long totalUnits = facilities.stream().mapToLong(FacilityUsageRow::unitTotal).sum();
        long occupiedUnits = facilities.stream().mapToLong(FacilityUsageRow::unitOccupied).sum();

        OverviewMetrics overview = new OverviewMetrics(
                totalUsers,
                activeUsers,
                disabledUsers,
                newUsersInPeriod,
                sessionStats.activeSessions(),
                sessionStats.activeSessionUsers(),
                googleLinkedUsers,
                activityStats.totalEvents(),
                activityStats.activeActors(),
                activityStats.uniqueIps(),
                activeFacilities,
                totalFacilities,
                occupiedUnits,
                totalUnits,
                Analytics.rate(occupiedUnits, totalUnits)
        );

        return new SystemUsageDashboard(
                periodDays,
                now,
                overview,
                activityStats.auth(),
                usersByRole,
                activityStats.daily(),
                activityStats.topActions(),
                platform,
                facilities,
                recentEvents
        );
    }

    private List<RoleUsageRow> loadRoleUsage(Timestamp since) {
        Map<String, RoleUsageRow> byRole = new HashMap<>();
        jdbc.query("""
                        SELECT role,
                               COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active_cnt,
                               COALESCE(SUM(CASE WHEN status = 'DISABLED' THEN 1 ELSE 0 END), 0) AS disabled_cnt,
                               COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS new_cnt
                        FROM users
                        GROUP BY role
                        """,
                rs -> {
                    String role = rs.getString("role");
                    byRole.put(role, new RoleUsageRow(
                            role,
                            rs.getLong("total_cnt"),
                            rs.getLong("active_cnt"),
                            rs.getLong("disabled_cnt"),
                            rs.getLong("new_cnt")));
                },
                since);

        List<RoleUsageRow> ordered = new ArrayList<>(UserRole.values().length);
        for (UserRole role : UserRole.values()) {
            ordered.add(byRole.getOrDefault(role.name(),
                    new RoleUsageRow(role.name(), 0L, 0L, 0L, 0L)));
        }
        return ordered;
    }

    private SessionStats loadSessionStats(Timestamp nowTs) {
        List<SessionStats> rows = jdbc.query("""
                        SELECT COUNT(*) AS active_sessions,
                               COUNT(DISTINCT user_id) AS active_users
                        FROM refresh_tokens
                        WHERE revoked_at IS NULL
                          AND expires_at > ?
                        """,
                (rs, rowNum) -> new SessionStats(
                        rs.getLong("active_sessions"),
                        rs.getLong("active_users")),
                nowTs);
        return rows.isEmpty() ? new SessionStats(0L, 0L) : rows.getFirst();
    }

    private ActivityStats loadActivityStats(Timestamp since, LocalDate startDate, int periodDays) {
        List<ActivitySummary> summaryRows = jdbc.query("""
                        SELECT COUNT(*) AS total_events,
                               COUNT(DISTINCT user_id) AS active_actors,
                               COUNT(DISTINCT CASE WHEN ip_address IS NOT NULL AND ip_address <> '' THEN ip_address END) AS unique_ips
                        FROM activity_logs
                        WHERE created_at >= ?
                        """,
                (rs, rowNum) -> new ActivitySummary(
                        rs.getLong("total_events"),
                        rs.getLong("active_actors"),
                        rs.getLong("unique_ips")),
                since);
        ActivitySummary summary = summaryRows.isEmpty()
                ? new ActivitySummary(0L, 0L, 0L)
                : summaryRows.getFirst();

        Map<String, DailyCounts> dailyMap = new HashMap<>();
        Map<String, Long> actionCounts = new HashMap<>();

        jdbc.query("""
                        SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 7 HOUR), '%Y-%m-%d') AS day_key,
                               action,
                               COUNT(*) AS cnt
                        FROM activity_logs
                        WHERE created_at >= ?
                        GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 7 HOUR), '%Y-%m-%d'), action
                        """,
                rs -> {
                    String dayKey = rs.getString("day_key");
                    String action = rs.getString("action");
                    long count = rs.getLong("cnt");
                    if (action != null) {
                        actionCounts.merge(action, count, Long::sum);
                    }
                    if (dayKey != null) {
                        DailyCounts bucket = dailyMap.computeIfAbsent(dayKey, ignored -> new DailyCounts());
                        bucket.total += count;
                        if ("LOGIN_SUCCESS".equals(action)) {
                            bucket.loginSuccess += count;
                        } else if ("LOGIN_FAILED".equals(action)) {
                            bucket.loginFailed += count;
                        } else {
                            bucket.other += count;
                        }
                    }
                },
                since);

        List<DailyActivityPoint> daily = new ArrayList<>(periodDays);
        for (int i = 0; i < periodDays; i++) {
            LocalDate day = startDate.plusDays(i);
            String key = day.format(DATE_KEY);
            DailyCounts counts = dailyMap.get(key);
            daily.add(new DailyActivityPoint(
                    key,
                    day.format(DAY_LABEL),
                    counts == null ? 0L : counts.total,
                    counts == null ? 0L : counts.loginSuccess,
                    counts == null ? 0L : counts.loginFailed,
                    counts == null ? 0L : counts.other));
        }

        long loginSuccess = actionCounts.getOrDefault("LOGIN_SUCCESS", 0L);
        long loginFailed = actionCounts.getOrDefault("LOGIN_FAILED", 0L);
        long registrations = actionCounts.getOrDefault("USER_REGISTERED", 0L);
        long adminChanges = ADMIN_MUTATION_ACTIONS.stream()
                .mapToLong(action -> actionCounts.getOrDefault(action, 0L))
                .sum();
        long authAttempts = loginSuccess + loginFailed;
        Double loginSuccessRate = authAttempts == 0L ? null : Analytics.rate(loginSuccess, authAttempts);

        List<ActionCountRow> topActions = actionCounts.entrySet().stream()
                .sorted(Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue).reversed()
                        .thenComparing(Map.Entry::getKey))
                .limit(TOP_ACTIONS_LIMIT)
                .map(entry -> new ActionCountRow(entry.getKey(), entry.getValue()))
                .toList();

        return new ActivityStats(
                summary.totalEvents(),
                summary.activeActors(),
                summary.uniqueIps(),
                new AuthMetrics(loginSuccess, loginFailed, registrations, adminChanges, loginSuccessRate),
                daily,
                topActions);
    }

    private PlatformUsageMetrics loadPlatformUsage(Timestamp since) {
        RentalStats rental = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active_cnt,
                               COALESCE(SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END), 0) AS reserved_cnt,
                               COALESCE(SUM(CASE WHEN status = 'PENDING_PAYMENT' THEN 1 ELSE 0 END), 0) AS pending_cnt,
                               COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END), 0) AS overdue_cnt,
                               COALESCE(SUM(CASE WHEN status = 'RETURN_REQUESTED' THEN 1 ELSE 0 END), 0) AS return_req_cnt,
                               COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS new_cnt
                        FROM rentals
                        """,
                (rs, rowNum) -> new RentalStats(
                        rs.getLong("total_cnt"),
                        rs.getLong("active_cnt"),
                        rs.getLong("reserved_cnt"),
                        rs.getLong("pending_cnt"),
                        rs.getLong("overdue_cnt"),
                        rs.getLong("return_req_cnt"),
                        rs.getLong("new_cnt")),
                since).stream().findFirst().orElse(new RentalStats(0, 0, 0, 0, 0, 0, 0));

        InvoiceStats invoice = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_cnt,
                               COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_cnt
                        FROM invoices
                        """,
                (rs, rowNum) -> new InvoiceStats(
                        rs.getLong("total_cnt"),
                        rs.getLong("paid_cnt"),
                        rs.getLong("pending_cnt"))).stream().findFirst().orElse(new InvoiceStats(0, 0, 0));

        PaymentStats payment = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END), 0) AS success_cnt,
                               COALESCE(SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END), 0) AS failed_cnt
                        FROM payment_attempts
                        WHERE created_at >= ?
                        """,
                (rs, rowNum) -> new PaymentStats(
                        rs.getLong("total_cnt"),
                        rs.getLong("success_cnt"),
                        rs.getLong("failed_cnt")),
                since).stream().findFirst().orElse(new PaymentStats(0, 0, 0));

        long paymentTerminal = payment.success() + payment.failed();
        Double paymentSuccessRate = paymentTerminal == 0L ? null
                : Analytics.rate(payment.success(), paymentTerminal);

        TicketStats ticket = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) AS open_cnt,
                               COALESCE(SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END), 0) AS resolved_cnt,
                               COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS period_cnt
                        FROM support_tickets
                        """,
                (rs, rowNum) -> new TicketStats(
                        rs.getLong("total_cnt"),
                        rs.getLong("open_cnt"),
                        rs.getLong("resolved_cnt"),
                        rs.getLong("period_cnt")),
                since).stream().findFirst().orElse(new TicketStats(0, 0, 0, 0));

        TaskStats task = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) AS open_cnt,
                               COALESCE(SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END), 0) AS done_cnt
                        FROM staff_tasks
                        """,
                (rs, rowNum) -> new TaskStats(
                        rs.getLong("total_cnt"),
                        rs.getLong("open_cnt"),
                        rs.getLong("done_cnt"))).stream().findFirst().orElse(new TaskStats(0, 0, 0));

        MediaStats media = jdbc.query("""
                        SELECT COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN storage_key IS NOT NULL THEN 1 ELSE 0 END), 0) AS uploaded_cnt,
                               COALESCE(SUM(COALESCE(size_bytes, 0)), 0) AS total_bytes
                        FROM warehouse_images
                        """,
                (rs, rowNum) -> new MediaStats(
                        rs.getLong("uploaded_cnt"),
                        rs.getLong("total_cnt"),
                        rs.getLong("total_bytes"))).stream().findFirst().orElse(new MediaStats(0, 0, 0));

        return new PlatformUsageMetrics(
                rental.total(),
                rental.active(),
                rental.reserved(),
                rental.pendingPayment(),
                rental.overdue(),
                rental.returnRequested(),
                rental.newInPeriod(),
                invoice.total(),
                invoice.paid(),
                invoice.pending(),
                payment.attempts(),
                payment.success(),
                payment.failed(),
                paymentSuccessRate,
                ticket.total(),
                ticket.open(),
                ticket.resolved(),
                ticket.inPeriod(),
                task.total(),
                task.open(),
                task.completed(),
                media.uploadedCount(),
                media.totalCount(),
                media.totalBytes());
    }

    private List<FacilityUsageRow> loadFacilityUsage() {
        List<FacilityBase> baseList = jdbc.query("""
                        SELECT id, code, name, status
                        FROM facilities
                        ORDER BY name ASC
                        """,
                (rs, rowNum) -> new FacilityBase(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status")));
        if (baseList.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> staffByFacility = new HashMap<>();
        jdbc.query("""
                        SELECT facility_id, COUNT(*) AS cnt
                        FROM users
                        WHERE facility_id IS NOT NULL
                          AND status = 'ACTIVE'
                          AND role IN ('FACILITY_STAFF', 'FACILITY_MANAGER')
                        GROUP BY facility_id
                        """,
                rs -> {
                    staffByFacility.put(rs.getLong("facility_id"), rs.getLong("cnt"));
                });

        Map<Long, UnitCounts> unitsByFacility = new HashMap<>();
        jdbc.query("""
                        SELECT facility_id,
                               COUNT(*) AS total_cnt,
                               COALESCE(SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END), 0) AS occupied_cnt,
                               COALESCE(SUM(CASE WHEN status IN ('INSPECTION', 'MAINTENANCE') THEN 1 ELSE 0 END), 0) AS maint_cnt
                        FROM storage_units
                        GROUP BY facility_id
                        """,
                rs -> {
                    unitsByFacility.put(rs.getLong("facility_id"), new UnitCounts(
                            rs.getLong("total_cnt"),
                            rs.getLong("occupied_cnt"),
                            rs.getLong("maint_cnt")));
                });

        Map<Long, RentalCounts> rentalsByFacility = new HashMap<>();
        jdbc.query("""
                        SELECT u.facility_id,
                               COALESCE(SUM(CASE WHEN r.status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active_cnt,
                               COALESCE(SUM(CASE WHEN r.status = 'OVERDUE' THEN 1 ELSE 0 END), 0) AS overdue_cnt
                        FROM rentals r
                        JOIN storage_units u ON u.id = r.unit_id
                        GROUP BY u.facility_id
                        """,
                rs -> {
                    rentalsByFacility.put(rs.getLong("facility_id"), new RentalCounts(
                            rs.getLong("active_cnt"),
                            rs.getLong("overdue_cnt")));
                });

        Map<Long, Long> openTicketsByFacility = new HashMap<>();
        jdbc.query("""
                        SELECT facility_id, COUNT(*) AS cnt
                        FROM support_tickets
                        WHERE status IN ('OPEN', 'IN_PROGRESS')
                        GROUP BY facility_id
                        """,
                rs -> {
                    openTicketsByFacility.put(rs.getLong("facility_id"), rs.getLong("cnt"));
                });

        return baseList.stream()
                .map(facility -> {
                    UnitCounts units = unitsByFacility.getOrDefault(facility.id(), new UnitCounts(0, 0, 0));
                    RentalCounts rentals = rentalsByFacility.getOrDefault(facility.id(), new RentalCounts(0, 0));
                    return new FacilityUsageRow(
                            facility.id(),
                            facility.code(),
                            facility.name(),
                            facility.status(),
                            staffByFacility.getOrDefault(facility.id(), 0L),
                            units.total(),
                            units.occupied(),
                            units.maintenance(),
                            Analytics.rate(units.occupied(), units.total()),
                            rentals.active(),
                            rentals.overdue(),
                            openTicketsByFacility.getOrDefault(facility.id(), 0L));
                })
                .sorted(Comparator.comparingLong(FacilityUsageRow::unitOccupied).reversed()
                        .thenComparing(Comparator.comparingLong(FacilityUsageRow::activeRentals).reversed())
                        .thenComparing(FacilityUsageRow::name))
                .toList();
    }

    private List<SecurityEventRow> loadRecentEvents() {
        return jdbc.query("""
                        SELECT a.id,
                               u.full_name AS actor_name,
                               a.action,
                               a.entity_type,
                               a.entity_id,
                               a.ip_address,
                               a.created_at
                        FROM activity_logs a
                        LEFT JOIN users u ON u.id = a.user_id
                        ORDER BY a.id DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp("created_at");
                    Object entityIdObj = rs.getObject("entity_id");
                    Long entityId = entityIdObj == null ? null : ((Number) entityIdObj).longValue();
                    return new SecurityEventRow(
                            rs.getLong("id"),
                            rs.getString("actor_name"),
                            rs.getString("action"),
                            rs.getString("entity_type"),
                            entityId,
                            rs.getString("ip_address"),
                            ts == null ? null : ts.toInstant());
                },
                RECENT_EVENTS_LIMIT);
    }

    private long queryCount(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private record SessionStats(long activeSessions, long activeSessionUsers) {
    }

    private record ActivitySummary(long totalEvents, long activeActors, long uniqueIps) {
    }

    private record ActivityStats(long totalEvents, long activeActors, long uniqueIps,
                                 AuthMetrics auth, List<DailyActivityPoint> daily,
                                 List<ActionCountRow> topActions) {
    }

    private static final class DailyCounts {
        long total;
        long loginSuccess;
        long loginFailed;
        long other;
    }

    private record RentalStats(long total, long active, long reserved, long pendingPayment,
                               long overdue, long returnRequested, long newInPeriod) {
    }

    private record InvoiceStats(long total, long paid, long pending) {
    }

    private record PaymentStats(long attempts, long success, long failed) {
    }

    private record TicketStats(long total, long open, long resolved, long inPeriod) {
    }

    private record TaskStats(long total, long open, long completed) {
    }

    private record MediaStats(long uploadedCount, long totalCount, long totalBytes) {
    }

    private record FacilityBase(Long id, String code, String name, String status) {
    }

    private record UnitCounts(long total, long occupied, long maintenance) {
    }

    private record RentalCounts(long active, long overdue) {
    }
}
