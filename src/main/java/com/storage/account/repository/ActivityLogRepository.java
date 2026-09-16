package com.storage.account.repository;

import com.storage.account.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> { }
