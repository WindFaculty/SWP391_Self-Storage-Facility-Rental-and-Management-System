package com.storage.rental.entity;

import com.storage.shared.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Khớp đúng bảng "reservations" đã có sẵn trong V003__rental.sql.
 * LƯU Ý: customerId/facilityId/unitTypeId/assignedUnitId được lưu dạng UUID thuần
 * (không dùng @ManyToOne sang module facility/account) để giữ đúng ranh giới domain
 * ownership — BE2 không phụ thuộc trực tiếp vào entity của BE1. Khi cần thông tin
 * chi tiết facility/unit type, gọi qua repository tương ứng ở tầng Service.
 */
@Entity
@Table(name = "reservations")
public class Reservation extends BaseEntity {

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "facility_id", nullable = false)
    private UUID facilityId;

    @Column(name = "unit_type_id", nullable = false)
    private UUID unitTypeId;

    @Column(name = "preferred_start_date", nullable = false)
    private LocalDate preferredStartDate;

    @Column(name = "rental_months", nullable = false)
    private int rentalMonths;

    @Column(name = "assigned_unit_id")
    private UUID assignedUnitId;

    @Column(name = "estimated_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status = ReservationStatus.PENDING_PAYMENT;

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getFacilityId() { return facilityId; }
    public void setFacilityId(UUID facilityId) { this.facilityId = facilityId; }

    public UUID getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(UUID unitTypeId) { this.unitTypeId = unitTypeId; }

    public LocalDate getPreferredStartDate() { return preferredStartDate; }
    public void setPreferredStartDate(LocalDate preferredStartDate) { this.preferredStartDate = preferredStartDate; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public UUID getAssignedUnitId() { return assignedUnitId; }
    public void setAssignedUnitId(UUID assignedUnitId) { this.assignedUnitId = assignedUnitId; }

    public BigDecimal getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(BigDecimal estimatedPrice) { this.estimatedPrice = estimatedPrice; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }
}
