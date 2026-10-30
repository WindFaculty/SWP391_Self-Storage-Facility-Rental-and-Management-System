# SWP391 — Self-Storage Facility Rental & Management System

Hệ thống cho thuê và quản lý kho tự lưu trữ (self-storage), phục vụ 5 nhóm người dùng: khách hàng, nhân viên cơ sở, quản lý cơ sở, quản lý kinh doanh và quản trị viên.

## Công nghệ

| Thành phần | Stack |
|---|---|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS 4, React Query, React Router |
| Backend | Spring Boot 4.1, Java 25, Spring Security + JWT, Spring Data JPA, Flyway, MySQL |
| Hạ tầng | MySQL local, NCC infra cho deploy (xem `infra/`) |

## Tính năng theo vai trò

- **Khách hàng (CUSTOMER)**: xem catalog kho, đặt chỗ, hợp đồng, hóa đơn/thanh toán, ticket hỗ trợ.
- **Nhân viên cơ sở (FACILITY_STAFF)**: nhận/xử lý task, check-in/check-out, kiểm tra kho, bàn giao.
- **Quản lý cơ sở (FACILITY_MANAGER)**: dashboard cơ sở, quản lý kho và loại kho, nhân sự, doanh thu.
- **Quản lý kinh doanh (BUSINESS_MANAGER)**: chính sách kinh doanh, loại phí, báo cáo, tổng quan nhiều cơ sở.
- **Quản trị hệ thống (ADMIN)**: quản lý tài khoản/vai trò, nhật ký hoạt động.

## Cấu trúc thư mục

```
backend/    Spring Boot API (port 8088, base path /api/v1)
frontend/   React SPA (Vite dev server port 5173)
sql/        ERD và schema database (MySQL)
docs/       Tài liệu kiến trúc, API, quy trình QA
infra/      Docker local, cấu hình deploy
run.ps1     Script chạy cả backend + frontend cho local dev
```

## Yêu cầu

- Java 25+
- Node.js + npm
- MySQL 8 chạy trên máy (mặc định port 3306)

## Chạy local

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

Script tự: kiểm tra port, `npm ci` nếu thiếu `node_modules`, rồi chạy backend và frontend. Log ghi tại `.run/`.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8088/api/v1
- Swagger UI: http://localhost:8088/api/v1/swagger-ui.html

Kiểm tra nhanh mà không giữ server: `.\run.ps1 -SmokeTest`

Mặc định backend kết nối MySQL tại `localhost:3306`, database `storage_local`, tài khoản `root` và mật khẩu `12345`. Khởi động MySQL trước khi chạy ứng dụng. Nếu cần dùng thông tin khác, cấu hình bằng biến môi trường PowerShell:

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/storage_local?createDatabaseIfNotExist=true&connectionTimeZone=UTC'
$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = 'mat-khau-mysql-cua-ban'
```

Có thể thay đổi các giá trị mặc định trong `backend/src/main/resources/application-local.yml`. Tài khoản cần quyền tạo database nếu `storage_local` chưa tồn tại; Flyway sẽ tạo các bảng và dữ liệu mẫu khi backend khởi động.

Các tài khoản mẫu chỉ dành cho local, cùng mật khẩu `Demo12345!`:

| Email | Vai trò |
|---|---|
| `customer@demo.local` | Khách hàng |
| `manager@demo.local` | Quản lý cơ sở Demo HCM |
| `admin@demo.local` | Quản trị viên |

Seed không ghi đè tài khoản đã tồn tại cùng email.

## Test

```bash
cd frontend
npm run typecheck   # tsc --noEmit
npm run lint        # oxlint
npm test            # vitest
npm run e2e         # playwright
```

```bash
cd backend
./mvnw test
```

## Trạng thái tích hợp

Frontend đã bỏ toàn bộ dữ liệu mock — mọi dữ liệu hiển thị đến từ HTTP API thật. Backend đã merge từ nhánh `le-tri-thien`; đường dẫn FE2 dự kiến trong [docs/api/backend-integration-pending.md](docs/api/backend-integration-pending.md) cần đối chiếu với controller/OpenAPI thực tế. Không đưa mock trở lại.

## Tài liệu

- [Tích hợp backend](docs/api/backend-integration-pending.md)
- [Chiến lược token xác thực (ADR-0001)](docs/architecture/adr-0001-authentication-token-strategy.md)
- [Social login](docs/social-login.md)
- [Báo cáo E2E 2026-10-11](docs/api/e2e-test-report-2026-10-11.md)
