package com.storage.rental.controller;

import com.storage.rental.dto.RentalDtos.HoldRequest;
import com.storage.rental.dto.RentalDtos.HoldResponse;
import com.storage.rental.dto.RentalDtos.RenewalRequest;
import com.storage.rental.dto.RentalDtos.RenewalResponse;
import com.storage.rental.dto.RentalDtos.RentalResponse;
import com.storage.rental.dto.RentalDtos.ReturnRequest;
import com.storage.rental.dto.RentalDtos.ReturnResponse;
import com.storage.rental.service.RentalService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Customer-facing rental lifecycle. Paths match the FE1 adapters in
 * frontend/src/features/rental/api/rentalApi.ts.
 */
@RestController
@RequestMapping("/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @PostMapping("/holds")
    public ApiResponse<HoldResponse> createHold(@Valid @RequestBody HoldRequest request) {
        return ApiResponse.success(rentalService.createHold(currentUserId(), request));
    }

    @GetMapping("/me")
    public ApiResponse<List<RentalResponse>> myRentals() {
        return ApiResponse.success(rentalService.listMine(currentUserId()));
    }

    @GetMapping("/{rentalId}")
    public ApiResponse<RentalResponse> myRental(@PathVariable Long rentalId) {
        return ApiResponse.success(rentalService.getMine(currentUserId(), rentalId));
    }

    @PostMapping("/{rentalId}/cancel")
    public ApiResponse<RentalResponse> cancel(@PathVariable Long rentalId,
                                              @RequestBody(required = false) String reason) {
        rentalService.cancel(currentUserId(), rentalId, reason);
        return ApiResponse.success(rentalService.getMine(currentUserId(), rentalId));
    }

    @PostMapping("/{rentalId}/renewals")
    public ApiResponse<RenewalResponse> renew(@PathVariable Long rentalId,
                                              @Valid @RequestBody RenewalRequest request) {
        return ApiResponse.success(rentalService.requestRenewal(currentUserId(), rentalId, request));
    }

    @PostMapping("/{rentalId}/return-requests")
    public ApiResponse<ReturnResponse> requestReturn(@PathVariable Long rentalId,
                                                     @RequestBody(required = false) ReturnRequest request) {
        return ApiResponse.success(rentalService.requestReturn(currentUserId(), rentalId,
                request == null ? new ReturnRequest(null, null) : request));
    }

    private static Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
