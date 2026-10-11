# FE2-01 — Audit Stitch Internal Screens, Route Matrix & Internal Layout

**Task:** FE2-01 (W1–W2) — *Audit Stitch internal screens, route matrix, internal layout*
**Owner:** FE2
**Ngày:** 2026-10-10
**Baseline:** git `db73845` (SWP391 Development Plan V2, mục 6)
**Nguồn audit (C09):** `D:\FAll26\SWP391\tranxuankhoa\stitch_self_storage_editorial_homepage_system`
**Trạng thái:** Read-only audit theo mục 11 của kế hoạch. Không thay đổi `frontend/`, `backend/`, `sql/`. Không commit.

Phạm vi: 8 màn nội bộ Stitch (Trang 07–14) + Trang 06 (`/support`, dùng chung) + layout vận hành. Các trang 00–05 thuộc FE1, chỉ ghi nhận ở route matrix để đối chiếu.

Nguồn đối chiếu spec: `design.md` §4.2 (WorkspaceLayout), §5 (components), §7.2 (Workspace), §8 (14 trang), §9 (5 role), §12 (UI states), §13 (ràng buộc dữ liệu), §14 (cấu trúc frontend).

---

## 1. Internal layout hiện trạng

### 1.1. Components layout

| Component | File | Kích thước / cấu trúc | Ghi chú |
|---|---|---|---|
| `ManagementSidebar` | `src/components/ManagementSidebar.jsx` | Fixed trái, `w-[248px]` (dòng 31), khớp §4.2 | 3 nhóm menu, 11 link |
| `ManagementTopbar` | `src/components/ManagementTopbar.jsx` | Fixed `left-[248px]`, `h-[68px]` (dòng 17), khớp §4.2 | Breadcrumb + facility switcher + chuông + avatar |
| `GlobalNavToolbar` | `src/components/GlobalNavToolbar.jsx` | Floating bottom-right `z-[9999]`, `PAGES_LIST` 15 mục (dòng 4–20) | **Demo overlay, không thuộc 14 trang spec — không migrate production** |
| Page shell | 8 trang nội bộ | `<ManagementSidebar /><div className="pl-[248px]">…<ManagementTopbar/>…<main className="pt-[68px]">` lặp lại nguyên khối | Ứng viên số 1 cho `WorkspaceLayout` (§4.2, §14) |

### 1.2. Sidebar (`ManagementSidebar.jsx`)

- Nhóm **Cơ sở vận hành**: `/facility/dashboard` (08), `/facility/units` (09), `/facility/rentals` (10), `/staff/operations` (07).
- Nhóm **Trụ sở & Quản trị**: `/operations/facilities` (11), `/operations/policies` (12), `/operations/reports` (13), `/admin/security` (14).
- Nhóm **Dịch vụ & Khách hàng**: `/support` (06), `/` (00), logout → `/auth` (dòng 176–182).
- Bottom: badge IoT "Ổn định" (dòng 157–163, hardcoded) + user card "Lê Hoàng Nam / Quản lý cơ sở" (dòng 166–183) hardcoded.
- **Không có role gating**: mọi role thấy đủ 3 nhóm menu. Spec §7.2 (dòng 363): "Role khác nhau có menu khác nhau. Tuyệt đối không chỉ ẩn menu ở frontend" → BE vẫn enforce; FE2 cần menu theo role từ auth context.

### 1.3. Topbar (`ManagementTopbar.jsx`)

- Breadcrumb "Khoảng Thở Ops / {category} / {title}" (dòng 21–29).
- Facility switcher: 4 cơ sở hardcoded "Cầu Giấy — Zone B / Q7 Riverside / Bình Thạnh / Đống Đa" (dòng 9–14) — không lọc theo facility assignment của user (liên quan D07).
- Chuông thông báo: 3 notification hardcoded (dòng 109–122); không có model notification trong 13 bảng tối thiểu (§13).
- Đồng hồ "08/10/2026 • Ca Sáng" hardcoded (dòng 84–87).

### 1.4. Bề rộng main content vs spec

