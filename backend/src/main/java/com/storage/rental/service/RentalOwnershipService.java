package com.storage.rental.service;

import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.OwnershipService;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RentalOwnershipService {

    private final JdbcTemplate jdbcTemplate;
    private final OwnershipService ownershipService;

    public RentalOwnershipService(JdbcTemplate jdbcTemplate, OwnershipService ownershipService) {
        this.jdbcTemplate = jdbcTemplate;
        this.ownershipService = ownershipService;
    }

    public void requireRentalOwner(Long rentalId) {
        List<Long> owners = jdbcTemplate.query("select customer_id from rentals where id = ?",
                (rs, rowNum) -> rs.getLong(1), rentalId);
        if (owners.isEmpty()) {
            throw new NotFoundException(ErrorCode.RENTAL_NOT_FOUND);
        }
        ownershipService.requireOwnership(owners.get(0));
    }
}
