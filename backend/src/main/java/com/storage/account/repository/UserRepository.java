package com.storage.account.repository;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByFacilityIdAndRoleInAndStatus(Long facilityId, List<UserRole> roles,
                                                 UserStatus status);

    @Query("""
            select u from User u
            where (:role is null or u.role = :role)
              and (:status is null or u.status = :status)
              and (:facilityId is null or u.facilityId = :facilityId)
            """)
    Page<User> search(@Param("role") UserRole role,
                      @Param("status") UserStatus status,
                      @Param("facilityId") Long facilityId,
                      Pageable pageable);
}