| Trang | `max-w` shell | File:line |
|---|---|---|
| 07, 08, 09 | `max-w-[1520px]`, `p-space-3xl lg:p-space-4xl` | StaffOperations:32, FacilityDashboard:32, FacilityUnits:94 |
| 10, 11, 12 | `max-w-[1440px]`, `p-space-xl lg:p-space-3xl` | FacilityRentals:32, OperationsFacilities:32, OperationsPolicies:32 |
| 13, 14 | `max-w-[1680px]`, `p-space-2xl md:p-space-3xl` | OperationsReports:88, AdminSecurity:130 |

Spec §4.2: main padding 32–40px, tối đa ~1440px cho trang bảng. → 07/08/09 vượt bề rộng, 13/14 vượt cả bề rộng; cần chuẩn hóa `WorkspaceLayout` (đề xuất 1440px mặc định, ngoại lệ có lý do).

### 1.5. Design tokens (từ `index.html` dòng 11–140)

- Tailwind CDN config: hệ màu rừng (primary `#073e28`, `primary-container`/`success` `#24553e`, `forest-tint` `#E2EEE4`, `background` `#f9faf5`), semantic (success/warning/danger/info + bg), spacing `space-xs…5xl`, fontSize scale (`page-title`, `section-title`, `kpi-metric`, `ui-table`…), fontFamily (Be Vietnam Pro + Noto Serif).
- Icons: **Material Symbols Outlined** (Google CDN) — spec §5.8 ưu tiên **Lucide** line 1.75–2px → cần chốt (liên quan D17).
- Fonts nạp từ Google Fonts CDN; CSS variables bổ sung trong `<style>` (dòng 141–190).
- Hệ quả migrate: không dùng Tailwind CDN; chuyển token thành cấu hình Tailwind/CSS trong repo (FE1-01 sở hữu `styles/`, FE2 tiêu thụ). D17 chưa chốt quyền copy font/asset.

---

## 2. Route matrix (Stitch → kế hoạch)

Vai trò Stitch (`GlobalNavToolbar` badge) ánh xạ sang vai trò kế hoạch (§4):

| Stitch | Kế hoạch V2 |
|---|---|
| Customer | Khách hàng (Storage Customer) |
| Staff | Nhân viên cơ sở (Facility Staff) |
| Manager | Quản lý cơ sở (Facility Manager) |
| Operations | Quản lý kinh doanh (Business Manager) |
| Admin | Quản trị hệ thống (System Administrator) |

| # | Route Stitch | Màn | Vai trò Stitch | Vai trò mục tiêu | Feature FE2 đích (`frontend/src/features/`) | Module BE | Task |
|---|---|---|---|---|---|---|---|
| 06 | `/support` | Yêu cầu hỗ trợ | Khách & Staff | Customer + Facility Staff/Manager (tab theo role) | `support/` (FE1 sở hữu; FE2 bổ sung tab staff/manager) | `support` (BE3) | FE2-04 |
| 07 | `/staff/operations` | Công việc tại cơ sở | Facility Staff | Facility Staff | `staff/pages/StaffOperationsPage` | `rental` (BE2), `facility` (BE1), `support` (BE3) | FE2-03, FE2-04 |
| 08 | `/facility/dashboard` | Tổng quan cơ sở | Facility Manager | Facility Manager | `facility/pages/FacilityDashboardPage` | `facility`, `rental`, `payment` | FE2-05 |
| 09 | `/facility/units` | Quản lý kho | Facility Manager | Facility Manager | `facility/pages/FacilityUnitsPage` | `facility` (BE1), availability `rental` (BE2) | FE2-02 |
| 10 | `/facility/rentals` | Hợp đồng & phân công | Facility Manager | Facility Manager | `facility/pages/FacilityRentalsPage` | `rental` (BE2), `payment` (BE3) | FE2-03, FE2-04 |
| 11 | `/operations/facilities` | Mạng lưới cơ sở | Business Ops | Business Manager | `management/pages/OperationsFacilitiesPage` | `facility` (BE1) | FE2-05 |
| 12 | `/operations/policies` | Chính sách & bảng phí | Business Ops | Business Manager | `management/pages/OperationsPoliciesPage` | `management`/policy (BE3) | FE2-05 |
| 13 | `/operations/reports` | Báo cáo toàn mạng | Business Ops | Business Manager | `management/pages/OperationsReportsPage` | `payment`/reports (BE3) | FE2-05 |
| 14 | `/admin/security` | Quản trị & bảo mật | System Admin | System Administrator | `admin/pages/AdminSecurityPage` | `account` + audit log (BE1) | FE2-05 |

