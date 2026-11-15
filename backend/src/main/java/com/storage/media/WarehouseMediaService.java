package com.storage.media;

import com.storage.facility.dto.CatalogDtos.FacilityResponse;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.service.FacilityAccessService;
import com.storage.management.dto.ManagementDtos.FacilityInputRequest;
import com.storage.management.dto.ManagementDtos.FacilityOverviewResponse;
import com.storage.management.service.ManagementOpsService;
import com.storage.ops.dto.OpsDtos.FacilityDto;
import com.storage.ops.dto.OpsDtos.StorageUnitDto;
import com.storage.ops.dto.OpsDtos.UnitList;
import com.storage.ops.service.OpsService;
import com.storage.media.MediaDtos.*;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.response.PageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Coordinates database changes and owned files in the same application transaction. */
@Service
public class WarehouseMediaService {
    private final JdbcTemplate jdbc;
    private final LocalImageStorage storage;
    private final FacilityRepository facilities;
    private final FacilityAccessService access;
    private final ManagementOpsService management;
    private final OpsService ops;
    private final String publicBase;

    public WarehouseMediaService(JdbcTemplate jdbc, LocalImageStorage storage, FacilityRepository facilities,
                                 FacilityAccessService access, ManagementOpsService management, OpsService ops,
                                 @Value("${app.media.public-base-url:/api/v1/media}") String publicBase) {
        this.jdbc = jdbc;
        this.storage = storage;
        this.facilities = facilities;
        this.access = access;
        this.management = management;
        this.ops = ops;
        this.publicBase = publicBase.replaceAll("/+$", "");
    }

    private record Owner(Long id, boolean facility) {
        String column() { return facility ? "facility_id" : "storage_unit_id"; }
        String table() { return facility ? "facilities" : "storage_units"; }
    }
    private record Row(String id, String key, String legacyUrl, String type, Long size, int order) {}
    public record StoredFile(java.nio.file.Path path, String contentType) {}

    private static String cover(List<ImageDto> images) { return images.isEmpty() ? null : images.getFirst().url(); }
    private String url(Row row) { return row.key() == null ? row.legacyUrl() : publicBase + "/" + row.id(); }
    private List<ImageDto> dtos(List<Row> rows) {
        return rows.stream().map(r -> new ImageDto(r.id(), url(r), r.order())).toList();
    }

    private Map<Long, List<ImageDto>> galleries(boolean facility, List<Long> ids) {
        Map<Long, List<ImageDto>> result = new HashMap<>();
        if (ids.isEmpty()) return result;
        String column = facility ? "facility_id" : "storage_unit_id";
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        jdbc.query("SELECT * FROM warehouse_images WHERE " + column + " IN (" + placeholders + ") ORDER BY sort_order",
                rs -> {
                    Row row = new Row(rs.getString("id"), rs.getString("storage_key"), rs.getString("legacy_url"),
                            rs.getString("content_type"), (Long) rs.getObject("size_bytes"), rs.getInt("sort_order"));
                    result.computeIfAbsent(rs.getLong(column), ignored -> new ArrayList<>())
                            .add(new ImageDto(row.id(), url(row), row.order()));
                }, ids.toArray());
        return result;
    }

    private List<Row> rows(Owner owner) {
        return jdbc.query("SELECT * FROM warehouse_images WHERE " + owner.column() + " = ? ORDER BY sort_order",
                (rs, n) -> new Row(rs.getString("id"), rs.getString("storage_key"), rs.getString("legacy_url"),
                        rs.getString("content_type"), (Long) rs.getObject("size_bytes"), rs.getInt("sort_order")), owner.id());
    }

