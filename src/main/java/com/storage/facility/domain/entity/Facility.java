package com.storage.facility.domain.entity;

import com.storage.shared.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "facilities")
public class Facility extends BaseEntity {
    @Column(nullable = false, length = 255) private String name;
    @Column(length = 500) private String address;
    @Column(length = 50) private String phone;
    @Column(length = 1000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private FacilityStatus status = FacilityStatus.ACTIVE;
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getAddress() { return address; } public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
    public FacilityStatus getStatus() { return status; } public void setStatus(FacilityStatus status) { this.status = status; }
}
