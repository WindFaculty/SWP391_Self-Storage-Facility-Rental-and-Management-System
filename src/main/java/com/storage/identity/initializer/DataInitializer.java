package com.storage.identity.initializer;

import com.storage.identity.domain.entity.Permission;
import com.storage.identity.domain.entity.Role;
import com.storage.identity.domain.entity.User;
import com.storage.identity.domain.enums.RoleName;
import com.storage.identity.domain.enums.UserStatus;
import com.storage.identity.repository.PermissionRepository;
import com.storage.identity.repository.RoleRepository;
import com.storage.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           PermissionRepository permissionRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking and initializing system roles, permissions, and demo users...");

        // 1. Initialize Permissions
        Map<String, Permission> permissionMap = initPermissions();

        // 2. Initialize Roles
        Map<RoleName, Role> roleMap = initRoles(permissionMap);

        // 3. Initialize Demo Users for each Role
        initDemoUsers(roleMap);

        log.info("System initialization completed successfully.");
    }

    private Map<String, Permission> initPermissions() {
        List<String> permissionNames = List.of(
                "USER_VIEW", "USER_MANAGE",
                "FACILITY_VIEW", "FACILITY_MANAGE",
                "INVENTORY_VIEW", "INVENTORY_MANAGE",
                "RESERVATION_VIEW", "RESERVATION_MANAGE",
                "RENTAL_VIEW", "RENTAL_MANAGE",
                "BILLING_VIEW", "BILLING_MANAGE",
                "REPORT_VIEW", "AUDIT_VIEW"
        );

        Map<String, Permission> map = new HashMap<>();
        for (String name : permissionNames) {
            Permission permission = permissionRepository.findByName(name)
                    .orElseGet(() -> permissionRepository.save(Permission.builder()
                            .name(name)
                            .description("Permission " + name)
                            .build()));
            map.put(name, permission);
        }
        return map;
    }

    private Map<RoleName, Role> initRoles(Map<String, Permission> permissions) {
        Map<RoleName, Role> map = new HashMap<>();

        for (RoleName roleName : RoleName.values()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseGet(() -> Role.builder()
                            .name(roleName)
                            .description("Vai trò " + roleName.name())
                            .permissions(new HashSet<>())
                            .build());

            // Assign standard permissions based on role
            if (roleName == RoleName.SYSTEM_ADMIN) {
                role.getPermissions().addAll(permissions.values());
            } else if (roleName == RoleName.BUSINESS_OPERATIONS_MANAGER) {
                assignPermissions(role, permissions, "FACILITY_VIEW", "INVENTORY_VIEW", "RESERVATION_VIEW", "RENTAL_VIEW", "BILLING_VIEW", "BILLING_MANAGE", "REPORT_VIEW");
            } else if (roleName == RoleName.FACILITY_MANAGER) {
                assignPermissions(role, permissions, "FACILITY_VIEW", "FACILITY_MANAGE", "INVENTORY_VIEW", "INVENTORY_MANAGE", "RESERVATION_VIEW", "RENTAL_VIEW", "REPORT_VIEW");
            } else if (roleName == RoleName.FACILITY_STAFF) {
                assignPermissions(role, permissions, "FACILITY_VIEW", "INVENTORY_VIEW", "RESERVATION_VIEW", "RESERVATION_MANAGE", "RENTAL_VIEW", "RENTAL_MANAGE");
            } else if (roleName == RoleName.CUSTOMER) {
                assignPermissions(role, permissions, "FACILITY_VIEW", "INVENTORY_VIEW", "RESERVATION_VIEW", "RENTAL_VIEW", "BILLING_VIEW");
            }

            map.put(roleName, roleRepository.save(role));
        }

        return map;
    }

    private void assignPermissions(Role role, Map<String, Permission> permissions, String... permNames) {
        for (String p : permNames) {
            if (permissions.containsKey(p)) {
                role.getPermissions().add(permissions.get(p));
            }
        }
    }

    private void initDemoUsers(Map<RoleName, Role> roleMap) {
        String defaultPassword = passwordEncoder.encode("Password123!");

        createOrUpdateUser("admin@storage.com", "Hệ Thống Admin", defaultPassword, "0901000001", roleMap.get(RoleName.SYSTEM_ADMIN));
        createOrUpdateUser("business@storage.com", "Lê Trí Thiện - Biz Manager", defaultPassword, "0901000002", roleMap.get(RoleName.BUSINESS_OPERATIONS_MANAGER));
        createOrUpdateUser("facility@storage.com", "Hồ Xuân Thanh - Facility Manager", defaultPassword, "0901000003", roleMap.get(RoleName.FACILITY_MANAGER));
        createOrUpdateUser("staff@storage.com", "Bùi Văn Tình - Facility Staff", defaultPassword, "0901000004", roleMap.get(RoleName.FACILITY_STAFF));
        createOrUpdateUser("customer@storage.com", "Bùi Tuấn Thanh - Khách Hàng", defaultPassword, "0901000005", roleMap.get(RoleName.CUSTOMER));
    }

    private void createOrUpdateUser(String email, String fullName, String encodedPassword, String phone, Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .passwordHash(encodedPassword)
                    .phoneNumber(phone)
                    .status(UserStatus.ACTIVE)
                    .roles(new HashSet<>(Collections.singletonList(role)))
                    .build();
            userRepository.save(user);
            log.info("Seeded demo user: {} with role: {}", email, role.getName());
        }
    }
}
