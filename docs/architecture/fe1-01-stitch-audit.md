# FE1-01 — Audit Stitch, Asset Manifest, Design Tokens, Chiến lược chuyển TypeScript

> **Ngày lập:** 2026-10-10 · **Người thực hiện:** FE1 · **Gate:** W1 → nạp bằng chứng cho G0
> **Nguồn audit:** `D:\FAll26\SWP391\tranxuankhoa\stitch_self_storage_editorial_homepage_system` (C09)
> **Quy chuẩn thiết kế:** `stitch_self_storage_editorial_homepage_system/design.md` (v1.0)
> **Tính chất:** audit-only. Không cài dependency, không sửa `frontend/`, `backend/`, `sql/`, không commit asset.

---

## 1. Phạm vi và phương pháp

- Đọc cấu trúc dự án mẫu: 23 file nguồn trong `src/`, tổng **9.648 dòng**; ngoài ra `index.html`, `vite.config.js`, `package.json`, `design.md`.
- Đếm bằng `ripgrep`: icon, URL ngoài, handler, màu hardcode; thống kê LOC bằng PowerShell.
- Bản mẫu dùng **React 18 + React Router 6 + Vite 6 + Tailwind Play CDN**, viết **JSX thuần**, không có TypeScript, không có test, không có CSS file.
- Thư mục bản mẫu **bị `.gitignore`** (`/stitch_self_storage_editorial_homepage_system/`), không được version hóa → tài liệu này là bản ghi duy nhất đi vào Git.

---

## 2. Page manifest (15 route)

| # | Route | File (`src/pages/`) | LOC | Vai trò | Owner | design.md | Trạng thái tương tác |
|---|---|---|---|---|---|---|---|
| 00 | `/` | `TrangChu.jsx` | 348 | Public | **FE1** | Landing editorial (ngoài 14 trang) | Tĩnh + click interceptor toàn cục |
| 01 | `/auth` | `Auth.jsx` | 318 | Tất cả | **FE1** | Trang 01 | Tab Đăng nhập/Đăng ký, state cục bộ |
| 02 | `/facilities` | `Facilities.jsx` | 665 | Public | **FE1** | Trang 02 | 9 handler — toàn bộ là stub |
| 03 | `/reservation/new` | `Reservation.jsx` | 390 | Customer | **FE1** | Trang 03 | Stepper tĩnh |
| 04 | `/my-rentals` | `MyRentals.jsx` | 632 | Customer | **FE1** | Trang 04 | 18 handler — stub, có drawer/modal tĩnh |
| 05 | `/billing` | `Billing.jsx` | 521 | Customer | **FE1** | Trang 05 | Tĩnh, không handler |
| 06 | `/support` | `Support.jsx` | 562 | Customer + Staff + Manager | **FE1** | Trang 06 | 16 handler — stub |
| 07 | `/staff/operations` | `StaffOperations.jsx` | 514 | Facility Staff | FE2 | Trang 07 | Tĩnh |
| 08 | `/facility/dashboard` | `FacilityDashboard.jsx` | 606 | Facility Manager | FE2 | Trang 08 | Tĩnh |
| 09 | `/facility/units` | `FacilityUnits.jsx` | 771 | Facility Manager | FE2 | Trang 09 | 26 handler — stub |
| 10 | `/facility/rentals` | `FacilityRentals.jsx` | 638 | Facility Manager | FE2 | Trang 10 | Tĩnh |
| 11 | `/operations/facilities` | `OperationsFacilities.jsx` | 507 | Business Ops | FE2 | Trang 11 | Tĩnh |
| 12 | `/operations/policies` | `OperationsPolicies.jsx` | 643 | Business Ops | FE2 | Trang 12 | Tĩnh |
| 13 | `/operations/reports` | `OperationsReports.jsx` | 726 | Business Ops | FE2 | Trang 13 | Tĩnh (có hex hardcode — xem §5.2) |
| 14 | `/admin/security` | `AdminSecurity.jsx` | 874 | System Admin | FE2 | Trang 14 | 22 handler — stub |

Ghi chú quan trọng:

