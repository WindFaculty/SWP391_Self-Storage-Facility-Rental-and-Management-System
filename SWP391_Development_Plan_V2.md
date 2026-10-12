# SWP391 — DEVELOPMENT PLAN V2

**Dự án:** Self-Storage Facility Rental & Management System  
**Baseline:** Git commit `db738458d7e0ad91651a1e977dd64d948181701e`  
**Trạng thái:** Kế hoạch chờ duyệt; **chưa được phép bắt đầu implement** cho đến khi hoàn tất Decision Gate G0.  
**Ngày lập:** 2026-10-10  
**Nhóm:** 5 người (BE1, BE2, BE3, FE1, FE2)  
**Năng lực ước lượng:** >20 giờ/người/tuần; kế hoạch dùng mức sàn 20 giờ × 5 người × 10 tuần = 1.000 giờ danh nghĩa, trong đó 20–30% dành cho phối hợp, test, review, tài liệu.  
**Deadline:** Chưa xác định; tuần W1–W10 được tính từ ngày bắt đầu sau khi chốt G0.

## 1. ĐÃ CHỐT (DECIDED)

| ID | Quyết định | Giá trị |
|---|---|---|
| C01 | Backend language | Java 25 |
| C02 | Frontend language | TypeScript |
| C03 | Backend architecture | Spring Boot Modular Monolith |
| C04 | Frontend architecture | React + Vite theo feature |
| C05 | Database | MySQL/InnoDB, chuyển đổi từ PostgreSQL reference |
| C06 | Gateway thanh toán | VNPay |
| C07 | Cấp kho | Gán đơn vị kho vật lý cụ thể **ngay tại thời điểm tạo hold**, không chờ check-in |
| C08 | Triển khai | Cloudflare Pages cho frontend; EC2 cho backend và MySQL |
| C09 | Stitch source of truth (local) | `D:\FAll26\SWP391\tranxuankhoa\stitch_self_storage_editorial_homepage_system` |
| C10 | Team | 2 frontend + 3 backend, >20 giờ/người/tuần |

**Lưu ý:** C07 chốt thời điểm gán kho cụ thể; *chưa* chốt khách hàng chọn `unit_id` hay hệ thống tự phân kho từ `unit_type_id`. Đây là quyết định G0 cần duyệt.

## 2. ĐỀ XUẤT TECH STACK (PROPOSED, NOT DECIDED)

| Thành phần | Đề xuất | Giải thích / điều kiện |
|---|---|---|
| Spring Boot | 4.1.1 | Theo tài liệu chính thức tương thích Java 25; đánh giá dependency trước khi freeze |
| Build | Maven + Maven Wrapper | Dễ tái lập build trong nhóm, EC2 và CI |
| Data Access | Spring Data JPA / Hibernate | Dùng repository theo module |
| Migration | Flyway + MySQL | Nguồn executable duy nhất tại `backend/src/main/resources/db/migration/mysql` |
| Schema policy | `ddl-auto=validate` trong runtime | Không dùng `update`/`create` để thay migration |
| Auth | Spring Security, JWT access/refresh, token revocation strategy cần duyệt | Chống truy cập chéo user/cơ sở |
| Contract | OpenAPI 3, REST `/api/v1`, chuẩn lỗi | Codegen TypeScript tùy audit |
| FE data layer | TanStack Query + typed API client | Quản lý server cache, loading/errors |
| FE routes | React Router, route guard chỉ phục vụ UX | Backend vẫn bắt buộc enforce permission |
| Testing BE | JUnit, Spring Boot Test, Testcontainers MySQL | Không dùng H2 thay cho test ràng buộc MySQL |
| Testing FE | Vitest, Testing Library, Playwright | Unit, integration, browser E2E |
| CI | GitHub Actions | Build, lint, test, kiểm tra PR |
| Runtime | Docker Compose + HTTPS reverse proxy | Lưu dữ liệu trên EBS, secrets ngoài Git |
| VNPay | Sandbox PAY, return + server IPN, querydr/reconciliation | Phải có sandbox merchant credentials, HTTPS URL công khai |