Ghi chú route:

- **Không tạo route mới** cho drawer/modal/tab (§8 dòng 369). Check-in/handover nằm ở 07 + panel/drawer 10; return/inspection nằm ở 07 (tab Trả kho) + 09 (chuyển INSPECTION/MAINTENANCE); support theo role bằng tab trong 06.
- Sidebar không thể tới các route khách hàng `/facilities`, `/reservation/new`, `/my-rentals`, `/billing` — chỉ tới được bằng `GlobalNavToolbar` demo. Khi migrate, các route này do FE1 quản; FE2 chỉ link "Xem Cổng khách" (`/`) và logout (`/auth`) như topbar/sidebar hiện có.
- Route guard theo role chỉ phục vụ UX (kế hoạch §2, mục "FE routes"); backend vẫn là nơi enforce quyền + facility scope.
- Đích đến FE2-06: map đủ 4 role nội bộ (Staff/Manager/Operations/Admin) → menu + guard + E2E.

---

## 3. Inventory màn hình nội bộ

Ký hiệu trạng thái: tất cả các màn **chỉ có trạng thái populated** — không có loading/skeleton, empty, filtered-empty, error, no-permission (§12). Không có màn nào bị role-gate. Phần lớn CTA không có `onClick` (dead). `FacilityUnits`, `Support`, `AdminSecurity` dùng window globals + DOM class toggle + `alert()`.

### 3.1. Trang 07 — `/staff/operations` (`StaffOperations.jsx`, FE2-03/04)

- **Layout:** shell chuẩn; main 2 cột `xl:col-span-7` (danh sách) + panel sticky phải (check-in).
- **Header:** "Công việc hôm nay" + badge ca trực/ngày/cơ sở (dòng 34–46). CTA `Quét mã đặt chỗ`, `Tạo việc phát sinh` (dòng 50–58) — không handler.
- **KPI (4):** Chưa tiếp nhận 03; Lịch nhận kho 05; Lịch trả kho 02; Đã hoàn thành 08.
- **Tabs (5, tĩnh):** Tất cả (10), Nhận kho (5), Trả kho (2), Kiểm tra & bảo trì (2), Hỗ trợ tại quầy (1) — spec §8.445 yêu cầu 3 nhóm `Nhận kho`/`Trả kho`/`Cần hỗ trợ`.
- **Filters (tĩnh):** search "mã việc, tên, số điện thoại"; khung giờ (Sáng/Chiều/Tối); trạng thái (Chờ tiếp nhận/Đang xử lý/Đã hoàn thành).
- **Bảng:** Mã tác vụ | Nội dung & Đối tượng | Vị trí kho | Khung giờ | Thanh toán | Trạng thái | Thao tác; 5 dòng mock (TSK-0821…).
- **Panel check-in (dòng 383–511):** "Bàn giao kho & Check-in — Kho #24", xác minh hợp đồng RES-2025-0891/cọc/phí, checklist 3/4 (CCCD, khóa điện tử, RFID, PCCC chưa), ghi chú, 3 ảnh + `Thêm ảnh`, nút `Xác nhận hoàn tất & Kích hoạt kho` — tĩnh hoàn toàn.
- **Thiếu vs spec:** không có luồng verify/confirm thật; tab Trả kho chưa có checklist hỏng hóc + chuyển INSPECTION/MAINTENANCE; tìm theo mã đơn/email theo quyền chưa có; touch target 32–40px < 44px (§10); thiếu empty "Hôm nay chưa có công việc được giao." (§12).

### 3.2. Trang 08 — `/facility/dashboard` (`FacilityDashboard.jsx`, FE2-05)

