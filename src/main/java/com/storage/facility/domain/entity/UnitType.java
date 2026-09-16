package com.storage.facility.domain.entity;

import com.storage.shared.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "unit_types")
public class UnitType extends BaseEntity {
    @Column(nullable = false, length = 150) private String name;
    @Column(precision = 10, scale = 2) private BigDecimal width;
    @Column(precision = 10, scale = 2) private BigDecimal length;
    @Column(precision = 10, scale = 2) private BigDecimal height;
    @Column(length = 1000) private String description;
    @Column(name = "min_monthly_price", nullable = false, precision = 19, scale = 2) private BigDecimal minMonthlyPrice;
    @Column(name = "max_monthly_price", nullable = false, precision = 19, scale = 2) private BigDecimal maxMonthlyPrice;
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public BigDecimal getWidth() { return width; } public void setWidth(BigDecimal width) { this.width = width; }
    public BigDecimal getLength() { return length; } public void setLength(BigDecimal length) { this.length = length; }
    public BigDecimal getHeight() { return height; } public void setHeight(BigDecimal height) { this.height = height; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
    public BigDecimal getMinMonthlyPrice() { return minMonthlyPrice; } public void setMinMonthlyPrice(BigDecimal minMonthlyPrice) { this.minMonthlyPrice = minMonthlyPrice; }
    public BigDecimal getMaxMonthlyPrice() { return maxMonthlyPrice; } public void setMaxMonthlyPrice(BigDecimal maxMonthlyPrice) { this.maxMonthlyPrice = maxMonthlyPrice; }
}