Nguồn kiểm chứng: https://docs.spring.io/spring-boot/system-requirements.html ; https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html ; https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html

## 3. QUYỀN SỞ HỮU MODULE (OWNERSHIP)

| Người | Ownership chính | Module/file | Người phối hợp |
|---|---|---|---|
| **BE1** | Backend lead, schema conventions, Account/Facility/Security, CI + EC2 | `account/`, `facility/`, `shared/security`, migrations nền, `infra/` | BE2/BE3 review migration theo module |
| **BE2** | Rental lifecycle: hold, reservation, booking concurrency, handover, renewal, return, staff tasks | `rental/` + task model | BE3 về thanh toán, FE2 vận hành |
| **BE3** | Invoice, Payment VNPay, deposit/refund, Support, Policy, Reports | `payment/`, `support/`, `management/` | BE2 về thay đổi rental status |
| **FE1** | Customer app, Stitch design system, auth UI, catalog, booking, billing, customer rental/support | `frontend/src/features/{auth,catalog,reservation,rental,billing,support}` và `styles/` | BE1/BE2/BE3 |
| **FE2** | Internal app, role layouts, staff, facility manager, business manager, admin | `frontend/src/features/{staff,facility,management,admin}` | BE1/BE2/BE3 |

**Quy tắc:** API contract do backend owner duy trì và FE consumer review. BE1 giữ quyền review kiến trúc/migration, nhưng mỗi BE tự viết và test migration module mình. FE1 duy trì primitives/tokens; FE2 dùng lại cùng UI kit. Mỗi PR tối thiểu một reviewer khác người viết.

## 4. SẢN PHẨM CUỐI CÙNG / DEFINITION OF COMPLETE

1. Khách hàng: đăng ký, đăng nhập, xem cơ sở/loại kho, kiểm tra tồn kho theo thời gian, đặt kho, thanh toán VNPay, xem hợp đồng/chu kỳ thuê, gia hạn, trả kho/yêu cầu trả, mở ticket.
2. Nhân viên cơ sở: lịch bàn giao/trả kho, check-in/handover, xử lý ticket và công việc, kiểm tra điều kiện kho.
3. Quản lý cơ sở: quản lý kho/cơ sở được giao, xác nhận công việc, quản lý availability và kiểm tra vận hành.
4. Quản lý kinh doanh: thiết lập chính sách phí/giá/phần trăm cọc, theo dõi hóa đơn/giao dịch/báo cáo.
5. Admin: quản lý tài khoản, role và facility assignment; xem audit logs (phạm vi quản trị cuối cùng cần xác nhận).
6. Hệ thống: migrations có thể chạy từ database rỗng; API docs; tự động test; CI; staging HTTPS; backup + diễn tập restore; tài liệu cài đặt và demo.

**Không mặc định thuộc phạm vi:** production merchant VNPay, SMS/email, hợp đồng PDF có chữ ký số, hóa đơn VAT điện tử, ứng dụng mobile, cổng nhân viên nhiều cơ sở, thông báo real-time; chỉ thêm sau khi duyệt scope.

## 5. LỘ TRÌNH 10 TUẦN (GATED, KHÔNG PHẢI DEADLINE CỐ ĐỊNH)

