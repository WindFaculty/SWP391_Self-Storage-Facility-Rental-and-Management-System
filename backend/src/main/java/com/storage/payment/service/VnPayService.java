package com.storage.payment.service;

import com.storage.payment.config.VnPayProperties;
import com.storage.payment.entity.PaymentAttempt;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class VnPayService {

    public static final String VERSION = "2.1.0";
    public static final String COMMAND = "pay";
    private static final String CURRENCY = "VND";
    private static final String LOCALE = "vn";
    private static final String ORDER_TYPE = "other";
    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnPayProperties properties;

    public VnPayService(VnPayProperties properties) {
        if (!StringUtils.hasText(properties.tmnCode())
                || !StringUtils.hasText(properties.hashSecret())
                || !StringUtils.hasText(properties.payUrl())
                || !StringUtils.hasText(properties.returnUrl())) {
            throw new IllegalStateException(
                    "VNPay configuration is incomplete: vnpay.tmn-code, vnpay.hash-secret, vnpay.pay-url, vnpay.return-url");
        }
        this.properties = properties;
    }

    // ponytail: sandbox URL builder; checksum verification for return/IPN callbacks is BE3-03.
    public String createPaymentUrl(PaymentAttempt attempt, String clientIp, Instant createdAt,
                                   Instant expiresAt) {
        if (attempt == null || attempt.getStatus() != PaymentAttempt.Status.PENDING) {
            throw new IllegalStateException("only a PENDING payment attempt can be sent to VNPay");
        }
        if (!StringUtils.hasText(attempt.getProviderReference())) {
            throw new IllegalStateException("payment attempt has no provider reference");
        }
        if (attempt.getAmount() == null || attempt.getAmount().signum() <= 0) {
            throw new IllegalStateException("payment attempt amount must be > 0");
        }
        if (!StringUtils.hasText(clientIp) || createdAt == null || expiresAt == null) {
            throw new IllegalArgumentException("clientIp, createdAt and expiresAt are required");
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VERSION);
        params.put("vnp_Command", COMMAND);
        params.put("vnp_TmnCode", properties.tmnCode());
        params.put("vnp_Amount", attempt.getAmount().movePointRight(2).toBigIntegerExact().toString());
        params.put("vnp_CurrCode", CURRENCY);
        params.put("vnp_TxnRef", attempt.getProviderReference());
        params.put("vnp_OrderInfo", "Thanh toan hoa don " + attempt.getInvoiceId());
        params.put("vnp_OrderType", ORDER_TYPE);
        params.put("vnp_ReturnUrl", properties.returnUrl());
        params.put("vnp_IpAddr", clientIp);
        params.put("vnp_Locale", LOCALE);
        params.put("vnp_CreateDate", VNPAY_DATE.format(createdAt.atZone(VNPAY_ZONE)));
        params.put("vnp_ExpireDate", VNPAY_DATE.format(expiresAt.atZone(VNPAY_ZONE)));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> param : params.entrySet()) {
            String value = URLEncoder.encode(param.getValue(), StandardCharsets.UTF_8);
            if (!hashData.isEmpty()) {
                hashData.append('&');
            }
            hashData.append(param.getKey()).append('=').append(value);
            query.append(param.getKey()).append('=').append(value).append('&');
        }

        String secureHash = hmacSha512(properties.hashSecret(), hashData.toString());
        return properties.payUrl() + "?" + query + "vnp_SecureHash=" + secureHash;
    }

    private static String hmacSha512(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            Key key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(key);
            return java.util.HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("cannot compute VNPay checksum", e);
        }
    }
}