- **Header:** "Tổng quan cơ sở — Cầu Giấy (Zone B)" + chọn kỳ (Hôm nay/7 ngày/Tháng/Quý/Năm); 3 CTA `Quản lý kho`, `Hợp đồng & Đặt chỗ`, `Phân công công việc` — không handler, không link (spec cần CTA tới units/rentals/tasks).
- **KPI: 6 card cùng trọng số** (Tổng 320 kho; Đang thuê 284/88.8%; Khả dụng 24; Bảo trì/Kiểm tra 12; Thực thu 412.8 Tr; Hợp đồng lưu ý 04) — spec §8.456–460 muốn "dải chỉ số nhỏ" và "không tạo 8 KPI cards giống nhau"; danh sách hành động mới là trọng tâm.
- **"Việc cần chú ý ngay hôm nay" (3 mục):** quá hạn thanh toán 5 ngày (CTA gọi khách/gửi nhắc nhở), yêu cầu gia hạn (CTA xem & phê duyệt), kho cần kiểm tra sau trả (CTA xem biên bản/xác nhận hoàn kho) — CTA tĩnh.
- **Charts:** occupancy theo loại kho (bar CSS width); doanh thu 6 tháng (SVG bars + đường mục tiêu). Spec: chỉ render khi có dữ liệu thật → khi migrate phải ẩn khi API rỗng.
- **Bảng watchlist:** hợp đồng sắp hết hạn 7 ngày tới — Mã HĐ | Khách | Kho & Loại | Ngày hết hạn | Ý định/Đề xuất | Nhân viên phụ trách | Trạng thái liên hệ (4 dòng) + `Xuất danh sách` (tĩnh).
- **Khối trạng thái cơ sở:** access control 38 QR check-in; cảm biến 23.5°C/54% RH; ca trực 3 nhân viên — dữ liệu IoT không có bảng backend nào (§13) → cần quyết định giữ dạng placeholder hay bỏ.

### 3.3. Trang 09 — `/facility/units` (`FacilityUnits.jsx`, FE2-02)

- **KPI (4):** Tổng kho 320; Đang thuê (Occupied) 284; Khả dụng 24; Kiểm tra & Bảo trì 12. (KPI render trước h1 — thứ tự cần chỉnh §12/heading.)
- **Toolbar:** search mã kho; lọc loại (Locker/Studio/Home Suite); tầng 1–4; trạng thái `AVAILABLE/OCCUPIED/INSPECTION/MAINTENANCE` kèm số lượng; khung giá; reset → `window.resetFilters()`; `Xuất danh sách` (dead); `Thêm kho mới` → `window.openAddUnitModal()`.
- **Bảng:** Mã kho | Loại kho | Diện tích & Thể tích | Vị trí/Tầng | Giá niêm yết | Khách đang thuê/HĐ | Trạng thái | Thao tác; 6 dòng; phân trang 32 trang.
- **Drawer chi tiết (`#unitDrawer`, dòng 584–730):** specs kho (loại, m², m³, mã khóa `#SL-024 (PIN+NFC)`, IoT `#IOT-24`, nhiệt ẩm), hợp đồng liên quan, cảnh báo an toàn khi OCCUPIED; nút chuyển AVAILABLE **disabled có giải thích** (đúng tinh thần §13), `Đánh dấu INSPECTION` (không lý do — spec cần lý do + điều kiện), input lý do + `Chuyển bảo trì` (alert), ghi chú kỹ thuật.
- **Modal thêm kho (`#addUnitModal`):** Mã | Loại | Vị trí/Tầng | Giá — thiếu modal Sửa (nút `Sửa` dead), thiếu ngưỡng giá theo policy trong form (§8.471), không có field trạng thái.
- **Kỹ thuật:** `window` globals + `getElementById`/`classList` (dòng 20–80), `new Function('event', ...)` cho onClick — phải chuyển thành React state/handlers khi migrate.

### 3.4. Trang 10 — `/facility/rentals` (`FacilityRentals.jsx`, FE2-03/04)