| Tuần | Backend trọng tâm | Frontend trọng tâm | Gate / sản phẩm kiểm chứng |
|---|---|---|---|
| **W1** | BE1 chốt ERD MySQL + OpenAPI conventions + quyền; BE2 state machine/locking; BE3 invoice/VNPay contracts | FE1 audit Stitch/tokens/assets; FE2 route/role map và dữ liệu dashboard | **G0:** quyết định nghiệp vụ, ERD v1, API v1, quyền role; mới được bật development |
| **W2** | BE1 Spring Boot/Java25/MySQL/Flyway/JWT/Auth; BE2 entities/availability; BE3 invoice/payment schemas + sandbox handshake | FE1 Vite+TS/import Stitch, auth/catalog shell; FE2 internal shell, guards | **M1:** build FE/BE, MySQL migrate, login, facility catalog |
| **W3** | BE1 facility/unit CRUD & scope; BE2 hold + overlap lock + expiry; BE3 invoice creation, VNPay payment attempt | FE1 search/detail/select date/hold; FE2 inventory management | **M2a:** tạo hold và chống double booking bằng MySQL |
| **W4** | BE1 Auth hardening; BE2 cancel/expiry/release; BE3 VNPay URL/IPN/return/query + idempotency | FE1 VNPay checkout/results/my reservations; FE2 booking/finance status views | **M2b:** từ xem kho → VNPay sandbox → xác nhận rental |
| **W5** | BE1 staff assignment/security; BE2 check-in/handover/appointment; BE3 support ticket/task hooks | FE1 rental detail; FE2 daily task list, check-in/handover | **M3a:** bàn giao chỉ khi đủ điều kiện nghiệp vụ |
| **W6** | BE1 audit/permission regression; BE2 renewal/check-out/inspection/overdue; BE3 renewal/extra invoices, refunds according to decision | FE1 renew/return/support/payment history; FE2 return/inspection/support | **M3b:** thuê → gia hạn → trả → kiểm tra kho |
| **W7** | BE1 Admin users/facilities; BE2 exception flows/overlap edge cases; BE3 fee policy/report dashboards | FE1 responsive/UX validation; FE2 manager/business/admin dashboards | **M4:** đủ 5 role, policy và báo cáo căn bản |
| **W8** | BE1 EC2/Docker/HTTPS/security; BE2+BE3 integration fixes, payment reconciliation | FE1 Cloudflare Pages/staging; FE2 full internal E2E | **M5:** staging HTTPS, IPN end-to-end, test smoke public |
| **W9** | Cả 3 BE security/load/concurrency tests/backup-restore/hardening | Cả 2 FE cross-browser/regression/accessibility/visual QA | **M6:** regression pass, không còn bug critical/high chưa xử lý |
| **W10** | Tài liệu vận hành, seed demo, xử lý bug, rehearsal | User guides, acceptance evidence, demo 5 roles | **G6:** UAT, bàn giao và dự phòng |

**Phụ thuộc đường găng:** Requirements & policy → ERD + API → Inventory → Atomic Hold → Invoice/Payment → VNPay IPN → Rental Activation → Handover → Renewal/Return → UAT. Nếu G0 chậm, không được "bù tiến độ" bằng cách code schema chưa được duyệt.

## 6. BACKLOG CÓ MÃ CÔNG VIỆC

### BE1: Account / Facility / Foundation

| ID | Công việc | Gate |
|---|---|---|
| BE1-01 | Thiết lập Java 25, Spring Boot, Maven Wrapper, profile local/test/staging | W2 |
| BE1-02 | ERD MySQL, Flyway conventions và seed có kiểm soát | W1–W2 |
| BE1-03 | Auth, password hashing, JWT, refresh/logout theo ADR | W2–W4 |
| BE1-04 | RBAC + object ownership + facility scope tests | W2–W6 |
| BE1-05 | Facility, UnitType, StorageUnit CRUD/query | W3 |
| BE1-06 | OpenAPI, CI pipelines, code quality baseline | W2–W4 |
| BE1-07 | Admin, audit log và secure deployments/backup | W7–W9 |

### BE2: Rental and Operations

