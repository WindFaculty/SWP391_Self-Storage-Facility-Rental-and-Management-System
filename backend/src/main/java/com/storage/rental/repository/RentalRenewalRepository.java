package com.storage.rental.repository;

import com.storage.rental.entity.RentalRenewal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentalRenewalRepository extends JpaRepository<RentalRenewal, Long> {

    List<RentalRenewal> findByRentalIdOrderByRequestedAtDesc(Long rentalId);

    Optional<RentalRenewal> findFirstByRentalIdAndStatus(Long rentalId,
                                                          com.storage.rental.entity.RenewalStatus status);
}
