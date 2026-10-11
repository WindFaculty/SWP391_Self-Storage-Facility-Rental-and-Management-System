package com.storage.account.service;

import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
public class SocialTokenVerifier {
    public record Profile(String subject, String email, String name) {}
    private final String facebookAppId;
    private final String facebookSecret;
    private final String facebookVersion;
    private final RestClient http;

    public SocialTokenVerifier(@Value("${app.social.facebook-app-id:}") String facebookAppId,
            @Value("${app.social.facebook-app-secret:}") String facebookSecret,
            @Value("${app.social.facebook-api-version:v25.0}") String facebookVersion) {
        this.facebookAppId = facebookAppId;
        this.facebookSecret = facebookSecret;
        this.facebookVersion = facebookVersion;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    public Profile verify(String provider, String token) {
        try {
            if ("facebook".equals(provider) && !facebookAppId.isBlank() && !facebookSecret.isBlank()) {
                Map<?, ?> debug = http.get().uri("https://graph.facebook.com/{version}/debug_token?input_token={token}",
                        facebookVersion, token).header("Authorization", "Bearer " + facebookAppId + "|" + facebookSecret)
                        .retrieve().body(Map.class);
                Map<?, ?> data = debug == null ? Map.of() : (Map<?, ?>) debug.get("data");
                if (data == null || !Boolean.TRUE.equals(data.get("is_valid"))
                        || !facebookAppId.equals(data.get("app_id")) || !"USER".equals(data.get("type"))
                        || !(data.get("expires_at") instanceof Number expiry)
                        || expiry.longValue() <= Instant.now().getEpochSecond()) throw new IllegalArgumentException();
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(facebookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                String proof = HexFormat.of().formatHex(mac.doFinal(token.getBytes(StandardCharsets.UTF_8)));
                Map<?, ?> user = http.get().uri("https://graph.facebook.com/{version}/me?fields=id,name,email&appsecret_proof={proof}",
                        facebookVersion, proof).header("Authorization", "Bearer " + token).retrieve().body(Map.class);
                if (user == null || !user.get("id").equals(data.get("user_id"))) throw new IllegalArgumentException();
                return profile((String) user.get("id"), (String) user.get("email"), (String) user.get("name"));
            }
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, "Nhà cung cấp đăng nhập chưa được cấu hình.");
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, "Không thể xác minh đăng nhập. Vui lòng thử lại và cho phép chia sẻ email.");
        }
    }

    private Profile profile(String subject, String email, String name) {
        if (subject == null || subject.isBlank() || subject.length() > 255
                || email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || email.length() > 255)
            throw new IllegalArgumentException();
        return new Profile(subject, email, name == null || name.isBlank() ? email : name);
    }
}