- **Mọi handler đều là stub**: `new Function('event', "openDrawer(...)")` bọc trong `try/catch` gọi các hàm không tồn tại → thao tác không có tác dụng. Không chuyển pattern này sang TS.
- FE1 sở hữu **7 route / 3.436 dòng**; FE2 sở hữu 8 route / 5.279 dòng.
- `/support` theo design.md phục vụ cả 3 role bằng tab; FE1 giữ feature `support`, cần chốt phần UI staff/manager có tái sử dụng từ FE2 hay không khi triển khai.

---

## 3. Component manifest

### 3.1 Tái sử dụng được (sau khi chuyển TS)

| Component | LOC | Vai trò | Ghi chú |
|---|---|---|---|
| `components/CustomerHeader.jsx` | 177 | Header public 72px, nav customer, dropdown profile, mobile drawer | Có link nhảy sang Cổng quản lý — phải bỏ hoặc guard theo role |
| `components/CustomerFooter.jsx` | 108 | Footer public | Nội dung marketing tĩnh, cần thay bằng dữ liệu thật |
| `components/ManagementSidebar.jsx` | 176 | Sidebar workspace 248px (FE2) | Nhóm menu theo role; active indicator đúng design.md §4.2 |
| `components/ManagementTopbar.jsx` | 130 | Topbar workspace 68px (FE2) | Breadcrumb + tài khoản |

### 3.2 Prototype-only — KHÔNG đưa vào frontend chính

| File | LOC | Lý do |
|---|---|---|
| `components/GlobalNavToolbar.jsx` | 149 | Công cụ demo: floating navigator 14 trang + role switcher + toggle khung 1920×1080 |
| `utils/navigation.js` | 131 | Bắt sự kiện click toàn cục qua `document.addEventListener` + `ROUTE_MAP`; thay bằng `NavLink`/`useNavigate` |
| `App.jsx` | 54 | Wrapper `isFixed1920` (debug) + route demo; thay bằng router thật + layout theo role |

### 3.3 Còn thiếu — phải tạo mới ở W2 (design.md §14)

- **Primitives `components/ui/`:** Button, Input, Select, DateField, Modal, Drawer, Tabs, StatusLabel, DataTable, EmptyState, PageHeader, FilterBar, PriceBreakdown.
- **Domain `components/domain/`:** StorageUnitCard, RentalSummary, InvoiceSummary, TaskRow, SupportTicketRow.
- Hiện không có component primitive nào; mỗi trang lặp class Tailwind inline (tổng ~4.300 lần `className=`), ví dụ nút primary được viết lại hàng chục lần.

---

## 4. Asset manifest

### 4.1 Fonts (tải từ Google Fonts CDN — `index.html:9-10`)

| Font | Weight | Dùng cho | Rủi ro |
|---|---|---|---|
| Be Vietnam Pro | 300, 400, 500, 600, 700 (+ italic 400) | UI chính toàn hệ thống | Phụ thuộc mạng; production nên self-host |
| Noto Serif | 400, 600 (+ italic) | Heading editorial public | Như trên |
| Material Symbols Outlined | variable (`opsz,wght,FILL,GRAD`) | Toàn bộ icon | Xung đột design.md §5.8 (Lucide) — xem §4.2 |

### 4.2 Icons

- Cơ chế: font icon `Material Symbols Outlined`, render bằng `<span class="material-symbols-outlined">tên_icon</span>`.
- Quy mô: **~170 glyph phân biệt, ~436 lượt sử dụng** trong 20 file (cao nhất: AdminSecurity 67, Facilities 35, OperationsPolicies 35).
- Sidebar/Toolbar còn khai báo thêm tên icon trong mảng JS (`grid_view`, `checklist`, `price_change`…) → inventory thực tế lớn hơn.
- **design.md §5.8 chốt hướng Lucide line 1.75–2px** → phải quyết định: giữ Material Symbols tạm hay chuyển Lucide ngay khi dựng primitives (khuyến nghị: Lucide, vì tree-shakable, không phụ thuộc CDN font).

### 4.3 Images

