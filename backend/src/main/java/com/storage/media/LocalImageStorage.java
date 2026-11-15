package com.storage.media;

import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Component
public class LocalImageStorage {
    private static final Logger log = LoggerFactory.getLogger(LocalImageStorage.class);
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private final Path root;

    public LocalImageStorage(@Value("${app.media.storage-dir:./uploads}") String directory) {
        root = Path.of(directory).toAbsolutePath().normalize();
    }

    public record Validated(byte[] bytes, String contentType, String extension) {}

    public Validated validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw bad("Mỗi ảnh phải có nội dung và không vượt quá 5 MiB.");
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > MAX_BYTES) throw bad("Ảnh vượt quá 5 MiB.");
            try (var stream = ImageIO.createImageInputStream(new java.io.ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(stream);
                if (!readers.hasNext()) throw bad("Tệp không phải ảnh JPEG hoặc PNG hợp lệ.");
                var reader = readers.next();
                try {
                    reader.setInput(stream, true, true);
                    String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                    if (!Set.of("jpeg", "jpg", "png").contains(format)) throw bad("Chỉ chấp nhận ảnh JPEG và PNG.");
                    String type = format.equals("png") ? "image/png" : "image/jpeg";
                    if (!type.equalsIgnoreCase(file.getContentType())) throw bad("Định dạng nội dung ảnh không khớp loại tệp.");
                    long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                    if (pixels <= 0 || pixels > 20_000_000) throw bad("Ảnh không được vượt quá 20 megapixel.");
                    if (reader.read(0) == null) throw bad("Không đọc được nội dung ảnh.");
                    return new Validated(bytes, type, format.equals("png") ? ".png" : ".jpg");
                } finally { reader.dispose(); }
            }
        } catch (IOException ex) {
            throw bad("Không đọc được ảnh JPEG/PNG. Vui lòng chọn tệp khác.");
        }
    }

    public String write(Validated image) {
        String key = UUID.randomUUID() + image.extension();
        Path temporary = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, "pending-", ".tmp");
            Files.write(temporary, image.bytes());
            try {
                Files.move(temporary, path(key), StandardCopyOption.ATOMIC_MOVE);
            } catch (java.nio.file.AtomicMoveNotSupportedException ex) {
                Files.move(temporary, path(key));
            }
            return key;
        } catch (IOException ex) {
            if (temporary != null) delete(temporary.getFileName().toString());
            throw new IllegalStateException("Không lưu được ảnh trên máy chủ.", ex);
        }
    }

    public Path path(String key) {
        if (key == null || !key.matches("(?:[0-9a-f-]{36}\\.(?:png|jpg)|pending-[A-Za-z0-9-]+\\.tmp)")) {
            throw bad("Mã tệp ảnh không hợp lệ.");
        }
        Path resolved = root.resolve(key).normalize();
        if (!resolved.getParent().equals(root)) throw bad("Đường dẫn ảnh không hợp lệ.");
        return resolved;
    }

    public void delete(String key) {
        if (key == null) return; // Legacy URLs are never owned by this storage.
        try { Files.deleteIfExists(path(key)); }
        catch (IOException ex) { log.warn("Cannot delete media file {}", key, ex); }
    }

    public void cleanOrphans(Set<String> referenced, Instant before) {
        if (!Files.isDirectory(root)) return;
        try (var files = Files.list(root)) {
            files.filter(Files::isRegularFile).forEach(file -> {
                String key = file.getFileName().toString();
                if (!key.matches("(?:[0-9a-f-]{36}\\.(?:png|jpg)|pending-[A-Za-z0-9-]+\\.tmp)")) return;
                try {
                    if (!referenced.contains(key) && Files.getLastModifiedTime(file).toInstant().isBefore(before)) delete(key);
                } catch (IOException ex) { log.warn("Cannot inspect media file {}", key, ex); }
            });
        } catch (IOException ex) { log.warn("Cannot inspect media directory", ex); }
    }

    private static BusinessException bad(String message) { return new BusinessException(ErrorCode.BAD_REQUEST, message); }
}
