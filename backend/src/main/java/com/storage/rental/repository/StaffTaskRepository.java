package com.storage.rental.repository;

import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface StaffTaskRepository extends JpaRepository<StaffTask, Long> {

    List<StaffTask> findByRentalId(Long rentalId);

    List<StaffTask> findByTicketId(Long ticketId);

    List<StaffTask> findByAssignedStaffIdAndStatusNot(Long assignedStaffId, TaskStatus status);

    Page<StaffTask> findByAssignedStaffId(Long assignedStaffId, Pageable pageable);

    List<StaffTask> findByAssignedStaffIdIn(List<Long> assignedStaffIds);

    List<StaffTask> findByRentalIdAndTaskTypeAndStatusNot(Long rentalId, TaskType taskType,
                                                           TaskStatus status);

    List<StaffTask> findByAssignedStaffIdAndScheduledAtBetween(Long assignedStaffId, Instant from,
                                                              Instant to);

    @Query("""
            select t.status as status, count(t) as taskCount
            from StaffTask t
            where t.assignedStaffId in :staffIds
            group by t.status
            """)
    List<TaskStatusCount> countByStatusForStaff(@Param("staffIds") List<Long> staffIds);

    @Query("""
            select t.taskType as taskType, count(t) as taskCount
            from StaffTask t
            where t.assignedStaffId in :staffIds
            group by t.taskType
            """)
    List<TaskTypeCount> countByTypeForStaff(@Param("staffIds") List<Long> staffIds);

    interface TaskStatusCount {
        TaskStatus getStatus();

        long getTaskCount();
    }

    interface TaskTypeCount {
        TaskType getTaskType();

        long getTaskCount();
    }
}