- **33 lượt tham chiếu, 25 URL duy nhất**, toàn bộ trỏ `https://lh3.googleusercontent.com/aida/...` (host asset của Stitch/AI — không phải ảnh của dự án).
- Phân bố: AdminSecurity 5, OperationsReports 8, Facilities 6, TrangChu 5, MyRentals 3, StaffOperations 2, Auth/Reservation/Support/OperationsFacilities mỗi trang 1.
- **Không có ảnh local**: bản mẫu không có `public/` cũng không có `src/assets/`; không có thông tin license/nguồn.
- Rủi ro pháp lý: **D17 chưa chốt** → không tải, không commit, không hotlink sang production. Kế hoạch: thay bằng ảnh placeholder hoặc ảnh có quyền, self-host tại `frontend/src/assets/images/` sau G0.

### 4.4 CSS / toolchain

- **Không có file `.css` nào.** Toàn bộ style là Tailwind utility inline trong JSX.
- `index.html` nạp **Tailwind Play CDN** (`cdn.tailwindcss.com?plugins=forms,container-queries`) + `tailwind.config` inline (màu, spacing, fontFamily, fontSize) + một khối `<style>` chứa `:root` tokens và scrollbar.
- Play CDN **không dùng cho production** (biên dịch runtime, cần mạng); W2 phải chuyển sang Tailwind build-time hoặc CSS Modules + `tokens.css`.
- `dist/`, `node_modules/` có trên máy nhưng nằm ngoài Git — không vendor.

### 4.5 Danh sách "không chuyển sang"

`GlobalNavToolbar.jsx`, `utils/navigation.js`, `isFixed1920` trong `App.jsx`, mọi `new Function(...)` trong handler, mọi URL `lh3.googleusercontent.com`, `tailwind.config` trùng lặp trong `index.html`, nội dung marketing/số liệu giả trong JSX.

---

## 5. Design tokens

### 5.1 Bộ token chuẩn (theo design.md, ghi lại đây để không phụ thuộc thư mục bị Git bỏ qua)

**Màu lõi:**

| Token | Hex | Vai trò |
|---|---|---|
| `--color-bg` | `#F6F7F2` | Nền trang |
| `--color-surface` | `#FFFEFA` | Bề mặt chính |
| `--color-surface-muted` | `#EEF1E9` | Filter bar, vùng phụ |
| `--color-forest-900` | `#173C2D` | Hover/dark surface |
| `--color-forest-700` | `#24553E` | **Primary** — nút, link, active |
| `--color-forest-100` | `#E2EEE4` | Selected, badge tích cực |
| `--color-sage-500` | `#78907A` | Accent phụ |
| `--color-text` | `#202A24` | Nội dung chính |
| `--color-text-muted` | `#5E6B61` | Nội dung phụ |
| `--color-border` | `#D9E1D7` | Border mảnh, separator |
| `--color-border-strong` | `#B9C8B9` | Border hover |
| `--color-focus` | `#3A795A` | Focus ring |

**Màu trạng thái (fg/bg):** success `#24553E`/`#E2EEE4` · warning `#80551E`/`#FFF1D9` · danger `#943B31`/`#FCE8E5` · info `#315C71`/`#E8F1F6` · neutral `#526158`/`#EBEFEB`.

**Typography:** `Be Vietnam Pro` (UI) + `Noto Serif` (editorial, chỉ ở hero/heading public).
Type scale desktop/mobile: hero 48/58 → 32/40 · page title 30/40 → 26/34 · section 22/30 → 20/28 · subsection 17/26 · body 15/24 · table 14/22 · label 13/20 · KPI 30/36 → 25/32 (`tabular-nums`).

**Spacing:** thang 4px `--space-1..20` (4→80px). **Radius:** sm 6 · md 10 · lg 14 · xl 18. **Shadow:** raised `0 10px 30px rgb(23 60 45 / 8%)`, popover `0 18px 48px rgb(23 60 45 / 12%)`.
**Layout:** content-max 1200px (public), sidebar 248px, topbar 68px, header public 72px, control height 44px.
**Motion:** 120ms fast / 180ms base, ease `cubic-bezier(.2,.8,.2,1)`, tôn trọng `prefers-reduced-motion`.

### 5.2 Sai lệch giữa prototype và chuẩn

