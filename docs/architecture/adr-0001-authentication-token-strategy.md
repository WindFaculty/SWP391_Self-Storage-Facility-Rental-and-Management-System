# ADR-0001: Chiến lược token xác thực (access/refresh/revocation)

- **Trạng thái:** Proposed — chờ chủ dự án duyệt (gắn G0/D13); chưa phải ADR đã chốt.
- **Ngày:** 2026-10-10 (BE1-03, W1–W2)
- **Bối cảnh:** Kế hoạch §2 yêu cầu "Spring Security, JWT access/refresh, token revocation strategy cần duyệt"; D12 đề xuất email/password, không OAuth mặc định.

## Quyết định

1. Đăng nhập email/password; mật khẩu hash bằng BCrypt (`PasswordEncoder`).
2. Access token: JWT HS256, TTL 30 phút (`app.jwt.access-expiration-ms`), claims `sub` (email), `userId`, `tokenType=ACCESS`.
3. Refresh token: JWT HS256, TTL 7 ngày, `tokenType=REFRESH`; backend chỉ lưu **hash SHA-256** trong bảng `refresh_tokens`, không lưu token gốc.
4. Refresh xoay vòng: mỗi lần refresh thu hồi token cũ (`revoked_at`) và cấp cặp token mới.
5. Logout thu hồi refresh token theo hash (idempotent). Access token không blacklist — TTL ngắn giới hạn cửa sổ.
6. Secret đọc từ `JWT_SECRET`; staging bắt buộc có biến môi trường (không default); local/test có default chỉ để dev.

## Hệ quả

- Cần migration `V002__account_refresh_tokens.sql` (bảng ngoài reference PostgreSQL).
- Refresh token dùng lại sau rotation bị từ chối 401.
- Chưa có: reset password, rate limiting, quản lý phiên theo thiết bị, dọn token hết hạn định kỳ — để ở hardening W4/ops.
