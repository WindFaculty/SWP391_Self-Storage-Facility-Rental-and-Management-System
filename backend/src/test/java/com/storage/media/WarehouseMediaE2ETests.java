package com.storage.media;

import com.jayway.jsonpath.JsonPath;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.shared.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class WarehouseMediaE2ETests {
    @Container @ServiceConnection static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static final Path STORE = Path.of("target", "media-tests-" + UUID.randomUUID()).toAbsolutePath();
    @DynamicPropertySource static void mediaProperties(DynamicPropertyRegistry properties) {
        properties.add("app.media.storage-dir", STORE::toString);
    }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired WarehouseMediaService media;
    @Autowired PlatformTransactionManager transactions;
    Long facility, otherFacility, type;
    String suffix;

    @BeforeEach void setup() {
        suffix = UUID.randomUUID().toString().substring(0, 8);
        facility = facility("A");
        otherFacility = facility("B");
        jdbc.update("INSERT INTO unit_types(name,size_m2,min_monthly_price,max_monthly_price) VALUES (?,5,100,1000)", "Type-" + suffix);
        type = jdbc.queryForObject("SELECT id FROM unit_types WHERE name=?", Long.class, "Type-" + suffix);
    }
    Long facility(String code) {
        jdbc.update("INSERT INTO facilities(code,name,address,status) VALUES (?,?,?,'ACTIVE')", code + suffix, "Media Facility", "Test Address");
        return jdbc.queryForObject("SELECT id FROM facilities WHERE code=?", Long.class, code + suffix);
    }
    RequestPostProcessor role(UserRole role, Long scope) {
        return user(new UserPrincipal(1L, "media@test.local", "unused", "Media Tester", role, scope, UserStatus.ACTIVE));
    }
    MockMultipartHttpServletRequestBuilder upload(String method, String path, String data) {
        return multipart(org.springframework.http.HttpMethod.valueOf(method), path)
                .file(new MockMultipartFile("data", "data.json", "application/json", data.getBytes(StandardCharsets.UTF_8)));
    }
    MockMultipartFile image() throws Exception { return new MockMultipartFile("files", "test.png", "image/png", LocalImageStorageTest.png()); }
    String unitData(String images) {
        return "{\"facilityId\":" + facility + ",\"unitTypeId\":" + type + ",\"unitCode\":\"U-" + suffix
                + "\",\"locationLabel\":\"Floor 1\",\"monthlyPrice\":500,\"images\":" + images + "}";
    }
    String createUnit() throws Exception {
        return mvc.perform(upload("POST", "/ops/units", unitData("[{\"fileIndex\":0},{\"fileIndex\":1}]"))
                        .file(image()).file(image()).with(role(UserRole.FACILITY_MANAGER, facility)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.images", hasSize(2)))
                .andReturn().getResponse().getContentAsString();
    }

    @Test void managerCreatesReordersReplacesAndClearsUnitImagesVisibleInPublicCatalog() throws Exception {
        String created = createUnit();
        long unit = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        String first = JsonPath.read(created, "$.data.images[0].id"), second = JsonPath.read(created, "$.data.images[1].id");
        String firstUrl = JsonPath.read(created, "$.data.imageUrl");
        mvc.perform(get(firstUrl).contextPath("/api/v1")).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        mvc.perform(get("/facilities/" + facility + "/units")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].images", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].locationLabel").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].status").doesNotExist());
        mvc.perform(upload("PUT", "/ops/units/" + unit, unitData("[{\"id\":\"" + second + "\"},{\"id\":\"" + first + "\"}]"))
                        .with(role(UserRole.FACILITY_MANAGER, facility)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.images[0].id").value(second));
        mvc.perform(upload("PUT", "/ops/units/" + unit, unitData("[{\"fileIndex\":0},{\"id\":\"" + first + "\"}]"))
                        .file(image()).with(role(UserRole.FACILITY_MANAGER, facility)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.images", hasSize(2)));
        mvc.perform(get("/media/" + second)).andExpect(status().isNotFound());
        mvc.perform(upload("PUT", "/ops/units/" + unit, unitData("[]")).with(role(UserRole.FACILITY_MANAGER, facility)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.images", hasSize(0))).andExpect(jsonPath("$.data.imageUrl").doesNotExist());
        mvc.perform(get(firstUrl).contextPath("/api/v1")).andExpect(status().isNotFound());
    }

    @Test void facilityImagesAreScopedAndExistingJsonClientsRemainCompatible() throws Exception {
        String path = "/ops/facilities/" + facility + "/images";
        for (UserRole forbidden : List.of(UserRole.FACILITY_STAFF, UserRole.CUSTOMER)) {
            mvc.perform(upload("PUT", path, "{\"images\":[{\"fileIndex\":0}]}").file(image()).with(role(forbidden, facility)))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(upload("PUT", path, "{\"images\":[{\"fileIndex\":0}]}").file(image())
                .with(role(UserRole.FACILITY_MANAGER, otherFacility))).andExpect(status().isForbidden());
        mvc.perform(upload("PUT", path, "{\"images\":[{\"fileIndex\":0}]}").file(image())
                .with(role(UserRole.FACILITY_MANAGER, facility))).andExpect(status().isOk());
        mvc.perform(get("/facilities/" + facility)).andExpect(jsonPath("$.data.images", hasSize(1)));
        mvc.perform(put("/management/facilities/" + facility).contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"A" + suffix + "\",\"name\":\"Renamed\",\"address\":\"Test\"}")
                .with(role(UserRole.ADMIN, null))).andExpect(status().isOk()).andExpect(jsonPath("$.data.images", hasSize(1)));
        mvc.perform(put("/management/facilities/" + facility).contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"A" + suffix + "\",\"name\":\"Renamed\",\"address\":\"Test\",\"imageUrl\":\"\"}")
                .with(role(UserRole.ADMIN, null))).andExpect(status().isOk()).andExpect(jsonPath("$.data.images", hasSize(0)));
        mvc.perform(get("/facilities/" + facility)).andExpect(jsonPath("$.data.images", hasSize(0)));
    }

    @Test void invalidUploadsRollBackCreationAndCannotStealAnotherOwnersImage() throws Exception {
        mvc.perform(upload("POST", "/ops/units", unitData("[{\"fileIndex\":0}]"))
                .file(new MockMultipartFile("files", "fake.png", "image/png", "fake".getBytes()))
                .with(role(UserRole.FACILITY_MANAGER, facility))).andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM storage_units WHERE facility_id=?", Long.class, facility)).isZero();
        String created = createUnit();
        String imageId = JsonPath.read(created, "$.data.images[0].id");
        mvc.perform(upload("PUT", "/ops/facilities/" + facility + "/images", "{\"images\":[{\"id\":\"" + imageId + "\"}]}")
                .with(role(UserRole.FACILITY_MANAGER, facility))).andExpect(status().isBadRequest());
        mvc.perform(get("/media/" + imageId)).andExpect(status().isOk());
        long unitId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        mvc.perform(upload("PUT", "/ops/units/" + unitId, unitData("[]"))
                .with(role(UserRole.FACILITY_MANAGER, otherFacility))).andExpect(status().isForbidden());
        mvc.perform(upload("PUT", "/ops/units/" + unitId, unitData("[{\"id\":\"" + imageId + "\"},{\"id\":\"" + imageId + "\"}]"))
                .with(role(UserRole.FACILITY_MANAGER, facility))).andExpect(status().isBadRequest());
        mvc.perform(get("/facilities/" + facility + "/units?size=49")).andExpect(status().isBadRequest());
        jdbc.update("UPDATE facilities SET status='INACTIVE' WHERE id=?", facility);
        mvc.perform(get("/facilities/" + facility + "/units")).andExpect(status().isNotFound());
    }

    @Test void rollbackAfterWritingFilesRemovesNewFilesAndKeepsPreviousImages() throws Exception {
        var principal = new UserPrincipal(1L, "test@local", "unused", "Test", UserRole.ADMIN, null, UserStatus.ACTIVE);
        var context = org.springframework.security.core.context.SecurityContextHolder.getContext();
        context.setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        try {
            var previous = media.replaceFacilityImages(facility,
                    new MediaDtos.ImageInput(List.of(new MediaDtos.ImageRef(null, 0))), List.of(image()));
            long before;
            Files.createDirectories(STORE);
            try (var files = Files.list(STORE)) { before = files.count(); }
            new TransactionTemplate(transactions).executeWithoutResult(status -> {
                try {
                    media.replaceFacilityImages(facility, new MediaDtos.ImageInput(List.of(new MediaDtos.ImageRef(null, 0))), List.of(image()));
                    status.setRollbackOnly();
                } catch (Exception ex) { throw new RuntimeException(ex); }
            });
            try (var files = Files.list(STORE)) { assertThat(files.count()).isEqualTo(before); }
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM warehouse_images WHERE facility_id=?", Long.class, facility)).isEqualTo(1);
            assertThat(media.file(previous.getFirst().id()).path()).exists();
        } finally { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }
    }

    @Test void businessManagerCreatesFacilityWithImagesInOneMultipartRequest() throws Exception {
        String code = "NEW" + suffix;
        mvc.perform(upload("POST", "/management/facilities", "{\"code\":\"" + code
                + "\",\"name\":\"New facility\",\"address\":\"Test\",\"images\":[{\"fileIndex\":0}]}")
                .file(image()).with(role(UserRole.BUSINESS_MANAGER, null)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.images", hasSize(1)));
        mvc.perform(get("/facilities")).andExpect(status().isOk());
    }
}
