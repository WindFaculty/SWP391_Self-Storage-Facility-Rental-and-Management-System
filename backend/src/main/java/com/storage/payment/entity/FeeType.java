package com.storage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "fee_types")
public class FeeType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 40, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "default_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal defaultAmount;

    @Column(name = "active", nullable = false)
    private boolean active;

    protected FeeType() {
    }

    public static FeeType create(String code, String name, BigDecimal defaultAmount, boolean active) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("code is required");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (defaultAmount == null || defaultAmount.signum() < 0) {
            throw new IllegalArgumentException("defaultAmount must be >= 0");
        }
        FeeType feeType = new FeeType();
        feeType.code = code.trim().toUpperCase(java.util.Locale.ROOT);
        feeType.name = name.trim();
        feeType.defaultAmount = defaultAmount;
        feeType.active = active;
        return feeType;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getDefaultAmount() {
        return defaultAmount;
    }

    public boolean isActive() {
        return active;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDefaultAmount(BigDecimal defaultAmount) {
        this.defaultAmount = defaultAmount;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
