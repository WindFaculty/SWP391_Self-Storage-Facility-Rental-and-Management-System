package com.storage.identity.dto;

import com.storage.identity.domain.entity.User;
import com.storage.identity.domain.enums.UserStatus;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private UserStatus status;
    private Set<String> roles;
    private Set<String> permissions;

    public UserDto() {
    }

    public UserDto(UUID id, String email, String fullName, String phoneNumber, UserStatus status, Set<String> roles, Set<String> permissions) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.roles = roles;
        this.permissions = permissions;
    }

    public static UserDto fromEntity(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        Set<String> permissionNames = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getName())
                .collect(Collectors.toSet());

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getStatus(),
                roleNames,
                permissionNames
        );
    }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }

    public static class UserDtoBuilder {
        private UUID id;
        private String email;
        private String fullName;
        private String phoneNumber;
        private UserStatus status;
        private Set<String> roles;
        private Set<String> permissions;

        public UserDtoBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public UserDtoBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserDtoBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public UserDtoBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public UserDtoBuilder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public UserDtoBuilder roles(Set<String> roles) {
            this.roles = roles;
            return this;
        }

        public UserDtoBuilder permissions(Set<String> permissions) {
            this.permissions = permissions;
            return this;
        }

        public UserDto build() {
            return new UserDto(id, email, fullName, phoneNumber, status, roles, permissions);
        }
    }
}