    public List<FacilityResponse> publicFacilities(List<FacilityResponse> items) {
        var images = galleries(true, items.stream().map(FacilityResponse::id).toList());
        return items.stream().map(f -> publicFacility(f, images.getOrDefault(f.id(), List.of()))).toList();
    }
    public FacilityResponse publicFacility(FacilityResponse f) {
        return publicFacility(f, dtos(rows(new Owner(f.id(), true))));
    }
    private FacilityResponse publicFacility(FacilityResponse f, List<ImageDto> images) {
        return new FacilityResponse(f.id(), f.code(), f.name(), f.address(), f.status(), cover(images), images);
    }
    public List<FacilityDto> workspaceFacilities(List<FacilityDto> items) {
        var images = galleries(true, items.stream().map(FacilityDto::id).toList());
        return items.stream().map(f -> {
            var list = images.getOrDefault(f.id(), List.of());
            return new FacilityDto(f.id(), f.code(), f.name(), f.address(), f.status(), cover(list), list);
        }).toList();
    }
    public List<FacilityOverviewResponse> overviews(List<FacilityOverviewResponse> items) {
        var images = galleries(true, items.stream().map(FacilityOverviewResponse::id).toList());
        return items.stream().map(f -> overview(f, images.getOrDefault(f.id(), List.of()))).toList();
    }
    private FacilityOverviewResponse overview(FacilityOverviewResponse f, List<ImageDto> images) {
        return new FacilityOverviewResponse(f.id(), f.code(), f.name(), f.address(), f.status(), f.managerName(),
                f.unitTotal(), f.unitOccupied(), f.occupancyRate(), f.activeRentals(), f.overdueRentals(), cover(images), images);
    }
    public StorageUnitDto unit(StorageUnitDto u) {
        return unit(u, dtos(rows(new Owner(u.id(), false))));
    }
    private StorageUnitDto unit(StorageUnitDto u, List<ImageDto> images) {
        return new StorageUnitDto(u.id(), u.facilityId(), u.unitTypeId(), u.unitCode(), u.locationLabel(),
                u.monthlyPrice(), u.status(), cover(images), images);
    }
    public UnitList units(UnitList list) {
        var images = galleries(false, list.items().stream().map(StorageUnitDto::id).toList());
        return new UnitList(list.items().stream().map(u -> unit(u, images.getOrDefault(u.id(), List.of()))).toList(), list.summary());
    }

    @Transactional
    public FacilityOverviewResponse saveFacility(Long id, FacilitySave input, List<MultipartFile> files) {
        validateFacility(input.code(), input.name(), input.address());
        if (id != null) lock(new Owner(id, true));
        var result = id == null ? management.createFacility(input.input()) : management.updateFacility(id, input.input());
        var images = replace(new Owner(result.id(), true), input.images(), files);
        return overview(result, images);
    }

    @Transactional
    public FacilityOverviewResponse saveLegacyFacility(Long id, FacilityInputRequest input) {
        validateFacility(input.code(), input.name(), input.address());
        if (id != null) lock(new Owner(id, true));
        var result = id == null ? management.createFacility(input) : management.updateFacility(id, input);
        Owner owner = new Owner(result.id(), true);
        lock(owner);
        List<Row> current = new ArrayList<>(rows(owner));
        if (input.imageUrl() != null) {
            String value = input.imageUrl().trim();
            if (value.isEmpty() || current.isEmpty() || !value.equals(url(current.getFirst()))) {
                List<Row> removed = current.isEmpty() ? List.of() : List.of(current.removeFirst());
                if (!value.isEmpty()) {
                    if (value.length() > 500 || !(value.matches("^/(?!/).*" ) || value.matches("^https?://[^\\s]+$"))) {
                        throw bad("URL ảnh phải là đường dẫn nội bộ hoặc HTTP/HTTPS, tối đa 500 ký tự.");
                    }
                    current.addFirst(new Row(UUID.randomUUID().toString(), null, value, null, null, 0));
                }
                persist(owner, current, removed);
            }
        }
        syncCover(owner, dtos(rows(owner)));
        return overview(result, dtos(rows(owner)));
    }

