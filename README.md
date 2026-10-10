# SWP391 — Self-Storage Facility Rental & Management System

> Cập nhật: đã bỏ toàn bộ dữ liệu/store mock của frontend và phiên đổi vai trò demo. Workspace yêu cầu đăng nhập thật. Backend chưa merge; các API vận hành mới là adapter với endpoint dự kiến, cần đối chiếu sau merge. Xem [chuẩn bị tích hợp backend](docs/api/backend-integration-pending.md).

Đồ án xây dựng hệ thống cho thuê và quản lý kho tự lưu trữ, phục vụ khách hàng, nhân viên cơ sở, quản lý cơ sở, quản lý kinh doanh và quản trị viên.

## Trạng thái hiện tại

Dự án đang ở giai đoạn chuẩn bị kiến trúc và tài liệu thiết kế.

| Thành phần | Trạng thái |
| --- | --- |
| `backend/` | Khung thư mục Java; chưa có mã ứng dụng hoặc manifest build |
| `frontend/` | Vite + React + TypeScript theo feature; tokens, UI kit, typed API client; FE1 customer app đủ luồng + test + responsive (FE1-02→06) |
| `sql/` | Schema PostgreSQL và các sơ đồ ERD tham chiếu |
| `stitch_self_storage_editorial_homepage_system/` | Bản mẫu giao diện React + Vite riêng tại máy local |
| `docs/` | Thư mục dành cho tài liệu kiến trúc, API và vận hành |
| `infra/` | Khung thư mục dành cho Docker, EC2 và Cloudflare |

Các thư mục khung được giữ bằng `.gitkeep`. Frontend đã build và chạy được ở mức khung (routing, auth UI, catalog kho theo ngày, design tokens, UI kit cơ bản); backend chưa có mã ứng dụng, chưa có API, migration MySQL hay cấu hình kết nối database.

## Phạm vi nghiệp vụ dự kiến

- Tài khoản và phân quyền theo năm vai trò.
- Quản lý cơ sở, loại kho và từng kho lưu trữ.
- Đặt kho, bàn giao, theo dõi hợp đồng thuê, gia hạn và trả kho.
- Hóa đơn, thanh toán, tiền đặt cọc và các khoản phí.
- Yêu cầu hỗ trợ và phân công công việc cho nhân viên.
- Chính sách kinh doanh, báo cáo vận hành và nhật ký hệ thống.

Đây là phạm vi thiết kế, chưa phải danh sách chức năng đã hoàn thiện.

## Kiến trúc định hướng

| Thành phần | Định hướng |
| --- | --- |
| Backend | Spring Boot dạng modular monolith, tổ chức theo nghiệp vụ |
| Frontend | React + Vite, tổ chức theo feature |
| Database ứng dụng | MySQL/InnoDB; cần chuyển đổi từ schema PostgreSQL tham chiếu |
| Triển khai | Frontend trên Cloudflare Pages; backend và MySQL trên EC2 |

Các công nghệ và môi trường triển khai trên là định hướng; cấu hình ứng dụng chính chưa được tạo.

## Cấu trúc thư mục

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
│           ├── java/com/storage/
│           └── resources/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── features/
│   │   ├── api/
│   │   ├── styles/
│   │   └── assets/
│   └── tests/
├── sql/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── operations/
├── infra/
│   ├── docker/
│   ├── ec2/
│   └── cloudflare/
├── stitch_self_storage_editorial_homepage_system/  # Bản mẫu local, Git bỏ qua
├── .local-backups/                               # Bản sao lưu local, Git bỏ qua
├── .gitignore
└── README.md
```

### Backend

Các module `account`, `facility`, `rental`, `payment`, `support` và `management` có các thư mục `controller/`, `dto/`, `entity/`, `repository/`, `service/`. Luồng xử lý dự kiến: `Controller → Service → Repository`; nghiệp vụ đặt trong service.

`shared/` dành cho `config/`, `security/`, `entity/`, `exception/`, `response/` và `utils/` dùng chung.

Migration MySQL khi triển khai sẽ nằm tại `backend/src/main/resources/db/migration/mysql/`; hiện chỉ có placeholder.

### Frontend

`src/features/` gồm `auth`, `catalog`, `reservation`, `rental`, `billing`, `support`, `staff`, `facility`, `management` và `admin`. Mỗi feature có `pages/`, `components/`, `api/`, `hooks/`.

`src/app/` có `routes/` và `providers/`; component dùng chung nằm trong `src/components/ui/` và `src/components/domain/`. Token thiết kế nằm tại `src/styles/tokens.css`; API client typed tại `src/api/client.ts`. Test hiện có Vitest (`npm test`) cạnh mã nguồn (`*.test.ts`); các thư mục `tests/unit`, `tests/integration`, `tests/e2e` dành cho test mở rộng sau này.

Chạy frontend (cần Node.js 20.19+):

```powershell
cd frontend
npm ci
npm run dev
```

Kiểm tra chất lượng: `npm run lint` (oxlint), `npm run typecheck` (tsc), `npm test` (Vitest + Testing Library), `npm run build` (typecheck + Vite build). Vite dev proxy `/api/v1` tới `http://localhost:8088`; đặt `VITE_API_BASE_URL` khi trỏ tới môi trường khác.

