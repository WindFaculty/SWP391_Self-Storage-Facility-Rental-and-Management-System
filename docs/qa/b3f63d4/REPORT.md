# Báo cáo kiểm thử commit b3f63d4

Ngày kiểm thử: 10/10/2026, Asia/Saigon. Commit đầy đủ: `b3f63d4545b834a25ee7c6387964b1be998bfa52`.
Thư mục: `D:\FAll26\SWP391\tranxuankhoa`. HEAD khớp commit yêu cầu, working tree sạch trước khi kiểm thử.

## Kết quả

Frontend chạy tại http://localhost:5173. Có **12 lỗi được xác nhận**, trong đó 6 lỗi có test hồi quy bổ sung. Các lỗi 10–12 thuộc code FE1 có sẵn, không được quy là lỗi mới do merge. Các lỗi còn lại thuộc phần FE2/ghép workspace.

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | PASS, gồm TypeScript; cảnh báo JS bundle 657.16 kB, gzip 177.57 kB |
| `npm run lint` | 0 error, 20 warning về Fast Refresh và setState trong effect |
| `npm test` | 18 file, 88 test PASS |
| `npm run e2e` | 4/4 PASS |
| `npx vitest run --config qa/vitest.config.ts` | 6/6 FAIL, mỗi test tái hiện một lỗi bên dưới |
| Kiểm tra giao diện | Edge, desktop và viewport mobile 390×844 |

Test hồi quy nằm riêng tại `frontend/qa/`, không được đưa vào suite `npm test` hiện có. Chúng mô tả hành vi đúng cần đạt, nên đang FAIL có chủ đích để chứng minh lỗi. Không sửa code ứng dụng trong đợt kiểm thử này.

## Phạm vi đã kiểm tra

| Trang/luồng | Đã kiểm tra | Kết quả/giới hạn |
|---|---|---|
| `/` | Render, bộ lọc, trạng thái lỗi API | Render được; không tải loại kho/cơ sở |
| `/facilities` | Render, bộ lọc, lỗi dữ liệu | Không tải được cơ sở và tồn kho |
| `/facilities/1` | Render, lỗi API | Không tải được thông tin cơ sở |
| `/auth` | Đăng nhập/đăng ký, validation trống, login với dữ liệu giả | Validation hoạt động; login thất bại vì không có API |
| `/reservation/new` | Render, lỗi API, URL bất thường | Thiếu backend; URL tháng quá lớn gây trang trắng |
| `/my-rentals`, `/billing`, `/support` | Guard khi chưa đăng nhập | Hiển thị form đăng nhập; không kiểm thử luồng người dùng đã đăng nhập với API thật |
| `/payment/result` | Thiếu mã giao dịch | Có thông báo và nút điều hướng; chưa kiểm thử VNPay/IPN thật |
| `/forbidden`, URL không tồn tại | Trang 403/404 | Render đúng |
| `/facility/dashboard` | KPI, biểu đồ, link xử lý | Render; số liệu bị ảnh hưởng bởi lỗi đồng bộ kho |
| `/facility/units` | Danh sách/phân trang, tìm kiếm, validation, tạo kho, sửa giá, drawer | Tạo/sửa bảng được; drawer giữ giá cũ |
| `/facility/rentals` | Tab, danh sách, lịch hẹn, phân công bàn giao | Tạo công việc #10 được; không có log mới cho phân công |
| `/staff/operations` | Đổi role, nhận việc, bàn giao đủ checklist, trả kho đủ checklist, kiểm tra PASS, hỗ trợ, claim ticket, đóng ticket bằng manager | Có các lỗi nghiệp vụ và đồng bộ bên dưới |
| `/operations/facilities` | Bảng, tạo cơ sở | Tạo được; các bộ chọn cơ sở không cập nhật |
| `/operations/policies` | Tab chính sách/giá/phụ phí, xem trước thay đổi cọc 100→50%, lưu, sửa phí 150.000→160.000 | Lưu được; bảng giá loại kho là read-only theo mô tả của trang |
| `/operations/reports` | KPI/biểu đồ/bảng, lọc tháng và cơ sở Q7, bấm Xuất CSV | Lọc được; cơ sở mới có trong bảng nhưng thiếu trong select; chưa xác nhận được file CSV |
| `/admin/security` | Tạo QA User, tìm kiếm, vô hiệu hóa/khôi phục QA User, sửa vai trò admin cuối cùng, nút chống tự vô hiệu hóa, tab nhật ký | Tạo/tìm/vô hiệu hóa/khôi phục mock được; chặn tự vô hiệu hóa; không chặn hạ vai trò admin cuối cùng |
| Workspace mobile | 390×844 | Sidebar cố định chiếm 248 px, nội dung bị ép và tràn ngang |

