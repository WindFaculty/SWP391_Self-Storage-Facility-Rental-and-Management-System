# SWP391 — Base Architecture

Cấu trúc nền cho hệ thống quản lý dịch vụ cho thuê kho tự lưu trữ.

**Trạng thái:** backend buildable (BE1-01: Java 25, Spring Boot 4.1.1, Maven Wrapper, profile local/test/staging; BE1-02: Flyway baseline MySQL 13 bảng + seed demo local, test bằng Testcontainers). Chưa có API/nghiệp vụ. Frontend vẫn là scaffold thư mục. Các thư mục trống được giữ trong Git bằng `.gitkeep`.

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

Profile mặc định là `local`; đổi bằng biến môi trường `SPRING_PROFILES_ACTIVE` (ví dụ `staging`). Profile `local` mặc định kết nối MySQL ở `jdbc:mysql://localhost:3306/storage_local` (root/root), override bằng `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`; Flyway tự tạo bảng từ DB rỗng và nạp seed demo.

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
