package com.storage.facility.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "unit_types")
public class UnitType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(name = "size_m2", nullable = false, precision = 8, scale = 2)
    private BigDecimal sizeM2;

    @Column(name = "min_monthly_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal minMonthlyPrice;

    @Column(name = "max_monthly_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal maxMonthlyPrice;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column
    private String description;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getSizeM2() {
        return sizeM2;
    }

    public void setSizeM2(BigDecimal sizeM2) {
        this.sizeM2 = sizeM2;
    }

    public BigDecimal getMinMonthlyPrice() {
        return minMonthlyPrice;
    }

    public void setMinMonthlyPrice(BigDecimal minMonthlyPrice) {
        this.minMonthlyPrice = minMonthlyPrice;
    }

    public BigDecimal getMaxMonthlyPrice() {
        return maxMonthlyPrice;
    }

    public void setMaxMonthlyPrice(BigDecimal maxMonthlyPrice) {
        this.maxMonthlyPrice = maxMonthlyPrice;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