| Hạng mục | design.md (chuẩn) | Prototype (`index.html` tailwind.config) | Mức độ |
|---|---|---|---|
| Primary action | `#24553E` (forest-700) | `primary: #073E28`, `primary-hover: #1B402F` — xanh đậm hơn hẳn | **Cao** — mọi nút primary lệch màu |
| Nền trang | `#F6F7F2` | `background: #f9faf5` (body mang class `bg-background` nên màu này thắng) | Trung bình |
| Text chính | `#202A24` | có `text-main: #202A24` nhưng cũng có `on-surface: #1a1c19`; nhiều nơi dùng `text-on-surface` | Trung bình |
| Bảng màu phụ | Không định nghĩa | Thêm ~50 token kiểu Material 3 (`secondary`, `tertiary`, `outline`, `surface-container-*`, `error: #ba1a1a`…) không có trong chuẩn | Trung bình — gây trôi màu |
| Spacing | `--space-1..20` (4px) | Bộ tên riêng `space-sm/md/lg/xl/2xl…`; trang dùng nhiều giá trị tùy ý (`px-3.5`, `gap-2.5`, `text-[13.5px]`) | Thấp |
| Hero | 48/58 semibold | Trang chủ hardcode `text-[42px] sm:text-[50px] lg:text-[56px]` | Thấp |
| Hex hardcode trong JSX | Không cho phép | `OperationsReports.jsx` 20 chỗ, `Support.jsx` 2 chỗ (chart SVG, badge tự vẽ) | Thấp–TB |

Màu trạng thái success/warning/danger/info trong tailwind.config **khớp** design.md — giữ nguyên giá trị này.

### 5.3 Khuyến nghị

1. **design.md là canonical** (C09 đã chốt Stitch là source of truth; design.md là quy chuẩn của chính bộ Stitch). Prototype chỉ là bản diễn giải, không phải chuẩn màu.
2. W2 tạo `frontend/src/styles/tokens.css` từ bảng §5.1 (nội dung đã ghi lại trong tài liệu này, không phụ thuộc thư mục ignored).
3. Nếu dùng Tailwind build-time: config chỉ là **adapter** trỏ về CSS variables (`primary: var(--color-forest-700)`), xóa bảng màu Material 3 thừa; cấm arbitrary hex/px mới trong code review.
4. Không dùng hai nguồn token song song — quyết định trước khi FE1-02 bắt đầu (điều kiện G0 về tech baseline).

---

## 6. Chiến lược chuyển TypeScript

### 6.1 Ánh xạ route → cấu trúc `frontend/` hiện có (FE1 scope)

| Route | Đích đề xuất |
|---|---|
| `/` | `src/features/catalog/pages/HomePage.tsx` + `components/domain/StorageUnitCard` |
| `/auth` | `src/features/auth/pages/AuthPage.tsx` |
| `/facilities` | `src/features/catalog/` (pages: `FacilityListPage`, `FacilityDetailPage`) |
| `/reservation/new` | `src/features/reservation/pages/ReservationNewPage.tsx` |
| `/my-rentals` | `src/features/rental/pages/MyRentalsPage.tsx` |
| `/billing` | `src/features/billing/pages/BillingPage.tsx` |
| `/support` | `src/features/support/` |

Layout: `src/layouts/PublicLayout.tsx` (từ CustomerHeader + CustomerFooter). Primitives: `src/components/ui/`, domain: `src/components/domain/`.

### 6.2 Lộ trình theo tuần (khớp FE1-02…FE1-06)

| Tuần | Việc |
|---|---|
| W2 | Scaffold trong `frontend/` (đang là khung rỗng): Vite + React + TS strict, ESLint/Prettier, Vitest; `tokens.css`; chuyển 4 component tái sử dụng + tạo primitives ưu tiên (PageHeader, FilterBar, StatusLabel, DataTable, ConfirmDialog); PublicLayout; typed API client skeleton; Auth UI |
| W2–W3 | Home, catalog, availability theo ngày, facility/unit detail |
| W3–W4 | Reservation (stepper 3 bước), VNPay redirect/result, reservation list |
| W5–W6 | My Rentals, renewal, return request, billing, support |
| W7–W9 | Responsive, đủ 6 trạng thái UI (design.md §12), a11y, tests, Cloudflare Pages |

### 6.3 Quy tắc kỹ thuật khi chuyển

