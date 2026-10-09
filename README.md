# SWP391 — Base Architecture

Cấu trúc nền cho hệ thống quản lý dịch vụ cho thuê kho tự lưu trữ.

**Trạng thái:** đã dọn source cũ và dựng cây thư mục mới ở local. Chưa có mã ứng dụng, file Java, manifest Maven/npm hoặc cấu hình chạy/deploy mới. Các thư mục trống được giữ trong Git bằng `.gitkeep`. Dự án chưa thể build hoặc chạy.

## Kiến trúc mục tiêu

- Backend: Spring Boot modular monolith, package theo tính năng; luồng Controller → Service → Repository.
- Frontend: React + Vite, tổ chức theo feature và dùng nguồn thiết kế Stitch được bảo toàn.
- Database mục tiêu: MySQL/InnoDB. Thư mục `sql/` hiện giữ schema PostgreSQL và ERD tham chiếu nguyên bản; không chạy trực tiếp script đó trên MySQL.
- Deployment tương lai: frontend trên Cloudflare Pages; backend/MySQL trên EC2. Chưa cấu hình hay tạo tài nguyên cloud.

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

Migration MySQL sau này có một nguồn executable chuẩn ở `backend/src/main/resources/db/migration/mysql/`. Hiện thư mục chỉ có placeholder. Domain/model, quy ước ngày và policy phải được đối chiếu trước khi viết migration.

## Những phần được bảo toàn

- `sql/`: không sửa, di chuyển hoặc xóa SQL/ERD.
- `docs/stitch_self_storage_editorial_homepage_system/`: nguồn frontend mới, không sửa hoặc xóa. App mẫu vẫn giữ riêng, chưa được chép vào frontend mới.
- `.git/`: giữ lịch sử và index hiện có; không commit, stage, reset hoặc push trong lần dựng base này.
- Backup nguồn cũ: `.local-backups/pre-base-restructure-2026-10-09-3c3706.zip` chứa 176 file trước cleanup cùng `BACKUP_MANIFEST.json`; đã kiểm CRC và SHA-256. Không chứa dependency/generated folders; không thay thế backup database.

Source Java/JSX, migration runtime cũ, manifests, Docker/Compose/run scripts và báo cáo/tài liệu cũ đã được lưu trong ZIP rồi dọn khỏi cây làm việc. Các thay đổi đã staged từ trước vẫn ở index; cần rà soát Git khi thực hiện commit sau này.

## Phạm vi hiện tại

Chỉ scaffold thư mục + placeholder + README/.gitignore. Chưa viết backend/frontend mới, chưa sửa SQL, chưa chuyển đổi Stitch, chưa cài dependency, chưa migration/seed database và chưa deploy. Giai đoạn tiếp theo cần yêu cầu riêng: domain/schema → backend → frontend → integration → deployment.
