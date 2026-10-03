package com.storage.rental.controller;

import com.storage.rental.dto.ReservationDtos.ReservationRequest;
import com.storage.rental.dto.ReservationDtos.ReservationResponse;
import com.storage.rental.service.ReservationService;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.response.PageResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping("/reservations")
    public ResponseEntity<ApiResponse<ReservationResponse>> create(@Valid @RequestBody ReservationRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.createReservation(r)));
    }

    @GetMapping("/reservations")
    public ApiResponse<PageResponse<ReservationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.listMyReservations(page, size));
    }

    @GetMapping("/reservations/{id}")
    public ApiResponse<ReservationResponse> get(@PathVariable UUID id) {
        return ApiResponse.success(service.getReservation(id));
    }

    @PostMapping("/reservations/{id}/cancel")
    public ApiResponse<ReservationResponse> cancel(@PathVariable UUID id) {
        return ApiResponse.success(service.cancelReservation(id));
    }
}