**Không thể xác nhận toàn bộ tính năng end-to-end:** backend ở thư mục này chỉ có khung `src`, không có manifest hay ứng dụng chạy. FE1 gọi `/api/v1` được proxy tới `localhost:8088`; FE2 dùng store mock trong bộ nhớ. Chưa kiểm thử đăng ký thành công, tài khoản thực, đặt giữ chỗ/tồn kho thực, gia hạn/hủy thuê, hóa đơn/thanh toán/VNPay, tạo hỗ trợ khách hàng qua backend, database, hoặc bảo mật phía server. Không gán PASS cho những luồng này. Các kiểm tra UI dùng dữ liệu QA giả trong mock local.

## Lỗi xác nhận

### QA-01 — P1: bàn giao xong nhưng kho vật lý không chuyển Đang thuê

- Tái hiện: `/facility/dashboard` → role Nhân viên → Công việc tại cơ sở → Nguyễn Minh Quân, công việc #1 → Nhận việc → đánh dấu đủ 3 checklist → nhập tình trạng → Xác nhận hoàn tất.
- Thực tế: hợp đồng #1 chuyển `ACTIVE`, task chuyển `DONE`, nhưng kho #24 vẫn `INSPECTION`.
- Mong đợi: khi bàn giao thành công, kho chuyển `OCCUPIED` và KPI/công suất cập nhật tương ứng.
- Nguyên nhân: `frontend/src/features/facility/api/rentalOpsApi.ts`, `completeHandover()` không gọi cập nhật trạng thái kho. Test hồi quy #2 xác nhận `INSPECTION != OCCUPIED`.
- Hướng sửa: cập nhật hợp đồng/task/kho cùng giao dịch nghiệp vụ, kiểm tra kho đủ điều kiện trước bàn giao; chuẩn hóa seed mock nhất quán.

### QA-02 — P1: kiểm tra định kỳ giải phóng kho đang có khách thuê

- Tái hiện: role Nhân viên → công việc #5, Đỗ Thùy Linh / kho #22 → Nhận việc → chọn Đạt → nhập kết quả → Ghi nhận kết quả kiểm tra.
- Thực tế: báo “Kho #22 đạt kiểm tra và sẵn sàng cho thuê lại”; danh sách kho hiển thị Sẵn sàng dù hợp đồng #6 vẫn `ACTIVE`.
- Mong đợi: kiểm tra định kỳ không làm mất trạng thái đang thuê; chỉ giải phóng kho sau trả kho và kiểm tra sau trả.
- Nguyên nhân: `completeUnitInspection()` đặt `AVAILABLE` cho mọi kết quả PASS mà không kiểm tra hợp đồng đang hiệu lực. Test hồi quy #3 FAIL.
- Rủi ro: có thể chào thuê lại kho đang có người sử dụng, làm sai tồn kho và tỷ lệ lấp đầy.
- Bộ test cũ `opsFlows.test.ts` đang kỳ vọng chính hành vi sai này cho task #5, nên suite xanh chưa chứng minh quy tắc nghiệp vụ đúng.

### QA-03 — P1: hạ vai trò admin cuối cùng vẫn lưu thành công

- Tái hiện: đổi role ADMIN → `/admin/security` → Sửa tài khoản #1 `nam.tran@khoangtho.vn` → đổi Vai trò chính sang Khách hàng → Lưu thay đổi.
- Thực tế: lưu thành công; không còn tài khoản ADMIN đang hoạt động trong danh sách. Sidebar vẫn là admin mock.
- Mong đợi: chặn hạ vai trò quản trị viên hoạt động cuối cùng; đồng bộ/thu hồi quyền phiên khi thay đổi quyền thực.
- Nguyên nhân: `frontend/src/features/admin/api/adminApi.ts`, `updateUser()` không áp dụng guard admin cuối cùng; guard chỉ được dùng khi vô hiệu hóa. Test hồi quy #4 FAIL.

### QA-04 — P1: nhân viên demo không thể nhận ticket

