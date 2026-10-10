# SWP391 — Base Architecture

Cấu trúc nền cho hệ thống quản lý dịch vụ cho thuê kho tự lưu trữ.

**Trạng thái:** backend buildable — BE1-01..BE1-07: Java 25/Spring Boot 4.1.1 + Maven Wrapper, Flyway MySQL + seed local, auth JWT (ADR-0001 đề xuất), RBAC/facility scope/ownership, CRUD cơ sở/loại kho/kho + catalog công khai, OpenAPI/Swagger + CI, admin user management + audit log + Docker/backup baseline. Frontend vẫn là scaffold thư mục. Các thư mục trống được giữ trong Git bằng `.gitkeep`.

## Kiến trúc mục tiêu

- Backend: Spring Boot modular monolith, package theo tính năng; luồng Controller → Service → Repository.
- Frontend: React + Vite, tổ chức theo feature và dùng nguồn thiết kế Stitch được bảo toàn.
- Database mục tiêu: MySQL/InnoDB. Thư mục `sql/` hiện giữ schema PostgreSQL và ERD tham chiếu nguyên bản; không chạy trực tiếp script đó trên MySQL.
- Deployment tương lai: frontend trên Cloudflare Pages; backend/MySQL trên EC2. Chưa cấu hình hay tạo tài nguyên cloud.

## Chạy backend

Yêu cầu JDK 25. Dùng Maven Wrapper trong `backend/` (không cần cài Maven sẵn):

```text
mvnw.cmd clean verify     # Windows
./mvnw clean verify       # Bash/macOS
mvnw.cmd spring-boot:run  # chạy app
```

Profile mặc định là `local`; đổi bằng biến môi trường `SPRING_PROFILES_ACTIVE` (ví dụ `staging`). Profile `local` mặc định kết nối MySQL ở `jdbc:mysql://localhost:3306/storage_local` (root/root), override bằng `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`; Flyway tự tạo bảng từ DB rỗng và nạp seed demo. Staging bắt buộc có `JWT_SECRET`; local/test dùng default chỉ để dev.

## API hiện có (BE1-03)

Base path `/api/v1`; response theo `ApiResponse` (`success`/`data` hoặc `error.code`).

| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký customer, trả cặp token |
| POST | `/auth/login` | Đăng nhập email/password |
| POST | `/auth/refresh` | Xoay vòng refresh token (token cũ bị thu hồi) |
| POST | `/auth/logout` | Thu hồi refresh token (idempotent) |
| GET | `/auth/me` | Thông tin user hiện tại (Bearer access token) |
| GET | `/facilities`, `/facilities/{id}`, `/facilities/{id}/unit-types`, `/facilities/{id}/available-units` | Catalog công khai (available-units chỉ trả kho AVAILABLE, phân trang) |
| POST/PUT | `/business/facilities`, `/business/unit-types` | BUSINESS_MANAGER/ADMIN tạo & cập nhật cơ sở, tạo loại kho |
| GET/POST | `/manager/facilities/{id}/units` | Danh sách (phân trang)/tạo đơn vị kho — scope cơ sở được gán |
| PUT | `/manager/units/{id}/status` | Đổi trạng thái kho theo transition hợp lệ — scope cơ sở |
| GET/POST | `/admin/users` | Danh sách (lọc role/status/facility) / tạo tài khoản nội bộ (staff,manager phải gán cơ sở) |
| PUT | `/admin/users/{id}/status`, `/admin/users/{id}/facility` | Kích hoạt/vô hiệu hóa tài khoản, gán cơ sở |
| GET | `/admin/audit-logs` | Activity log (lọc userId/action, phân trang) |

Access token TTL 30 phút, refresh TTL 7 ngày, cấu hình qua `app.jwt.*`; xem `docs/architecture/adr-0001-authentication-token-strategy.md`. Swagger UI công khai tại `/api/v1/swagger-ui.html` (spec `/api/v1/v3/api-docs`). CI `.github/workflows/ci.yml` chạy `mvnw verify` (JDK 25, Docker cho Testcontainers) mỗi push/PR.

## RBAC & scope (BE1-04)

Prefix route theo role (ma trận chờ chốt D13):

| Prefix | Role được phép |
|---|---|
| `/admin/**` | ADMIN |
| `/business/**` | ADMIN, BUSINESS_MANAGER |
| `/manager/**` | ADMIN, FACILITY_MANAGER |
| `/staff/**` | ADMIN, FACILITY_MANAGER, FACILITY_STAFF |
| `/customer/**` | ADMIN, CUSTOMER |

- Facility scope: `FacilityAccessService` (bean `@facilityAccess`) — ADMIN/BUSINESS_MANAGER toàn hệ thống; FACILITY_STAFF/MANAGER chỉ cơ sở được gán (D07: 1 cơ sở/người trong MVP).
- Ownership: `OwnershipService` (bean `@ownership`) — chặn truy cập tài nguyên của khách khác; dùng trong `@PreAuthorize`.

## Vận hành (infra)

