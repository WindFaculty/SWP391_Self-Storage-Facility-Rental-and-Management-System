package com.storage.account.service;

import com.storage.account.dto.AdminDtos.SystemUsageDashboard;
import com.storage.account.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminUsageServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    private AdminUsageService service;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-11-20T10:00:00Z"), ZoneOffset.UTC);
        service = new AdminUsageService(jdbc, fixedClock);
    }

    @Test
    void normalizesRequestedPeriodIntoSupportedBuckets() {
        assertThat(AdminUsageService.normalizePeriodDays(null)).isEqualTo(30);
        assertThat(AdminUsageService.normalizePeriodDays(1)).isEqualTo(7);
        assertThat(AdminUsageService.normalizePeriodDays(7)).isEqualTo(7);
        assertThat(AdminUsageService.normalizePeriodDays(10)).isEqualTo(14);
        assertThat(AdminUsageService.normalizePeriodDays(30)).isEqualTo(30);
        assertThat(AdminUsageService.normalizePeriodDays(365)).isEqualTo(90);
    }

    @Test
    void returnsZeroFilledDashboardWhenDatabaseIsEmpty() {
        when(jdbc.queryForObject(anyString(), eq(Long.class))).thenReturn(0L);
        when(jdbc.query(anyString(), any(RowMapper.class))).thenReturn(List.of());
        when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of());

        SystemUsageDashboard dashboard = service.getSystemUsage(7);

        assertThat(dashboard.periodDays()).isEqualTo(7);
        assertThat(dashboard.generatedAt()).isEqualTo(Instant.parse("2026-11-20T10:00:00Z"));
        assertThat(dashboard.usersByRole()).hasSize(UserRole.values().length);
        assertThat(dashboard.usersByRole().stream().map(r -> r.role()).toList())
                .containsExactly("CUSTOMER", "FACILITY_STAFF", "FACILITY_MANAGER", "BUSINESS_MANAGER", "ADMIN");
        assertThat(dashboard.dailyActivity()).hasSize(7);
        assertThat(dashboard.dailyActivity().getFirst().date()).isEqualTo("2026-11-14");
        assertThat(dashboard.dailyActivity().getLast().date()).isEqualTo("2026-11-20");
        assertThat(dashboard.dailyActivity().getLast().label()).isEqualTo("20/11");
        assertThat(dashboard.auth().loginSuccessRate()).isNull();
        assertThat(dashboard.platform().paymentSuccessRate()).isNull();
        assertThat(dashboard.overview().occupancyRate()).isEqualTo(0.0);
        assertThat(dashboard.facilities()).isEmpty();
        assertThat(dashboard.recentEvents()).isEmpty();
    }

    @Test
    void aggregatesActivityCountsAndLoginSuccessRate() throws Exception {
        when(jdbc.queryForObject(anyString(), eq(Long.class))).thenReturn(2L);
        when(jdbc.query(anyString(), any(RowMapper.class))).thenReturn(List.of());
        when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of());

        doAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            RowCallbackHandler handler = invocation.getArgument(1);
            if (sql.contains("FROM activity_logs")) {
                ResultSet loginOk = mock(ResultSet.class);
                when(loginOk.getString("day_key")).thenReturn("2026-11-20");
                when(loginOk.getString("action")).thenReturn("LOGIN_SUCCESS");
                when(loginOk.getLong("cnt")).thenReturn(9L);
                handler.processRow(loginOk);

                ResultSet loginFail = mock(ResultSet.class);
                when(loginFail.getString("day_key")).thenReturn("2026-11-20");
                when(loginFail.getString("action")).thenReturn("LOGIN_FAILED");
                when(loginFail.getLong("cnt")).thenReturn(1L);
                handler.processRow(loginFail);

                ResultSet userCreated = mock(ResultSet.class);
                when(userCreated.getString("day_key")).thenReturn("2026-11-19");
                when(userCreated.getString("action")).thenReturn("USER_CREATED");
                when(userCreated.getLong("cnt")).thenReturn(3L);
                handler.processRow(userCreated);
            } else if (sql.contains("FROM users") && sql.contains("GROUP BY role")) {
                ResultSet adminRow = mock(ResultSet.class);
                when(adminRow.getString("role")).thenReturn("ADMIN");
                when(adminRow.getLong("total_cnt")).thenReturn(2L);
                when(adminRow.getLong("active_cnt")).thenReturn(2L);
                when(adminRow.getLong("disabled_cnt")).thenReturn(0L);
                when(adminRow.getLong("new_cnt")).thenReturn(1L);
                handler.processRow(adminRow);
            }
            return null;
        }).when(jdbc).query(anyString(), any(RowCallbackHandler.class), any(Timestamp.class));

        SystemUsageDashboard dashboard = service.getSystemUsage(7);

        assertThat(dashboard.overview().totalUsers()).isEqualTo(2L);
        assertThat(dashboard.overview().googleLinkedUsers()).isEqualTo(2L);
        assertThat(dashboard.auth().loginSuccessCount()).isEqualTo(9L);
        assertThat(dashboard.auth().loginFailedCount()).isEqualTo(1L);
        assertThat(dashboard.auth().adminChangesCount()).isEqualTo(3L);
        assertThat(dashboard.auth().loginSuccessRate()).isEqualTo(90.0);

        var today = dashboard.dailyActivity().getLast();
        assertThat(today.date()).isEqualTo("2026-11-20");
        assertThat(today.totalEvents()).isEqualTo(10L);
        assertThat(today.loginSuccess()).isEqualTo(9L);
        assertThat(today.loginFailed()).isEqualTo(1L);
        assertThat(today.otherEvents()).isEqualTo(0L);

        var yesterday = dashboard.dailyActivity().get(dashboard.dailyActivity().size() - 2);
        assertThat(yesterday.date()).isEqualTo("2026-11-19");
        assertThat(yesterday.otherEvents()).isEqualTo(3L);

        assertThat(dashboard.topActions())
                .extracting(a -> a.action(), a -> a.count())
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("LOGIN_SUCCESS", 9L),
                        org.assertj.core.groups.Tuple.tuple("USER_CREATED", 3L),
                        org.assertj.core.groups.Tuple.tuple("LOGIN_FAILED", 1L));
    }
}