- **KPI (3):** Chờ nhận kho 4 (hôm nay 2); Yêu cầu gia hạn 2 (cần duyệt); Quá hạn thanh toán 1 (trễ 3 ngày).
- **Tabs (6, tĩnh):** Tất cả (48), Chờ nhận (4), Đang thuê (38), Chờ gia hạn (2), Quá hạn (1), Phân công công việc (3). Spec §8.478: `Chờ nhận / Đang thuê / Sắp hết hạn / Quá hạn / Đã kết thúc` → cần thống nhất lại tab theo state machine BE2 (BE2-01).
- **Filters:** search (mã HĐ/tên/SĐT/mã kho); loại kho; thanh toán (Đã thanh toán/Chờ đặt cọc/Quá hạn).
- **Bảng:** Mã HĐ | Khách hàng | Mã kho & Loại | Thời hạn thuê | Trạng thái | Thanh toán | Thao tác; 4 dòng. **Thiếu cột "Nhân viên phụ trách"** (spec §8.479).
- **Panel chi tiết (không phải drawer, dòng 407–531):** hồ sơ khách (CCCD đã xác minh), kho chỉ định, phương thức bàn giao (khóa vân tay + smart card), lịch hẹn nhận kho, tổng thanh toán + hóa đơn, task bàn giao; CTA `Xác nhận bàn giao kho`, `Đổi kho`, `Tạo task hỗ trợ` — tĩnh.
- **Task cards hôm nay (3):** bàn giao thẻ, kiểm tra hoàn trả, bảo trì khóa — tĩnh; `Phân công việc mới` tĩnh.
- **Thiếu vs spec:** drawer hợp đồng chưa có lịch thanh toán/gia hạn/lịch sử; chưa có duyệt gia hạn/xử lý quá hạn/gán-đổi staff thật; chưa có cảnh báo ảnh hưởng tài chính; không có trạng thái handover/return trong panel.

### 3.5. Trang 11 — `/operations/facilities` (`OperationsFacilities.jsx`, FE2-05)

- **KPI (4):** Cơ sở hoạt động 04/04; Tổng kho 1.150; Tỷ lệ lấp đầy TB 88.5%; Bảo trì kỹ thuật 00.
- **List = card editorial, không phải bảng** (3 card: mã, địa chỉ, occupancy, manager, tiện ích) — spec §8.489 muốn table/list mã–tên–địa chỉ–số kho–tình trạng–quản lý.
- **Panel phải:** thông tin vận hành, phân bổ loại kho, đội ngũ 5 người, CTA `Chỉnh sửa thông tin cơ sở`, `Xuất báo cáo (PDF)`, `Tạm dừng nhận khách mới` (danger) — tĩnh. Ghi chú "không hỗ trợ xóa vĩnh viễn" (đúng spec §8.492: chỉ vô hiệu hóa).
- **Thiếu:** không có form/modal/drawer thêm–sửa cơ sở dù có nút; filter "Khu vực"/"Xuất danh mục" tĩnh.

### 3.6. Trang 12 — `/operations/policies` (`OperationsPolicies.jsx`, FE2-05)

- **KPI (3):** Cơ sở tuân thủ 18/18; Tỷ lệ giữ cọc TB 1.00 tháng; Thời hạn gia hạn online 7 ngày.
- **Tabs: 4 tab tĩnh nhưng toàn bộ nội dung render cùng lúc** (không switching): `Quy chế thuê & Hợp đồng`, `Khung giá & Loại kho`, `Biểu phí dịch vụ & Phụ phí`, `Quy tắc ưu đãi kỳ hạn` — spec §8.499 yêu cầu 3 tab (`Chính sách thuê`, `Bảng giá & loại kho`, `Phụ phí`) → cần chốt gộp/tách.
- **Section 1 — chính sách cốt lõi:** cọc 0.5/1/2 tháng; gia hạn online 7 ngày + toggle nhắc SMS/ZNS; hủy trước 48h hoàn 100% / trong 48h khấu trừ 20% / không nhận kho sau 7 ngày hủy tự động; quá hạn: ân hạn 3 ngày, phạt 2%/ngày, khóa PIN ngày 7, thông báo văn bản ngày 15.
- **Section 2 — khung giá theo loại kho:** bảng Min–Max–hiện tại cho 4 loại kho; `Chỉnh sửa biên độ` tĩnh; note ràng buộc Min–Max.
- **Section 3 — phụ phí:** FEE-01 phôi khóa/RFID 150k; FEE-02 xe đẩy 0đ; FEE-03 ngoài giờ 50k/lượt; FEE-04 vệ sinh trả kho 200k.
- **Audit bar:** lần cập nhật cuối 02/01/2025; `Lịch sử phiên bản`, `In nghị quyết` — tĩnh.
- **Thiếu vs spec:** `Lưu thay đổi chính sách` dead, không có preview giá trị cũ/mới + confirmation trước lưu (§8.503); không có activity log; các policy field phải khớp model BE3 (BE3-01/BE3-07), không tự bịa.