| ID | Công việc | Gate |
|---|---|---|
| BE2-01 | Rental state machine, timeline [start_date,end_date), snapshot giá | W1 |
| BE2-02 | Kiểm tra availability từ lịch thuê + trạng thái vật lý | W2–W3 |
| BE2-03 | Atomic hold: lock storage unit, detect overlap, create pending rental | W3 |
| BE2-04 | Hold timeout, cancel, conflict handling, late payment resolution API | W4 |
| BE2-05 | Check-in, handover, access handoff records, staff tasks | W5 |
| BE2-06 | Renewal, overlap check, overdue, check-out, inspection | W6 |
| BE2-07 | Race-condition, invalid state transitions, cross-facility tests | W3–W9 |

### BE3: Payment / Support / Management

| ID | Công việc | Gate |
|---|---|---|
| BE3-01 | Fee policy, deposit/rent invoice model, payment attempt lifecycle | W1–W3 |
| BE3-02 | VNPay sandbox + checksum/HMAC + redirect URL | W3–W4 |
| BE3-03 | IPN idempotency, amount verification, late/duplicate callbacks, query/reconcile | W4–W8 |
| BE3-04 | Renewal/extra fee invoice, payment history, payment audit | W4–W6 |
| BE3-05 | Refund workflow theo quyết định (manual or API), no fake refund success | W6 |
| BE3-06 | Tickets, assignments, staff support workflow | W5–W6 |
| BE3-07 | Business policies, dashboard and reports, security tests | W7–W9 |

### FE1: Customer Experience

| ID | Công việc | Gate |
|---|---|---|
| FE1-01 | Audit Stitch, asset manifest, design tokens, TS migration strategy | W1 |
| FE1-02 | SPA routing, shared UI components, typed API client, auth UI | W2 |
| FE1-03 | Homepage, catalog, availability, facility/unit detail | W2–W3 |
| FE1-04 | Hold/booking, VNPay redirect/result, reservation list | W3–W4 |
| FE1-05 | My Rentals, renewal, return request, payments, support | W5–W6 |
| FE1-06 | Responsive, loading/error/empty states, tests, Cloudflare deploy | W7–W9 |

### FE2: Internal Experience

| ID | Công việc | Gate |
|---|---|---|
| FE2-01 | Audit Stitch internal screens, route matrix, internal layout | W1–W2 |
| FE2-02 | Facility/unit management, scoped inventory views | W3 |
| FE2-03 | Booking/task/appointment dashboard, handover/check-in | W4–W5 |
| FE2-04 | Check-out, inspection, support and task completion | W6 |
| FE2-05 | Facility manager / business manager / admin dashboards | W7 |
| FE2-06 | Access-control UX, E2E role flows, visual/regression QA | W7–W9 |

## 7. CÁC BẤT BIẾN KỸ THUẬT PHẢI TUÂN THỦ

### 7.1 Rental & Inventory

- Kho vật lý được gán và khóa lịch ngay khi tạo `PENDING_PAYMENT` hold (C07), dù khách chỉ chọn loại kho hay kho cụ thể.
- Ngày thuê dùng khoảng nửa mở `[start_date, end_date)`, `end_date` không bao gồm ngày kết thúc.
- Tính khả dụng là hàm theo `unit_id`, ngày bắt đầu/kết thúc, rental state và trạng thái vật lý. Không suy luận chỉ từ `storage_units.status`.
- MySQL không hỗ trợ exclusion constraint giống PostgreSQL. **Mọi thao tác create-hold, cancel, expiry, renew, reallocating dates phải đi qua transaction và cùng chiến lược `SELECT ... FOR UPDATE` trên đơn vị kho.**
- Test đồng thời cùng đơn vị kho/khoảng thời gian: chỉ một giao dịch cấp kho được thành công.
- Khi trả kho: chuyển qua kiểm tra; chỉ sau khi pass inspection mới cho thuê lại. Tình huống overdue giữ kho vật lý phải xử lý ngoại lệ xung đột đặt trước.

### 7.2 VNPay

