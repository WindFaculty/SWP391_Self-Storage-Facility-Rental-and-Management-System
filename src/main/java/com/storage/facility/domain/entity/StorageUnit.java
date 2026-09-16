package com.storage.facility.domain.entity;

import com.storage.facility.domain.enums.UnitStatus;
import com.storage.shared.entity.BaseEntity;
import jakarta.persistence.*;

@Entity @Table(name = "storage_units", uniqueConstraints = @UniqueConstraint(columnNames = {"facility_id", "code"}))
public class StorageUnit extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "facility_id", nullable = false) private Facility facility;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "unit_type_id", nullable = false) private UnitType unitType;
    @Column(nullable = false, length = 80) private String code;
    @Column(length = 50) private String floor;
    @Column(length = 255) private String location;
    @Column(name = "monthly_price", nullable = false, precision = 19, scale = 2) private java.math.BigDecimal monthlyPrice;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private UnitStatus status = UnitStatus.AVAILABLE;
    public Facility getFacility() { return facility; } public void setFacility(Facility facility) { this.facility = facility; }
    public UnitType getUnitType() { return unitType; } public void setUnitType(UnitType unitType) { this.unitType = unitType; }
    public String getCode() { return code; } public void setCode(String code) { this.code = code; }
    public String getFloor() { return floor; } public void setFloor(String floor) { this.floor = floor; }
    public String getLocation() { return location; } public void setLocation(String location) { this.location = location; }
    public java.math.BigDecimal getMonthlyPrice() { return monthlyPrice; } public void setMonthlyPrice(java.math.BigDecimal monthlyPrice) { this.monthlyPrice = monthlyPrice; }
    public UnitStatus getStatus() { return status; } public void setStatus(UnitStatus status) { this.status = status; }
}
