package com.storage.rental.service;

import com.storage.facility.domain.entity.Facility;
import com.storage.facility.domain.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.rental.dto.ReservationDtos.ReservationRequest;
import com.storage.rental.dto.ReservationDtos.ReservationResponse;
import com.storage.rental.entity.Reservation;
import com.storage.rental.entity.ReservationStatus;
import com.storage.rental.repository.ReservationRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.ForbiddenException;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.response.PageResponse;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.security.UserPrincipal;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservations;
    private final FacilityRepository facilities;
    private final UnitTypeRepository unitTypes;

    public ReservationService(ReservationRepository reservations, FacilityRepository facilities, UnitTypeRepository unitTypes) {
        this.reservations = reservations;
        this.facilities = facilities;
        this.unitTypes = unitTypes;
    }

    public ReservationResponse createReservation(ReservationRequest r) {
        UUID customerId = currentUserId();

        Facility facility = facilities.findById(r.facilityId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.FACILITY_NOT_FOUND));
        UnitType unitType = unitTypes.findById(r.unitTypeId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        if (r.rentalMonths() < 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Thời gian thuê tối thiểu là 1 tháng");
        }

        Reservation reservation = new Reservation();
        reservation.setCustomerId(customerId);
        reservation.setFacilityId(facility.getId());
        reservation.setUnitTypeId(unitType.getId());
        reservation.setPreferredStartDate(r.preferredStartDate());
        reservation.setRentalMonths(r.rentalMonths());
        reservation.setEstimatedPrice(estimatePrice(unitType, r.rentalMonths()));
        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);

        return toResponse(reservations.save(reservation));
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(UUID id) {
        Reservation reservation = reservation(id);
        requireOwnerOrStaff(reservation);
        return toResponse(reservation);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> listMyReservations(int page, int size) {
        UUID customerId = currentUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReservationResponse> result = reservations.findByCustomerId(customerId, pageable).map(this::toResponse);
        return PageResponse.from(result);
    }

    public ReservationResponse cancelReservation(UUID id) {
        Reservation reservation = reservation(id);
        requireOwnerOrStaff(reservation);

        if (reservation.getStatus() == ReservationStatus.CANCELLED
                || reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Không thể hủy đặt chỗ ở trạng thái " + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        return toResponse(reservation);
    }

    // --- helpers ---------------------------------------------------------

    /**
     * Ước tính giá tạm thời dựa trên giá tối thiểu của UnitType.
     * TODO: thay bằng PricingService thật khi BE3 hoàn thành module Pricing (Phase 2),
     * lúc đó cần tính thêm: facility override price, discount, deposit...
     */
    private BigDecimal estimatePrice(UnitType unitType, int rentalMonths) {
        return unitType.getMinMonthlyPrice().multiply(BigDecimal.valueOf(rentalMonths));
    }

    private Reservation reservation(UUID id) {
        return reservations.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND));
    }

    private void requireOwnerOrStaff(Reservation reservation) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal()
                .orElseThrow(() -> new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này"));

        boolean isOwner = reservation.getCustomerId().equals(principal.getId());
        boolean isStaffOrAbove = principal.getAuthorities().stream().anyMatch(a ->
                List.of("ROLE_FACILITY_STAFF", "ROLE_FACILITY_MANAGER", "ROLE_BUSINESS_MANAGER", "ROLE_ADMIN")
                        .contains(a.getAuthority()));

        if (!isOwner && !isStaffOrAbove) {
            throw new ForbiddenException("Bạn không có quyền xem/hủy đặt chỗ này");
        }
    }

    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này"));
    }

    private ReservationResponse toResponse(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getCustomerId(),
                reservation.getFacilityId(),
                reservation.getUnitTypeId(),
                reservation.getPreferredStartDate(),
                reservation.getRentalMonths(),
                reservation.getAssignedUnitId(),
                reservation.getEstimatedPrice(),
                reservation.getStatus()
        );
    }
}