### 3.7. Trang 13 — `/operations/reports` (`OperationsReports.jsx`, FE2-05)

- **Filters:** khoảng ngày (Q1/2025); cơ sở (tất cả/4 cơ sở); loại kho (Locker/Studio/Home Suite/Climate-Controlled); `Đặt lại`; menu `Xuất dữ liệu` (.xlsx/.csv) — tĩnh, không bind URL query (spec §5.3 yêu cầu filter phản ánh query params).
- **KPI (6):** Tổng doanh thu 1.845.200.000 ₫; Tổng kho 1.150; Kho đang thuê 986 (164 trống); Occupancy 85.7% (mục tiêu 85%); HĐ đang hoạt động 942; HĐ quá hạn 8. Vượt 4 KPI spec §8.511 nhưng chấp nhận được.
- **Charts (2, đúng giới hạn spec):** doanh thu theo tháng (SVG bars + target polyline, màu hex hardcode); occupancy theo loại kho (bar ngang CSS width) + đề xuất.
- **Bảng chi tiết:** Cơ sở | Địa chỉ | Tổng kho | Đang thuê | Khả dụng | Tỷ lệ lấp đầy | Doanh thu thực thu | Quá hạn | Thao tác (4 dòng) — **chưa sortable, chưa export thật, "Tùy chỉnh cột" tĩnh**.
- **Drawer "Phân quyền & Kiểm soát xuất dữ liệu":** phạm vi dữ liệu, checklist field, watermark BOM — **không có trong spec §8 Trang 13** → câu hỏi scope (giữ tối giản hay bỏ).
- **Số liệu mock tự mâu thuẫn:** KPI occupancy 85.7% vs bảng 88.8/91.7/82.5%; cơ sở "An Trạch Center" vs "Nguyễn Thị Minh Khai". Không dùng làm acceptance data.

### 3.8. Trang 14 — `/admin/security` (`AdminSecurity.jsx`, FE2-05)

- **Tab 1 — Tài khoản:** KPI (Tổng 1.284; Active 1.258; Suspended 26; Quản trị & Vận hành 42); filters search/role (5 role đúng kế hoạch)/facility/status; bảng User ID | Họ tên | Email | Vai trò | Cơ sở phân công | Trạng thái | Ngày tạo | Hành động (7 dòng, 1 dòng disabled).
- **Panel chi tiết:** identity, select role (single-role model + "RBAC Enforced"), select facility scope, khối credential "Argon2id" + magic link, last login + IP; nút `Lưu thay đổi phân quyền` → toast; `Hủy phiên đăng nhập`, `Vô hiệu hóa` — dead; **không có dialog xác nhận** cho thao tác phá hủy.
- **Tab 2 — Nhật ký:** filters search/event-type/time-range (static); bảng Thời gian | Actor | Action Code | Chi tiết | Kết quả | IP (5 dòng; cột "Kết quả" thực chất render chip facility — sai ngữ nghĩa cột); `Xuất PDF/CSV` dead; "Tải thêm" dead.
- **Create user:** chỉ mở panel placeholder "USR-NEW / Hồ sơ mới" — **không có form tạo thật**.
- **Thiếu:** disable/restore thật, phân trang thật (129 trang mock), role filter cho log, loading/empty/error.

### 3.9. Trang 06 — `/support` (`Support.jsx`, FE2-04 phối hợp FE1)

