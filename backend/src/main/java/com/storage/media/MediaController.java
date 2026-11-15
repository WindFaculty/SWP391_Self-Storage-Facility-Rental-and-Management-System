package com.storage.media;

import com.storage.media.MediaDtos.*;
import com.storage.management.dto.ManagementDtos.FacilityOverviewResponse;
import com.storage.ops.dto.OpsDtos.StorageUnitDto;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.response.PageResponse;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
public class MediaController {
    private final WarehouseMediaService media;
    public MediaController(WarehouseMediaService media) { this.media = media; }

    @PostMapping(value = "/management/facilities", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_MANAGER')")
    public ResponseEntity<ApiResponse<FacilityOverviewResponse>> createFacility(@RequestPart FacilitySave data,
            @RequestPart(required = false) List<MultipartFile> files) {
        return ResponseEntity.status(201).body(ApiResponse.success(media.saveFacility(null, data, files)));
    }
    @PutMapping(value = "/management/facilities/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_MANAGER')")
    public ApiResponse<FacilityOverviewResponse> updateFacility(@PathVariable Long id, @RequestPart FacilitySave data,
            @RequestPart(required = false) List<MultipartFile> files) {
        return ApiResponse.success(media.saveFacility(id, data, files));
    }
    @PostMapping(value = "/ops/units", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_MANAGER','FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<StorageUnitDto>> createUnit(@RequestPart UnitSave data,
            @RequestPart(required = false) List<MultipartFile> files) {
        return ResponseEntity.status(201).body(ApiResponse.success(media.saveUnit(null, data, files)));
    }
    @PutMapping(value = "/ops/units/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_MANAGER','FACILITY_MANAGER')")
    public ApiResponse<StorageUnitDto> updateUnit(@PathVariable Long id, @RequestPart UnitSave data,
            @RequestPart(required = false) List<MultipartFile> files) {
        return ApiResponse.success(media.saveUnit(id, data, files));
    }
    @PutMapping(value = "/ops/facilities/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS_MANAGER','FACILITY_MANAGER')")
    public ApiResponse<List<ImageDto>> facilityImages(@PathVariable Long id, @RequestPart ImageInput data,
            @RequestPart(required = false) List<MultipartFile> files) {
        return ApiResponse.success(media.replaceFacilityImages(id, data, files));
    }
    @GetMapping("/facilities/{id}/units")
    public ApiResponse<PageResponse<PublicUnit>> publicUnits(@PathVariable Long id,
            @RequestParam(required = false) Long unitTypeId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.success(media.publicUnits(id, unitTypeId, page, size));
    }
    @GetMapping("/media/{id}")
    public ResponseEntity<FileSystemResource> file(@PathVariable String id) {
        var file = media.file(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .cacheControl(CacheControl.noCache()).header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(file.path()));
    }
}