- `tsconfig` **strict**, không `any`; mỗi component có `interface Props` tường minh (prototype không có prop types nào dù đã cài `@types/react`).
- Không copy handler stub; mọi hành động phải nối API thật hoặc bị ẩn/disabled kèm lý do.
- Xóa click-interceptor toàn cục; dùng `NavLink`/`useNavigate`/`useSearchParams`.
- Trạng thái nghiệp vụ map tập trung tại `src/components/ui/StatusLabel` + `lib/statusMappings` (design.md §5.7); enum theo schema backend đã duyệt, không tự đặt.
- Format tiền/ngày/diện tích qua `lib/formatCurrency|formatDate` (vi-VN, `dd/MM/yyyy`, `1.250.000 ₫`).
- Data layer: typed client + TanStack Query (đề xuất §2 kế hoạch); type DTO sinh từ OpenAPI **chỉ sau khi API v1 đóng băng**, trước đó type viết tay trong `features/*/api`.
- Styling: một nguồn duy nhất — Tailwind build-time gắn CSS variables, hoặc CSS Modules + tokens.css. Không CDN, không style inline trong JSX trừ giá trị động hợp lệ.
- Icons: chốt một bộ (khuyến nghị Lucide) ngay khi dựng primitives để không phải đổi hai lần.

### 6.4 Definition of Done cho mỗi trang khi chuyển

Component TSX không `any` · có loading/success/empty/filtered-empty/error/no-permission (design.md §12) · format vi-VN · keyboard/focus/contrast đạt · gọi API thật, không dữ liệu giả · ít nhất một test cho luồng chính.

---

## 7. Gap analysis so với design.md

| Hạng mục | Hiện trạng prototype | Cần làm |
|---|---|---|
| 6 trạng thái UI/trang | Không có (markup tĩnh) | FE1-06 |
| Filter theo URL query params | Không | W2–W3 khi làm catalog |
| Availability theo khoảng ngày | Không (chỉ hiển thị số tĩnh) | W3, sau API của BE2 |
| Auth thật (token/session/role redirect) | Form tĩnh | W2 sau ADR auth của BE1 |
| VNPay flow | Không có nút luồng thật | W4 |
| a11y | Label có, dialog/focus chưa kiểm | W7–W9 |
| Tests | Không có | W2 setup, W7–W9 phủ |
| Responsive | Có breakpoint trong class nhưng chưa QA | W7 |

---

## 8. Rủi ro và quyết định cần chốt

| # | Vấn đề | Đề xuất | Ai chốt / khi nào |
|---|---|---|---|
| 1 | License ảnh & font của Stitch (D17) | Không dùng asset gốc; thay ảnh có quyền, self-host font | Chủ dự án — trước W2 |
| 2 | Xung đột token (primary `#073E28` vs `#24553E`) | design.md canonical, prototype chỉ tham khảo | G0 (tech baseline) |
| 3 | Bộ icon: Material Symbols vs Lucide | Lucide theo design.md §5.8 | G0/W2 |
| 4 | Bản mẫu không được version hóa — sửa/xóa là mất | Snapshot zip + SHA-256 lưu `.local-backups/` trước W2; mọi nội dung cần thiết đã ghi trong tài liệu này | FE1 — trước W2 |
| 5 | Tailwind Play CDN + Google Fonts CDN | Chuyển build-time + self-host | W2 |
| 6 | Tên thương hiệu "Kho Việt" trong toàn bộ UI | Là tên thiết kế; cần xác nhận tên chính thức của đồ án | Chủ dự án — W2 |
| 7 | `/support` dùng chung Customer/Staff/Manager | Một feature `support`, tab theo role; chốt cách tách code FE1/FE2 | FE1+FE2 — W2 |

---

## 9. Ghi chú tuân thủ gate

- Tài liệu này chỉ **đọc/kiểm kê** theo mục "Cho phép nghiên cứu/audit" của §11 kế hoạch. Không tạo migration, không sửa `frontend/`, `backend/`, `sql/`, không tải asset, không cài dependency.
- Đầu ra khớp yêu cầu W1: "Nhóm kiểm tra Stitch tại C09 và báo `asset/component/page manifest`" (phần FE1) + FE1-01.
- Việc tạo `tokens.css`, primitives hay scaffold TS trong `frontend/` **chỉ thực hiện sau khi G0 hoàn tất** (W2).
