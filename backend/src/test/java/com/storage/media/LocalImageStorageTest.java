package com.storage.media;

import com.storage.shared.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.Set;
import static org.assertj.core.api.Assertions.*;

class LocalImageStorageTest {
    @TempDir Path directory;

    static byte[] png() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        return output.toByteArray();
    }

    @Test void validatesRealContentAndRetainsFilesAcrossStorageInstances() throws Exception {
        var storage = new LocalImageStorage(directory.toString());
        var image = storage.validate(new MockMultipartFile("files", "../../unsafe.png", "image/png", png()));
        String key = storage.write(image);
        assertThat(key).doesNotContain("unsafe");
        assertThat(Files.readAllBytes(new LocalImageStorage(directory.toString()).path(key))).isEqualTo(png());
        assertThatThrownBy(() -> storage.path("../other.png")).isInstanceOf(BusinessException.class);
        storage.delete(key);
        assertThat(Files.exists(storage.path(key))).isFalse();
    }

    @Test void rejectsFakeContentWrongMimeOversizedAndEmptyFiles() throws Exception {
        var storage = new LocalImageStorage(directory.toString());
        assertThatThrownBy(() -> storage.validate(new MockMultipartFile("files", "fake.png", "image/png", "bad".getBytes())))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> storage.validate(new MockMultipartFile("files", "wrong.jpg", "image/jpeg", png())))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> storage.validate(new MockMultipartFile("files", "large.png", "image/png", new byte[(int) LocalImageStorage.MAX_BYTES + 1])))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> storage.validate(new MockMultipartFile("files", new byte[0])))
                .isInstanceOf(BusinessException.class);
    }

    @Test void cleanupOnlyDeletesOldUnreferencedOwnedFiles() throws Exception {
        var storage = new LocalImageStorage(directory.toString());
        var image = storage.validate(new MockMultipartFile("files", "test.png", "image/png", png()));
        String retained = storage.write(image), orphan = storage.write(image), recent = storage.write(image);
        Files.setLastModifiedTime(storage.path(retained), FileTime.from(Instant.now().minusSeconds(172800)));
        Files.setLastModifiedTime(storage.path(orphan), FileTime.from(Instant.now().minusSeconds(172800)));
        Path unrelated = Files.writeString(directory.resolve("unrelated.txt"), "keep");
        storage.cleanOrphans(Set.of(retained), Instant.now().minusSeconds(86400));
        assertThat(Files.exists(storage.path(orphan))).isFalse();
        assertThat(storage.path(retained)).exists();
        assertThat(storage.path(recent)).exists();
        assertThat(unrelated).exists();
    }

    @Test void rejectsImagesAboveTwentyMegapixelsBeforeDecodingPixels() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(5000, 5000, BufferedImage.TYPE_BYTE_GRAY), "png", output);
        var storage = new LocalImageStorage(directory.toString());
        assertThatThrownBy(() -> storage.validate(new MockMultipartFile("files", "large-dimensions.png", "image/png", output.toByteArray())))
                .isInstanceOf(BusinessException.class).hasMessageContaining("20 megapixel");
    }
}
