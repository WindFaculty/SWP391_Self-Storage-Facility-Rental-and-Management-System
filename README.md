# Self-Storage Facility Rental and Management System

Đồ án SWP391 xây dựng hệ thống cho thuê và quản lý kho tự quản đa cơ sở.

## Kiến trúc

Dự án sử dụng **Layered Monolith + Package by Feature**:

```text
React SPA → REST /api/v1 → Spring Boot → Spring Data JPA → SQL Server
```

Sáu module nghiệp vụ chính là `account`, `facility`, `rental`, `payment`, `support` và `management`. Chi tiết chuẩn tại [kiến_trúc.md](kiến_trúc.md).

## Vai trò

`CUSTOMER`, `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`.

Nhân viên và quản lý cơ sở bị giới hạn phạm vi bằng `User.assignedFacilityId`.

## Cấu trúc

```text
src/main/java/com/storage/
├── account/       # tài khoản, xác thực JWT, activity log
├── facility/      # facility, unit type, storage unit
├── rental/        # reservation, contract, handover
├── payment/       # charge, payment
├── support/       # support ticket
├── management/    # rental policy, fee policy, báo cáo
└── shared/        # security, exception, response, utility, config

src/main/resources/db/migration/
├── V001__account.sql
├── V002__facility.sql
├── V003__rental.sql
├── V004__payment.sql
├── V005__support.sql
└── V006__management.sql
```

Các thư mục module chưa triển khai được giữ bằng `.gitkeep` để team phát triển theo cùng một cấu trúc.

API contract: [docs/api/API.md](docs/api/API.md).

## Chạy dự án

Yêu cầu: JDK 25, Node.js 20+ và SQL Server.

Thiết lập biến môi trường trước khi chạy backend:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

```bash
# Backend
./mvnw spring-boot:run

# Frontend
cd src/frontend
npm install
npm run dev
```

- API: `http://localhost:8088/api/v1`
- Frontend: `http://localhost:5173`

## Kiểm tra

```bash
./mvnw test
cd src/frontend && npm run build
```
