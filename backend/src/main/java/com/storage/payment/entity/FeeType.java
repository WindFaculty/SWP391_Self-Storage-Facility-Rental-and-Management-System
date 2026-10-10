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
}