- Tái hiện: role Nhân viên cơ sở → Công việc tại cơ sở → ticket #3 “Chưa nhận được hóa đơn tháng này” → Nhận ticket.
- Thực tế: alert **“Nhân viên không thuộc cơ sở này.”**, ticket vẫn Mới tiếp nhận, không tạo task.
- Nguyên nhân: `SessionProvider.tsx` dùng nhân viên #215 Vũ Thu Thảo; `rentalMockData.ts` chỉ khai báo nhân viên cơ sở #201/#202/#203. `TicketsPanel.handleClaim()` truyền `user.id`, bị `assignTicket()` từ chối.
- Mong đợi: session và danh mục nhân viên thống nhất ID/cơ sở. Test hồi quy #1 FAIL.

### QA-05 — P2: drawer kho giữ dữ liệu cũ sau sửa

- Tái hiện: tạo kho QA-001, Locker, 600.000đ, Tầng QA → tìm QA-001 → Chi tiết → Sửa thông tin kho → giá 650.000đ → Lưu thay đổi.
- Thực tế: bảng/reload đã cập nhật; drawer phía sau vẫn 600.000đ cho đến khi đóng và mở lại.
- Nguyên nhân: `FacilityUnitsPage.handleSubmit()` không cập nhật `selectedUnit` với kết quả `updateUnit()`.
- Mong đợi: thông báo thành công, bảng và drawer cùng hiển thị dữ liệu mới.

### QA-06 — P2: cơ sở mới không có trong các bộ chọn cơ sở

- Tái hiện: role Kinh doanh → Mạng lưới cơ sở → tạo `QA-CS / Cơ sở QA` → mở bộ chọn cơ sở ở topbar hoặc sang Báo cáo/Quản trị.
- Thực tế: cơ sở mới hiện trong bảng cơ sở và bảng báo cáo; không có trong topbar, bộ lọc báo cáo, danh sách phân công cơ sở ở admin.
- Nguyên nhân: `SessionProvider` gọi `listFacilities()` một lần lúc mount; không có invalidation sau mutation cơ sở.
- Mong đợi: tạo/sửa/đổi trạng thái cơ sở cập nhật danh sách dùng chung ngay. Có thể giữ lại cơ sở đang vận hành nhưng inactive theo quy tắc rõ ràng.

### QA-07 — P2: hoàn tất hỗ trợ nhưng panel ticket vẫn Đang xử lý

- Tái hiện: Nhân viên → task #6 hỗ trợ Vũ Quốc Bảo → Nhận việc → nhập ghi nhận xử lý → Ghi nhận hoàn tất.
- Thực tế: task hoàn tất, store ticket đã `RESOLVED`, nhưng hàng ticket #1 bên dưới vẫn Đang xử lý; manager chưa thấy nút Đóng ticket. Rời trang và quay lại mới thấy Đã giải quyết và nút đóng.
- Nguyên nhân: `StaffOperationsPage.tsx` callback `onCompleted` chỉ reload task; `TicketsPanel` có state/query riêng và không nhận tín hiệu reload.
- Mong đợi: hoàn tất hỗ trợ cập nhật task, ticket và bộ đếm ngay. Khi mở lại trang, đóng ticket thành công và hiển thị Đã đóng.

### QA-08 — P2: workspace không sử dụng được trên mobile

- Tái hiện: mở bất kỳ workspace tại viewport 390×844.
- Thực tế đo trên admin: sidebar cố định 248 px; main chỉ khoảng 136.8 px; document rộng 492 px. Tiêu đề xuống gần từng từ, form và bảng bị cắt/tràn.
- Nguyên nhân: `WorkspaceSidebar.tsx` dùng `w-[248px]`; `WorkspaceLayout.tsx` dùng `pl-[248px]`; `WorkspaceTopbar.tsx` dùng `left-[248px]`, không có breakpoint/drawer menu.
- Mong đợi: sidebar thu gọn thành menu trên mobile, main chiếm chiều rộng màn hình; bảng có vùng cuộn riêng.
- Bằng chứng: [workspace-mobile-390.png](evidence/workspace-mobile-390.png).

### QA-09 — P2: nghiệp vụ cơ sở không ghi nhật ký thực tế

- Tái hiện: tạo/sửa kho, phân công task #10, hoàn tất check-in/check-out/kiểm tra rồi vào admin → Nhật ký hoạt động.
- Thực tế: có log mới của tạo cơ sở/chính sách/phụ phí/sửa user; không có log tương ứng các thao tác vận hành vừa làm. Log TASK_ASSIGNED/UNIT_STATUS_CHANGED đang thấy chỉ là seed cũ.
- Nguyên nhân: `facilityUnitsApi.ts`, `rentalOpsApi.ts`, `supportTicketsApi.ts` không gọi `appendActivityLog()` trong các mutation.
- Mong đợi: log actor, hành động, đối tượng, thời gian và kết quả cho các thao tác quan trọng.