### Triển khai frontend lên Cloudflare Pages

Cấu hình Pages (tạo project trên dashboard Cloudflare hoặc bằng Wrangler):

| Mục | Giá trị |
| --- | --- |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output | `dist` |
| Environment variable | `VITE_API_BASE_URL=https://<api-domain>/api/v1` |

`frontend/public/_redirects` đã cấu hình SPA fallback (`/* /index.html 200`). Deploy thủ công bằng Wrangler:

```powershell
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=<ten-project>
```

Chưa có tài khoản/credentials Cloudflare trong repo; bước deploy thật thực hiện khi có quyền truy cập (W8).

## Xem bản mẫu giao diện Stitch

Bản mẫu nằm tại thư mục gốc `stitch_self_storage_editorial_homepage_system/`, tách biệt với `frontend/`. Bản mẫu sử dụng React 18, React Router 6 và Vite 6; có 15 trang, gồm trang chủ và các màn hình khách hàng, vận hành, quản trị.

Thư mục này đang bị bỏ qua bởi `.gitignore`, nên một bản clone mới có thể không chứa bản mẫu. Chỉ thực hiện các lệnh dưới đây khi thư mục và `package.json` của bản mẫu đã có trên máy.

Cần Node.js và npm tương thích với Vite trong lockfile (Node.js `^18.0.0 || ^20.0.0 || >=22.0.0`). Từ thư mục gốc dự án:

```powershell
cd stitch_self_storage_editorial_homepage_system
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal. Cổng được cấu hình là `3000`, thường là `http://localhost:3000`; Vite có thể chọn cổng khác nếu cổng này đang được sử dụng.

Để build và xem bản build, chạy trong thư mục bản mẫu:

```powershell
npm run build
npm run preview
```

Các script trên thuộc bản mẫu giao diện. Backend chính chưa được triển khai để kết nối các luồng nghiệp vụ.

## Schema và tài liệu tham chiếu

- [Schema PostgreSQL](sql/self_storage_schema.sql): 13 bảng mô tả tài khoản, kho, thuê kho, hóa đơn, thanh toán, hỗ trợ và nhật ký.
- [ERD tổng thể](sql/self_storage_erd.png) và [nguồn Mermaid](sql/self_storage_erd.mmd).
- ERD theo nhóm: [kho và thuê kho](sql/erd_inventory_rental.png), [thanh toán](sql/erd_billing.png), [hỗ trợ](sql/erd_support.png).

Schema hiện có dùng các tính năng PostgreSQL như `TIMESTAMPTZ`, `btree_gist` và exclusion constraint để chống trùng lịch thuê. Không chạy trực tiếp script này trên MySQL; cần chuyển đổi kiểu dữ liệu và cơ chế bảo vệ lịch thuê trước khi tạo migration. Khoảng thuê trong schema được quy ước là `[start_date, end_date)`, không bao gồm ngày kết thúc.

Nếu có bản mẫu local, quy chuẩn giao diện nằm trong `stitch_self_storage_editorial_homepage_system/design.md`.

## Quy ước phát triển

- Giữ SQL/ERD và nguồn thiết kế Stitch làm tài liệu tham chiếu khi triển khai ứng dụng mới.
- Backend chịu trách nhiệm kiểm tra quyền truy cập, phạm vi cơ sở và quy tắc nghiệp vụ.
- Đồng bộ domain/model với schema trước khi viết migration và tích hợp API.
- Không đưa dependency, bản build, file môi trường, khóa bí mật hoặc bản sao lưu local vào Git.
- Bổ sung hướng dẫn cài đặt, cấu hình, test và triển khai khi từng thành phần có mã chạy thực tế.