- `backend/Dockerfile` + `infra/docker/docker-compose.yml`: MySQL 8.4 + backend (profile `local`) cho môi trường dev; secrets qua biến môi trường (xem `.env.example`), không commit `.env`.
- `infra/ec2/backup-mysql.sh`: mysqldump qua `docker exec` + retention (mặc định 7 ngày); lệnh restore nằm trong header script (diễn tập W9).
- EC2/HTTPS/reverse proxy: chưa cấu hình (W8) — chờ chốt D14/D18.

## Cây thư mục

```text
SWP391/
├── backend/
│   └── src/
│       ├── main/
│       │   ├── java/com/storage/
│       │   │   ├── account/
│       │   │   ├── facility/
│       │   │   ├── rental/
│       │   │   ├── payment/
│       │   │   ├── support/
│       │   │   ├── management/
│       │   │   └── shared/
│       │   └── resources/db/migration/mysql/
│       └── test/
│           ├── java/com/storage/{account,facility,rental,payment,support,management,shared}/
│           └── resources/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/{routes,providers}/
│   │   ├── layouts/
│   │   ├── components/{ui,domain}/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── catalog/
│   │   │   ├── reservation/
│   │   │   ├── rental/
│   │   │   ├── billing/
│   │   │   ├── support/
│   │   │   ├── staff/
│   │   │   ├── facility/
│   │   │   ├── management/
│   │   │   └── admin/
│   │   ├── api/
│   │   ├── styles/
│   │   └── assets/{images,icons,fonts}/
│   └── tests/{unit,integration,e2e}/
├── sql/                              # Giữ nguyên SQL/ERD hiện có
├── docs/
│   ├── stitch_self_storage_editorial_homepage_system/  # Giữ nguyên
│   ├── architecture/
│   ├── api/
│   └── operations/
├── infra/{docker,ec2,cloudflare}/
├── .local-backups/                    # ZIP nguồn cũ, không commit
├── .gitignore
└── README.md
```

## Quy ước thư mục

Mỗi module backend `account/facility/rental/payment/support/management` có `controller/`, `dto/`, `entity/`, `repository/`, `service/`. `shared/` có `config/`, `security/`, `entity/`, `exception/`, `response/`, `utils/`. Không đặt orchestration nghiệp vụ vào shared hoặc controller.

Mỗi feature frontend có `pages/`, `components/`, `api/`, `hooks/`. API dùng chung nằm trong `src/api/`; layout/tokens/UI primitives dùng chung, nhưng permission và nghiệp vụ do backend xác thực.

## Migration MySQL (Flyway)

- Nguồn executable duy nhất ở `backend/src/main/resources/db/migration/mysql/`; file `V{NNN}__{snake_case}.sql`, forward-only, không sửa migration đã merge — mọi thay đổi schema bằng migration mới.
- Flyway chạy lúc khởi động (`spring.flyway.locations`); Hibernate chỉ `ddl-auto=validate`, không dùng `update/create`.
- Instant lưu UTC dạng `DATETIME(6)` (mặc định `UTC_TIMESTAMP(6)`); tiền dùng `DECIMAL`; InnoDB/utf8mb4; tên ràng buộc `fk_/ck_/uq_/ix_`.
- Không chuyển các đặc tính PostgreSQL-only sang MySQL (TIMESTAMPTZ, JSONB, INET, partial index, btree_gist EXCLUDE); chống trùng lịch thuê enforce bằng transaction + `SELECT ... FOR UPDATE` (§7.1 kế hoạch).
- Seed demo chỉ ở `backend/src/main/resources/db/seed/local/` (repeatable, chỉ profile `local`, `INSERT IGNORE`, không chứa giá trị policy nghiệp vụ). Staging/production không nạp location này.

## Những phần được bảo toàn

- `sql/`: không sửa, di chuyển hoặc xóa SQL/ERD.
- `docs/stitch_self_storage_editorial_homepage_system/`: nguồn frontend mới, không sửa hoặc xóa. App mẫu vẫn giữ riêng, chưa được chép vào frontend mới.
- `.git/`: giữ lịch sử và index hiện có; không commit, stage, reset hoặc push trong lần dựng base này.
- Backup nguồn cũ: `.local-backups/pre-base-restructure-2026-10-09-3c3706.zip` chứa 176 file trước cleanup cùng `BACKUP_MANIFEST.json`; đã kiểm CRC và SHA-256. Không chứa dependency/generated folders; không thay thế backup database.

Source Java/JSX, migration runtime cũ, manifests, Docker/Compose/run scripts và báo cáo/tài liệu cũ đã được lưu trong ZIP rồi dọn khỏi cây làm việc. Các thay đổi đã staged từ trước vẫn ở index; cần rà soát Git khi thực hiện commit sau này.

## Phạm vi hiện tại

Backend: khung Spring Boot (BE1-01) + baseline MySQL/Flyway/seed local có test Testcontainers (BE1-02); chưa có entity/API nghiệp vụ. Frontend: vẫn scaffold thư mục. SQL PostgreSQL tham chiếu trong `sql/` giữ nguyên. Chưa chuyển Stitch vào frontend và chưa deploy. Tiếp theo: entity/repository + auth (BE1-03).