### QA-10 — P2: URL tháng thuê quá lớn làm trắng toàn trang (FE1 có sẵn)

- Tái hiện: mở http://localhost:5173/reservation/new?months=1000000000.
- Thực tế: DOM rỗng, console `RangeError: Invalid time value`, stack `addMonths → buildRentalRange → ReservationPage`.
- Nguyên nhân: `ReservationPage.tsx` chỉ kiểm tra finite và >0, không giới hạn tháng; `rentalRange.addMonths()` gọi `toISOString()` trên Date vượt phạm vi. FacilityListPage có cùng kiểu validation.
- Mong đợi: chấp nhận thời hạn hợp lệ (UI cung cấp 1/3/6/12 tháng), từ chối hoặc chuẩn hóa tham số ngoài phạm vi; không làm crash app.

### QA-11 — P2: ngày lịch không tồn tại vẫn được coi hợp lệ (FE1 có sẵn)

- Tái hiện tự động: `isValidIsoDate('2026-02-31')` trả `true`.
- Nguyên nhân: `new Date()` tự normalize ngày vượt cuối tháng; kiểm tra parse được chưa đảm bảo cùng ngày đầu vào.
- Mong đợi: ngày 31/02 bị từ chối; kiểm tra ngày/tháng/năm bằng round-trip. Test hồi quy #5 FAIL.

### QA-12 — P2: ngày mặc định sai trước 07:00 giờ Việt Nam (FE1 có sẵn)

- Tái hiện tự động: đặt thời gian `2026-10-10T00:30:00+07:00`; gọi `todayIso()`.
- Thực tế: `2026-10-09`; mong đợi `2026-10-10`.
- Nguyên nhân: `rentalRange.ts` lấy ngày UTC qua `toISOString().slice(0,10)` cho ngày thuê tại Việt Nam.
- Hướng sửa: dùng ngày local hoặc timezone nghiệp vụ Asia/Ho_Chi_Minh nhất quán. Test hồi quy #6 FAIL.

## Giới hạn kiến trúc và test

- Workspace truy cập trực tiếp mà không đăng nhập FE1; `SessionProvider` luôn mặc định FACILITY_MANAGER và cho đổi role demo. Đây là cơ chế demo được ghi rõ trong giao diện, không phải bằng chứng có thể vượt bảo mật backend thật. Trước tích hợp/production phải nối AuthProvider và quyền backend; tài khoản ADMIN/STAFF đăng nhập FE1 hiện không quyết định session FE2.
- Refresh tại `/admin/security` sau đổi ADMIN làm role quay về FACILITY_MANAGER và hiển thị không có quyền. Các thay đổi mock trong bộ nhớ mất khi reload hoặc mở tab mới; đây là giới hạn demo, không phải dữ liệu đã lưu database.
- E2E hiện chỉ có 4 case, bao gồm menu/đổi role và mở/nhận việc bàn giao; case paid chưa hoàn tất check-in. Chưa có E2E toàn bộ CRUD, invoice, payment hoặc responsive.
- Lint warning và bundle lớn là vấn đề chất lượng/hiệu năng cần theo dõi, không được tính là lỗi nghiệp vụ trong 12 lỗi trên.
- Chưa kiểm thử mọi tổ hợp bộ lọc, trạng thái, trình duyệt, CSV tải xuống và mọi nhánh CRUD. Báo cáo là kiểm thử các trang và luồng chính có thể chạy tại commit này, không cam kết đã tìm hết lỗi.
- Đã bấm Xuất CSV nhưng công cụ trình duyệt không nhận được sự kiện download trong 10 giây. Chưa có bằng chứng phân biệt lỗi ứng dụng với giới hạn công cụ/trình duyệt, nên ghi UNVERIFIED và không đưa vào 12 lỗi xác nhận.

## Chạy lại

Tại `tranxuankhoa/frontend`:

```powershell
rtk npm run dev -- --host 127.0.0.1 --strictPort
rtk npm run build
rtk npm run lint
rtk npm test
rtk npm run e2e
rtk npx vitest run --config qa/vitest.config.ts
```

Ưu tiên sửa QA-01/02/03/04 trước, sau đó đồng bộ UI QA-05/06/07 và mobile. Giữ test hồi quy đang đỏ để kiểm chứng bản sửa, đồng thời chỉnh kỳ vọng nghiệp vụ sai trong bộ test kiểm tra kho cũ.
