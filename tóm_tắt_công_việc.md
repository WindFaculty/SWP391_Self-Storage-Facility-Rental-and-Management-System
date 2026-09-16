# Tóm tắt hiện trạng

## Đã hoàn thành nền tảng

- Chuẩn hóa kiến trúc về sáu module nghiệp vụ.
- Loại bỏ các module và package legacy: `identity`, `billing`, `inventory`, `reservation`, `operations`, `policy`, `reporting`, `audit`.
- Chuẩn hóa role về `CUSTOMER`, `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`.
- Thiết lập Flyway với sáu migration theo module.
- Có khung backend/frontend cho các module chưa triển khai.

## Đã triển khai mã nguồn

- Account: đăng ký, đăng nhập JWT, `/auth/me`, ActivityLog.
- Facility: facility, unit type, storage unit, phạm vi cơ sở và quy tắc price range.
- Frontend: React/Vite, route guard và cấu trúc feature.

## Cần triển khai tiếp

1. Rental: reservation, contract, check-in/check-out, renewal và overdue.
2. Payment: charge/payment lifecycle.
3. Support: ticket assignment và xử lý.
4. Management: rental policy, fee policy, dashboard/report.

Mọi phần mới phải tuân theo `Controller → Service → Repository` và các API trong [kiến_trúc.md](kiến_trúc.md).