    @Transactional
    public StorageUnitDto saveUnit(Long id, UnitSave input, List<MultipartFile> files) {
        if (input.facilityId() == null || input.unitTypeId() == null || input.unitCode() == null
                || input.unitCode().isBlank() || input.unitCode().length() > 40
                || input.locationLabel() == null || input.locationLabel().isBlank() || input.locationLabel().length() > 100
                || input.monthlyPrice() == null || input.monthlyPrice().signum() < 0) throw bad("Thông tin kho không hợp lệ.");
        if (id != null) {
            lock(new Owner(id, false));
            Long actual = jdbc.queryForObject("SELECT facility_id FROM storage_units WHERE id=?", Long.class, id);
            if (!input.facilityId().equals(actual)) throw bad("Không thể chuyển kho sang cơ sở khác.");
        }
        var result = id == null ? ops.createUnit(input.input()) : ops.updateUnit(id, input.input());
        return unit(result, replace(new Owner(result.id(), false), input.images(), files));
    }

    @Transactional
    public List<ImageDto> replaceFacilityImages(Long id, ImageInput input, List<MultipartFile> files) {
        return replace(new Owner(id, true), input.images(), files);
    }

    private void lock(Owner owner) {
        var ids = jdbc.queryForList("SELECT id FROM " + owner.table() + " WHERE id=? FOR UPDATE", Long.class, owner.id());
        if (ids.isEmpty()) throw new NotFoundException(owner.facility() ? ErrorCode.FACILITY_NOT_FOUND : ErrorCode.STORAGE_UNIT_NOT_FOUND);
        Long facilityId = owner.facility() ? owner.id()
                : jdbc.queryForObject("SELECT facility_id FROM storage_units WHERE id=?", Long.class, owner.id());
        access.requireFacilityAccess(facilityId);
    }