- Chỉ backend tạo URL thanh toán, quản lý `vnp_TmnCode`/`vnp_HashSecret` bằng secrets; frontend không chứa secret.
- Tạo `payment_attempt` có mã tham chiếu riêng, duy nhất, lưu amount snapshot, invoice/rental id và trạng thái.
- VNPay quy định amount truyền đi bằng số tiền VND nhân 100; áp dụng theo tài liệu tích hợp version đã duyệt.
- `ReturnUrl` dành cho trình duyệt/hiển thị; **không tự xác nhận giao dịch chỉ vì browser quay lại**. Server IPN mới là kênh chủ đạo cập nhật, có thêm cơ chế query/reconcile khi mất callback.
- Validate checksum, merchant code, order reference, số tiền, trạng thái gateway, idempotency trước khi thay đổi invoice/rental. Duplicate IPN không tạo thêm `SUCCESS`.
- Nếu IPN thành công đến sau khi hold đã hết hạn, không tự cấp lại kho đang có thể được giữ bởi người khác. Đưa payment vào trạng thái cần đối soát/xử lý hoàn tiền theo nghiệp vụ đã quyết định.
- EC2 phải đang chạy, HTTPS callback phải public khi demo thanh toán live với sandbox. Nếu tắt EC2, IPN không thể được xử lý trong khoảng thời gian đó; bắt buộc có chiến lược truy vấn đối soát khi bật lại.

### 7.3 Data/Authorization

- Giữ SQL PostgreSQL tham chiếu trong `sql/` để đối chiếu; migration MySQL mới là nguồn chạy runtime. Không sao chép PostgreSQL `TIMESTAMPTZ`, `btree_gist`, `INET`, partial indexes vào MySQL.
- Ghi tiền với kiểu DECIMAL phù hợp, không dùng float/double để tính toán; chọn UTC cho instant timestamps và zone Asia/Ho_Chi_Minh để trình bày và xử lý quy tắc địa phương khi cần.
- Backend kiểm tra role, ownership, assigned facility (giới hạn 1 hay nhiều cơ sở cần duyệt), trạng thái entity tại mỗi command.
- Mỗi module cần migration + test + OpenAPI changes trong cùng PR khi thay model.

## 8. TEST PLAN / ACCEPTANCE GATES

1. **Authentication:** register/login/logout (nếu chọn)/refresh; session validation; customer không thể đọc rentals của khách khác.
2. **RBAC:** role Facility Staff/Manager ở cơ sở A bị từ chối khi truy cập cơ sở B; Business Manager/Admin theo ma trận quyền đã duyệt.
3. **Booking:** hai giao dịch cùng kho/cùng khoảng ngày chỉ một thành công; hai khoảng không giao nhau được cho phép nếu trạng thái vật lý hợp lệ.
4. **Hold timeout:** giữ chỗ hết hạn không chắn lịch; xử lý an toàn nếu callback đến trễ.
5. **VNPay:** payment success/fail, duplicate IPN, forged checksum, amount mismatch, browser return trước IPN, query reconcile.
6. **Handover:** từ `RESERVED` + đủ điều kiện sang `ACTIVE`; không check-in khi chưa đáp ứng payment policy.
7. **Renewal:** từ chối gia hạn khi xung đột lịch; hóa đơn và gia hạn thay đổi đồng bộ sau khi thanh toán thành công.
8. **Return:** ghi condition, inspection, phí cuối kỳ, tiền cọc theo policy; chỉ chuyển kho về available khi kiểm tra xong.
9. **Support:** tạo ticket → gán nhân viên đúng facility → thực hiện task → đóng; log/audit.
10. **Operations:** Flyway fresh DB; Docker reboot; CORS HTTPS; backup và restore MySQL trên máy thử; test staging sau restart EC2.

**Release gate:** Không còn lỗi blocker/critical/high chưa có biện pháp chấp nhận bằng văn bản, toàn bộ 7 luồng chính từ kế hoạch V1 thành công trên staging, CI xanh, có walkthrough cho đủ 5 role.

