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

### Tài khoản và danh mục kho demo

Năm tài khoản dưới đây dùng mật khẩu `123` trên profile `local`.

| Email | Vai trò | Phạm vi |
|---|---|---|
| `admin@gmail.com` | Quản trị viên (`ADMIN`) | Toàn hệ thống |
| `khoa@gmail.com` | Quản lý kinh doanh (`BUSINESS_MANAGER`) | Toàn hệ thống |
| `thien@gmail.com` | Quản lý cơ sở (`FACILITY_MANAGER`) | Gò Vấp |
| `thanh@gmail.com` | Nhân viên cơ sở (`FACILITY_STAFF`) | Gò Vấp |
| `tinh@gmail.com` | Khách hàng (`CUSTOMER`) | Danh mục công khai và đơn thuê của mình |

Khi nâng cấp database local, Flyway chuyển các tài khoản seed cũ còn dùng mật khẩu ban đầu sang email mới nếu email đích còn trống. ID tài khoản được giữ để các hồ sơ thuê và công việc vẫn liên kết đúng.

Danh mục mặc định gồm 25 kho thuộc bốn cơ sở Gò Vấp (4), Bình Thạnh (7), Cầu Giấy (7) và Hải Châu (7). Ba loại kho có diện tích 5, 12 và 20 m², với giá từng kho từ 550.000 đến 2.600.000 đồng/tháng. Địa chỉ, giá và ảnh trong danh mục dùng để minh họa. Mô tả công dụng tham khảo dịch vụ kho tự quản của [MyStorage](https://mystorage.vn/vi/tong-quan-dich-vu-cho-thue-kho-chuyen-nha/kho-tu-quan/) và [Asia Relocation](https://www.asia-relocation.com/vietnam/storage/self-storage/).

Ảnh lưu trong `frontend/public/images` để demo có thể tải ảnh từ chính ứng dụng. Các ảnh dưới đây đã được chỉnh kích thước và nén lại. Ảnh kho nhỏ được chuyển sang JPEG.

| Tệp | Tác giả | Ảnh gốc và giấy phép |
|---|---|---|
| `facilities/hcm-go-vap.jpg` | Alexshteiman | [ACSS outside.JPG](https://commons.wikimedia.org/wiki/File:ACSS_outside.JPG), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `facilities/hcm-binh-thanh.jpg` | Alexshteiman | [ACSS inside.JPG](https://commons.wikimedia.org/wiki/File:ACSS_inside.JPG), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `facilities/hn-cau-giay.jpg` | Hankwang | [Self storage units.jpg](https://commons.wikimedia.org/wiki/File:Self_storage_units.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `facilities/dn-hai-chau.jpg` | Wikideas1 | [Self storage building and garages.jpg](https://commons.wikimedia.org/wiki/File:Self_storage_building_and_garages.jpg), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `unit-types/small.jpg` | Jiwoahn | [Open Empty Storage Unit.webp](https://commons.wikimedia.org/wiki/File:Open_Empty_Storage_Unit.webp), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `unit-types/medium.jpg` | Webmarketingatoutbox | [Box de 8m².jpg](https://commons.wikimedia.org/wiki/File:Box_de_8m%C2%B2.jpg), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `unit-types/large.jpg` | BORNTHISWAYMEDIA | [Storage vault.jpg](https://commons.wikimedia.org/wiki/File:Storage_vault.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

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
