package com.storage.media;

import com.storage.management.dto.ManagementDtos.FacilityInputRequest;
import com.storage.ops.dto.OpsDtos.StorageUnitInput;
import java.math.BigDecimal;
import java.util.List;

public final class MediaDtos {
    private MediaDtos() {}

    public record ImageDto(String id, String url, int sortOrder) {}
    // Exactly one of id/fileIndex identifies an existing image or a new files part.
    public record ImageRef(String id, Integer fileIndex) {}
    public record ImageInput(List<ImageRef> images) {}
    public record FacilitySave(String code, String name, String address, List<ImageRef> images) {
        public FacilityInputRequest input() { return new FacilityInputRequest(code, name, address); }
    }
    public record UnitSave(Long facilityId, Long unitTypeId, String unitCode, String locationLabel,
                           BigDecimal monthlyPrice, List<ImageRef> images) {
        public StorageUnitInput input() {
            return new StorageUnitInput(facilityId, unitTypeId, unitCode, locationLabel, monthlyPrice);
        }
    }
    public record PublicUnit(Long id, String unitCode, Long unitTypeId, String unitTypeName,
                             BigDecimal sizeM2, String imageUrl, List<ImageDto> images) {}
}