## 9. DECISION REGISTER — CHƯA CHỐT

### P0 — CHẶN VIỆC KHÓA SCHEMA VÀ TRIỂN KHAI NGHIỆP VỤ (G0)

| ID | Câu hỏi cần chủ dự án xác nhận | Đề xuất mặc định, CHƯA CHỐT | Tác động |
|---|---|---|---|
| D01 | Khách hàng chọn kho vật lý cụ thể hay chỉ chọn loại kho và backend tự gán kho ngay khi hold? | Chỉ chọn facility + loại kho, backend tự gán unit cụ thể trong transaction | Inventory, API, UX |
| D02 | Kỳ thuê/giá: tính theo tháng lịch, 30 ngày cố định, cho thuê theo ngày? Ngày bắt đầu, tối thiểu, end exclusive? | Thuê theo tháng lịch, `[start,end)`, tối thiểu 1 tháng; cần quy tắc cho ngày 29–31 | Schema, giá, renewal |
| D03 | Thanh toán ban đầu: tiền cọc + tiền thuê chung một lần hay tách invoice/giao dịch? | Hai invoice, một checkout tổng hợp chỉ nếu gateway/invoice model hỗ trợ rõ; nếu không 2 lần thanh toán | Payment/Rental activation |
| D04 | Quy tắc cọc, hủy, quá hạn, giảm giá và hoàn cọc? | Business Manager cấu hình; chưa tự tạo % cọc hoặc mức phạt giả | Fee model, refund |
| D05 | Gia hạn có tự động khi thanh toán, cần manager duyệt hay cần cả hai? Có cho gia hạn khi đã có booking tương lai? | Kiểm tra không trùng lịch; gia hạn tự động sau payment nếu hợp lệ | State machine, UX |
| D06 | Phải có bản hợp đồng pháp lý/PDF/chữ ký hay bản ghi thuê và màn hình thông tin là đủ? | Bản ghi thuê + snapshot điều khoản cho MVP | Entities/document storage |
| D07 | Mỗi nhân viên/quản lý có thể thuộc nhiều cơ sở không? | Một facility assignment/người trong MVP | User-Facility relation, RBAC |

### P1 — KHÔNG CHẶN DỰNG NỀN, NHƯNG PHẢI CHỐT TRƯỚC W3/W4

| ID | Câu hỏi | Đề xuất mặc định, CHƯA CHỐT | Deadline quyết định |
|---|---|---|---|
| D08 | VNPay sandbox đã có `TMN_CODE`, `HASH_SECRET` và merchant quyền hoàn tiền chưa? | Sandbox PAY; refund thủ công có audit nếu chưa được cấp API | Trước W3 |
| D09 | Thời gian giữ chỗ chưa thanh toán? Xử lý trễ hạn? | 15 phút giữ chỗ, timeout tự động; trễ hạn dùng reconciliation queue | Trước W3 |
| D10 | Kho chưa kiểm tra sau return, hỏng, maintenance có thể bán lịch tương lai không? | Không chấp nhận đặt cho tới khi sẵn sàng, trừ prebooking đã được policy duyệt | Trước W3 |
| D11 | Giá/loại kho áp dụng toàn hệ thống hay khác nhau theo từng cơ sở? | UnitType toàn hệ thống; giá riêng theo storage unit có snapshot khi thuê | Trước W2 |
| D12 | Auth đăng nhập email/password hay Google, OTP, quên mật khẩu? | Email/password + reset flow nếu scope yêu cầu, không OAuth mặc định | Trước W2 |
| D13 | Vai trò nào được thu phí, hoàn tiền, điều chỉnh giá, xem doanh thu toàn hệ thống? | Role-permission matrix do nhóm duyệt | Trước W2 |
| D14 | MySQL phiên bản, OS/EC2 instance/volume, DNS và staging domain? | MySQL 8.4 LTS; Ubuntu LTS; instance đủ RAM; persistent EBS; TLS proxy | Trước W2/Deploy |
| D15 | Có yêu cầu notification email/SMS, lịch hẹn, báo cáo export, ảnh tình trạng kho không? | Đưa sang phase 2 trừ khi SRS yêu cầu | Trước W4 |
| D16 | VNPay cần demo sandbox hay giao dịch thật khi bảo vệ? | Sandbox end-to-end, không yêu cầu hợp đồng production | Trước W3 |
| D17 | Các ảnh, fonts, dependency, license trong Stitch có thể copy vào repo không? | FE1 audit, không tự commit asset chưa rõ quyền sử dụng | Trước W2 |
| D18 | Demo cần duy trì EC2 24/7 hay cho phép bật/tắt? | Staging bật trong khung làm việc/demo; đối soát khi restart | Trước W8 |