- **Layout công khai** (`CustomerHeader/Footer`, `max-w-[1360px]`) dù sidebar workspace link tới — bất nhất layout; spec §8.437: dùng tab theo role thay vì nhiều bản sao trang.
- **Role tabs "Customer View / Staff View / Manager View" chỉ đổi banner** (dòng 175–183, 193), không đổi dữ liệu/thao tác — spec muốn tab theo role thật.
- **List:** 2 ticket card (mã TK-8821/TK-8790, mức độ, kho, thời gian, phụ trách); filter trạng thái (Tất cả/Đang xử lý/Đã giải quyết/Đã đóng) lọc DOM.
- **Drawer chi tiết ticket:** thông tin khách/kho/loại vấn đề, timeline 3 bước, phí phát sinh; **Modal tạo ticket:** select kho liên quan, 6 radio phân loại, tiêu đề, mô tả, đính kèm (hint) — **thiếu trường "mức độ ưu tiên"** (§8.434).
- **Thiếu:** staff cập nhật tiến độ, manager gán nhân viên, empty state "Chưa có yêu cầu hỗ trợ." (§12).
- **Boundary:** `features/support/` thuộc FE1 (kế hoạch §3); FE2 chỉ cần phần staff/manager trong cùng trang → cần thống nhất component chung, tránh 2 người sửa 1 file (quy tắc §10).

---

## 4. Cross-cutting gaps

1. **UI states (§12):** 0/8 màn có loading, empty, filtered-empty, error, no-permission. Khi migrate mỗi màn phải có tối thiểu 6 trạng thái qua component chung (`EmptyState`, `ErrorState`, skeleton).
2. **Status vocabulary phân mảnh:** units dùng `AVAILABLE/OCCUPIED/INSPECTION/MAINTENANCE` (khớp §5.7); rental status tự do dạng tiếng Việt ("Chờ bàn giao", "Quá hạn 3 ngày"); staff task ("Chờ tiếp nhận/Đang kiểm tra/Đã thanh lý"). Cần **một** `StatusLabel` + mapping từ enum backend (chờ BE2-01/BE3 schema — không tự đặt enum).
3. **Mock không nhất quán / không dùng được:** cùng khách nhiều mã (RES-2025-0891, RES-0891, HD-2025-0104); ngày cố định 04/01/2025; số liệu occupancy lệch giữa dashboard/policies/reports; 4 facility roster khác nhau giữa topbar/operations; ảnh mock trỏ `lh3.googleusercontent.com` (không được commit — D17).
4. **Toàn bộ hành động nội bộ đang dead:** nút không handler, hoặc `alert()`/window globals. Danh sách thực thi chính cho FE2-02..05: add/edit unit + chuyển trạng thái có lý do (09); handover/check-in + task completion (07, 10); duyệt gia hạn/xử lý quá hạn/đổi kho/gán staff (10); create/edit facility + tạm dừng nhận khách (11); save policy có preview + confirmation (12); sortable/export báo cáo (13); user CRUD + disable/restore + log filters (14); ticket progress/assign (06).
5. **Role gating & facility scope chưa có trong UI:** sidebar/topbar cố định cho mọi role; chọn cơ sở không theo assignment. Cần `WorkspaceLayout` nhận role + facility list từ auth context; guard chỉ UX.
6. **Dữ liệu không có backend model (§13):** IoT/cảm biến, thông báo topbar, "Audit Immutable Ledger SHA-256", watermark BOM — 13 bảng tối thiểu không hỗ trợ → đề xuất bỏ khỏi MVP hoặc hiển thị tĩnh có chủ đích (cần chốt).
7. **Kỹ thuật migrate (JSX → TS):** bỏ `new Function`, window globals, DOM class toggle, `alert()`; filter gắn vào URL query params; charts giữ inline SVG (không cần thêm thư viện chart); icon chốt Material Symbols vs Lucide (D17); touch target 44px cho màn staff/tablet (§10).
8. **Định dạng:** trộn `04/01/2025` vs `04/01/25`, `Tr` vs `₫`, `5.0m²` vs `5.0 m²` → dùng chung `formatDate`/`formatCurrency` vi-VN (§11).

---

## 5. Đề xuất cấu trúc FE2 (đích, chờ G0 trước khi scaffold)