    private List<ImageDto> replace(Owner owner, List<ImageRef> refs, List<MultipartFile> supplied) {
        lock(owner);
        List<MultipartFile> files = supplied == null ? List.of() : supplied;
        if (refs == null || refs.size() > 10 || files.size() > 10) throw bad("Bộ ảnh phải có tối đa 10 ảnh.");
        List<Row> previous = rows(owner);
        Map<String, Row> byId = new HashMap<>();
        previous.forEach(row -> byId.put(row.id(), row));
        Set<String> retained = new HashSet<>();
        Set<Integer> indices = new HashSet<>();
        Map<Integer, LocalImageStorage.Validated> validated = new HashMap<>();
        for (ImageRef ref : refs) {
            if (ref == null || (ref.id() == null) == (ref.fileIndex() == null)) throw bad("Tham chiếu ảnh không hợp lệ.");
            if (ref.id() != null) {
                if (!byId.containsKey(ref.id()) || !retained.add(ref.id())) throw bad("Ảnh không thuộc kho/cơ sở này hoặc đã thay đổi. Vui lòng tải lại.");
            } else {
                int index = ref.fileIndex();
                if (index < 0 || index >= files.size() || !indices.add(index)) throw bad("Chỉ số tệp ảnh không hợp lệ.");
                validated.put(index, storage.validate(files.get(index)));
            }
        }
        if (indices.size() != files.size()) throw bad("Có tệp ảnh không được tham chiếu trong bộ ảnh.");
        List<String> createdKeys = new ArrayList<>();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) createdKeys.forEach(storage::delete);
            }
        });
        List<Row> next = new ArrayList<>();
        for (ImageRef ref : refs) {
            if (ref.id() != null) next.add(byId.get(ref.id()));
            else {
                var image = validated.get(ref.fileIndex());
                String key = storage.write(image);
                createdKeys.add(key);
                next.add(new Row(UUID.randomUUID().toString(), key, null, image.contentType(), (long) image.bytes().length, 0));
            }
        }
        persist(owner, next, previous.stream().filter(row -> !retained.contains(row.id())).toList());
        var result = dtos(rows(owner));
        syncCover(owner, result);
        return result;
    }

    private void persist(Owner owner, List<Row> next, List<Row> removed) {
        // Parent row lock serializes writers. Reinsert avoids unique-order conflicts while reordering.
        jdbc.update("DELETE FROM warehouse_images WHERE " + owner.column() + "=?", owner.id());
        for (int i = 0; i < next.size(); i++) {
            Row row = next.get(i);
            jdbc.update("INSERT INTO warehouse_images (id,facility_id,storage_unit_id,storage_key,legacy_url,content_type,size_bytes,sort_order) VALUES (?,?,?,?,?,?,?,?)",
                    row.id(), owner.facility() ? owner.id() : null, owner.facility() ? null : owner.id(),
                    row.key(), row.legacyUrl(), row.type(), row.size(), i);
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { removed.forEach(row -> storage.delete(row.key())); }
        });
    }

    private void syncCover(Owner owner, List<ImageDto> images) {
        if (owner.facility()) facilities.findById(owner.id()).orElseThrow().setImageUrl(cover(images));
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicUnit> publicUnits(Long facilityId, Long unitTypeId, int page, int size) {
        if (page < 0 || page > 100000 || size < 1 || size > 48) throw bad("Phân trang không hợp lệ.");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM facilities WHERE id=? AND status='ACTIVE'", Long.class, facilityId) == 0) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
        List<Object> params = new ArrayList<>(List.of(facilityId));
        String where = " WHERE u.facility_id=?";
        if (unitTypeId != null) { where += " AND u.unit_type_id=?"; params.add(unitTypeId); }
        long count = jdbc.queryForObject("SELECT COUNT(*) FROM storage_units u" + where, Long.class, params.toArray());
        params.add(size);
        params.add((long) page * size);
        var units = jdbc.query("SELECT u.id,u.unit_code,t.id type_id,t.name,t.size_m2 FROM storage_units u JOIN unit_types t ON t.id=u.unit_type_id"
                        + where + " ORDER BY u.unit_code,u.id LIMIT ? OFFSET ?",
                (rs, n) -> new PublicUnit(rs.getLong("id"), rs.getString("unit_code"), rs.getLong("type_id"),
                        rs.getString("name"), rs.getBigDecimal("size_m2"), null, List.of()), params.toArray());
        var images = galleries(false, units.stream().map(PublicUnit::id).toList());
        return new PageResponse<>(units.stream().map(u -> {
            var list = images.getOrDefault(u.id(), List.of());
            return new PublicUnit(u.id(), u.unitCode(), u.unitTypeId(), u.unitTypeName(), u.sizeM2(), cover(list), list);
        }).toList(), page, size, count, (int) ((count + size - 1) / size));
    }

    public StoredFile file(String id) {
        if (id == null || !id.matches("[0-9a-f-]{36}")) throw new NotFoundException(ErrorCode.NOT_FOUND);
        var found = jdbc.query("SELECT storage_key,content_type FROM warehouse_images WHERE id=? AND storage_key IS NOT NULL",
                (rs, n) -> new StoredFile(storage.path(rs.getString(1)), rs.getString(2)), id);
        if (found.isEmpty() || !java.nio.file.Files.isRegularFile(found.getFirst().path())) throw new NotFoundException(ErrorCode.NOT_FOUND);
        return found.getFirst();
    }

    @Scheduled(initialDelay = 3600000, fixedDelay = 86400000)
    public void cleanOrphans() {
        var referenced = new HashSet<>(jdbc.queryForList("SELECT storage_key FROM warehouse_images WHERE storage_key IS NOT NULL", String.class));
        storage.cleanOrphans(referenced, Instant.now().minus(24, ChronoUnit.HOURS));
    }

    private static void validateFacility(String code, String name, String address) {
        if (code == null || code.isBlank() || code.length() > 30 || name == null || name.isBlank()
                || name.length() > 150 || address == null || address.isBlank()) throw bad("Thông tin cơ sở không hợp lệ.");
    }
    private static BusinessException bad(String message) { return new BusinessException(ErrorCode.BAD_REQUEST, message); }
}