### P2 — SCOPE / OPERATIONS (CHỐT TRƯỚC W7)

- D19: Hóa đơn VAT/chứng từ pháp lý, refund tự động, hợp đồng PDF, image storage và notification có bắt buộc không?
- D20: Dashboard report nào cần số liệu thực, phân quyền xem dữ liệu, bộ lọc, export?
- D21: Deadline bảo vệ, ngày freeze features, ngày demo chính thức và thời gian sẵn có của từng thành viên?

## 10. CƠ CHẾ QUẢN LÝ NHÓM

- Một board có cột `Backlog → Ready → In Progress → PR Review → QA → Done`.
- Mỗi task: ID, owner, mục tiêu, API/schema dependency, acceptance criteria, test evidence, estimate, PR link.
- Họp đồng bộ ngắn 2–3 lần/tuần, báo blocker trong ngày; demo tích hợp cuối tuần.
- Không tạo PR xung đột trên cùng module mà không thông báo owner. Schema changes phải thông báo FE/BE consumers và version API.
- Các migration đã merge không được sửa lịch sử; tạo migration mới để thay đổi.
- Tạo staging sớm trước tuần W8 nếu có thể; môi trường local dùng Docker MySQL cùng version staging.
- Backup trước thay đổi nguy hiểm, không commit `.env`, VNPay secret, AWS credentials, key hay artifacts.
- W1: BE1 lập registry ADR; mỗi quyết định P0 được ghi `ACCEPTED` với chủ dự án/ngày phê duyệt.

## 11. GATE TRƯỚC KHI VIẾT CODE

**Cho phép nghiên cứu/audit:** đọc và inventory Stitch, đánh giá schema, tạo mô tả nghiệp vụ, phát triển mock thiết kế không làm thay đổi project runtime.  
**Chưa cho phép:** tự động xóa/ghi đè `frontend`, `backend`, `sql`; tạo migration/schema giả định và triển khai VNPay production; tạo resource AWS tốn tiền khi chưa được phê duyệt.  
**G0 hoàn thành khi:** D01–D07 đã trả lời, D13 permission draft được duyệt, tech stack baseline được xác nhận và API/ERD v1 khớp nhau.  
**G1 hoàn thành khi:** sandbox VNPay credentials tồn tại và callback staging công khai có thể kiểm thử (hoặc ghi nhận blocked nếu credentials chưa sẵn).  
**G2 hoàn thành khi:** có ngày release/demo và giải pháp cho các quyết định P1 đang ảnh hưởng sprint.

## 12. VIỆC TIẾP THEO

1. Chủ dự án duyệt 7 câu hỏi P0 (D01–D07), khẳng định permission matrix và lựa chọn Spring Boot/Maven/Flyway/MySQL target.
2. Nhóm kiểm tra Stitch tại đường dẫn C09 và báo `asset/component/page manifest`.
3. Ba backend cùng review ERD và schema MySQL đề xuất; BE1 tạo bản `API v1`, BE2/BE3 xác nhận contract.
4. Chỉ sau G0 mới tạo khung ứng dụng, migration Flyway và bắt đầu W2.