```
frontend/src/
  layouts/WorkspaceLayout.tsx        # sidebar 248 + topbar 68, menu theo role, facility switcher theo assignment
  features/staff/pages/StaffOperationsPage.tsx
  features/facility/pages/{FacilityDashboardPage,FacilityUnitsPage,FacilityRentalsPage}.tsx
  features/facility/components/…      # UnitDrawer, AddEditUnitModal, HandoverPanel, RentalDetailDrawer, TaskCards
  features/management/pages/{OperationsFacilitiesPage,OperationsPoliciesPage,OperationsReportsPage}.tsx
  features/admin/pages/AdminSecurityPage.tsx
  features/{staff,facility,management,admin}/{api,hooks}/…
```

Dùng lại primitives chung (FE1-01 sở hữu): `Button, Input, Select, DateField, Modal, Drawer, Tabs, StatusLabel, DataTable, EmptyState, PageHeader, FilterBar` + `formatCurrency/formatDate` (§14). Không tạo thêm design system riêng cho internal (spec §9: "Role-based UX không đồng nghĩa với 5 design systems").

---

## 6. Câu hỏi/decision cần chốt (liên quan FE2)

| # | Câu hỏi | Đề xuất FE2 | Liên quan |
|---|---|---|---|
| 1 | Menu sidebar theo role: role nào thấy nhóm/chức năng nào? | Draft matrix theo §4 kế hoạch + §9; chờ D13 | D13, FE2-06 |
| 2 | Facility switcher: lọc theo assignment của user (D07 = 1 facility/người MVP)? | Staff/Manager chỉ cơ sở được gán; Admin/Business Manager thấy tất cả | D07 |
| 3 | Icon: Material Symbols (Stitch) hay Lucide (§5.8)? | Lucide theo spec nếu asset/fa hợp lệ; chốt cùng FE1 | D17, FE1-01 |
| 4 | Khối IoT/cảm biến, thông báo topbar, audit ledger, watermark BOM: giữ hay bỏ MVP? | Bỏ khỏi MVP (không có bảng backend), tránh dữ liệu giả | §13, FE2-05 |
| 5 | Trang 06 Support: layout nào khi role nội bộ truy cập (public shell vs workspace)? | 1 route `/support`, tab theo role; layout theo context đăng nhập — thống nhất FE1 | §8.428–437, FE2-04 |
| 6 | Tab trang 12: giữ 4 tab (gồm "Quy tắc ưu đãi kỳ hạn") hay gộp về 3 theo spec? | Gộp về 3 tab; tab 4 chỉ giữ nếu policy model BE3 có | §8.494–503, BE3-01 |
| 7 | Export báo cáo (CSV/XLSX): backend hay frontend sinh file? | FE sinh CSV từ dữ liệu API khi đủ dữ liệu; chỉ thêm endpoint export nếu cần phân quyền/đối soát lớn | §8.513, FE2-05 |
| 8 | Nhãn trạng thái rental/task: theo enum nào? | Chờ BE2-01/BE3 chốt schema, sau đó viết `statusMappings` dùng chung | §5.7, §13 |
| 9 | Định nghĩa doanh thu/occupancy trên dashboard & báo cáo? | Chốt công thức trước khi render chart (§13) — nguồn từ BE3 reports | §8.505–514 |

---

## 7. Kết luận FE2-01

- Route matrix đã phủ đủ 8 màn nội bộ + 1 màn dùng chung; mapping vào 4 feature (`staff`, `facility`, `management`, `admin`) và module BE tương ứng; xác định rõ không tạo route mới cho tab/drawer.
- Layout vận hành đã có đủ 2 primitive (sidebar/topbar) nhưng bị lặp shell ở 8 trang, chưa role-gated, bề rộng main không thống nhất → `WorkspaceLayout` là hạng mục đầu tiên của FE2-02/FE2-06 khi G0 cho phép.
- Toàn bộ tương tác nội bộ trong Stitch là mock tĩnh/dead — khối lượng thực thi thật nằm ở FE2-02…FE2-05, phụ thuộc API contract BE1/BE2/BE3 (M1–M4).
- 9 câu hỏi ở mục 6 cần chốt cùng G0 (D07, D13, D17) và trước W3 (policy/report/status).
- **Không thay đổi runtime; không commit.** Bước tiếp theo: đưa route matrix + câu hỏi vào buổi chốt G0, sau G0 mới scaffold `WorkspaceLayout` và các feature FE2 theo W2.
