# Chuẩn bị tích hợp backend sau khi bỏ mock

Ứng dụng không còn dữ liệu nghiệp vụ giả, store trong bộ nhớ, độ trễ giả lập hoặc tài khoản/vai trò demo. Chỉ dữ liệu phản hồi từ HTTP được dùng để hiển thị và xác nhận thao tác thành công. Fixture và HTTP stub trong test được giữ riêng để kiểm tra code mà không cần server.

**Backend chưa merge, chưa xác nhận endpoint/DTO.** Các đường dẫn FE2 bên dưới là dự kiến, không phải hợp đồng backend đã tồn tại. Sau merge, đối chiếu controller/OpenAPI và sửa các adapter trong `frontend/src/features/*/api/`. Không cần đưa dữ liệu mock trở lại.

## Kết nối và xác thực

- API client chung: `frontend/src/api/client.ts`.
- Base URL lấy từ `VITE_API_BASE_URL`; mặc định `/api/v1`.
- Dev proxy chuyển `/api/v1` tới `http://localhost:8088`.
- Adapter FE2: `frontend/src/api/workspaceClient.ts`; response JSON dự kiến `{ "data": ... }`, giống FE1. Response của mutation không trả dữ liệu (tạo/sửa/trạng thái cơ sở) có thể là 204.
- Token được gửi qua `Authorization: Bearer ...`; lỗi HTTP truyền về UI; không fallback sang mock.
- `SessionProvider` dùng `useAuth()`, không nhận `initialRole` và không có `setRole`. Workspace chưa đăng nhập chuyển `/auth`, tài khoản CUSTOMER chuyển `/forbidden`.
- Auth response `/auth/login`, `/auth/register`, `/auth/me` cần trả user có `id`, `email`, `fullName`, `role`; tài khoản cơ sở cần `facilityId` dạng number hoặc null. Không có phân công thì không tự chọn một cơ sở khác.
- Backend phải kiểm soát quyền/cơ sở ở mọi endpoint và lấy actor/IP từ phiên/request, không tin actor do client tự khai.

## Endpoint dự kiến của FE2

Đường dẫn trong bảng được ghép với base URL. GET list truyền các filter hiện có bằng query, bỏ giá trị null/undefined/rỗng.

| Adapter | Method/path | `data` dự kiến |
|---|---|---|
| facilityUnitsApi | GET `/ops/facilities` | `Facility[]` được backend giới hạn theo quyền |
| facilityUnitsApi | GET `/ops/unit-types` | `UnitType[]` |
| facilityUnitsApi | GET `/ops/units` | `{ items: StorageUnit[], summary: UnitSummary }` |
| facilityUnitsApi | POST `/ops/units`, PUT `/ops/units/:id`, PATCH `/ops/units/:id/status` | `StorageUnit` |
| rentalOpsApi | GET `/ops/rentals` | `{ items: Rental[], summary: RentalSummary }` |
| rentalOpsApi | GET `/ops/rentals/:id` | `Rental` |
| rentalOpsApi | GET `/ops/tasks` | `{ items: StaffTask[], summary: TaskSummary }` |
| rentalOpsApi | GET `/ops/staff?facilityId=...` | `StaffMember[]` |
| rentalOpsApi | POST `/ops/tasks` | `StaffTask` |
| rentalOpsApi | POST `/ops/tasks/:id/start`, `/complete` | `StaffTask` |
| rentalOpsApi | POST `/ops/tasks/:id/handover`, `/return`, `/inspection` | `{ task: StaffTask, rental: Rental }` |
| supportTicketsApi | GET `/ops/tickets` | `{ items: SupportTicket[], activeCount: number }` |
| supportTicketsApi | GET `/ops/tickets/:id` | `SupportTicket` |
| supportTicketsApi | POST `/ops/tickets/:id/assign` | `{ ticket: SupportTicket, task: StaffTask }` |
| supportTicketsApi | POST `/ops/tickets/:id/close` | `SupportTicket` |
| dashboardApi | GET `/ops/facilities/:id/dashboard` | `FacilityDashboard` |
| managementApi | GET `/ops/facilities/:id/revenue?months=6` | `RevenuePoint[]` |
| managementApi | GET/PUT `/management/policy` | `BusinessPolicy` |
| managementApi | GET `/management/fee-types`, PUT `/management/fee-types/:id` | `FeeType[]` / `FeeType` |
| managementApi | GET `/management/facilities` | `FacilityOverview[]` |
| managementApi | POST `/management/facilities`, PUT `/management/facilities/:id`, PATCH `/management/facilities/:id/status` | không bắt buộc body |
| managementApi | GET `/management/reports` | `ReportSummary` |
| adminApi | GET `/admin/users` | `{ items: AdminUser[], summary: UserSummary }` |
| adminApi | POST `/admin/users`, PUT `/admin/users/:id`, PATCH `/admin/users/:id/status` | `AdminUser` |
| adminApi | GET `/admin/activity-logs` | `ActivityLog[]` |

Kiểu DTO FE2 nằm trong `facility/types.ts`, `management/types.ts`, `admin/types.ts` và `dashboardApi.ts`. Public catalog FE1 đang dùng ID dạng string, còn FE2 dùng number: cần thống nhất hoặc thêm chuyển đổi ở adapter khi có DTO backend thật. Nếu backend phân trang, cũng cần khớp page/size/total thay vì giả định API trả toàn bộ danh sách.

## Quy tắc cần backend xử lý

- Check-in/check-out/inspection phải cập nhật task, rental và trạng thái kho cùng transaction. Kiểm tra định kỳ không được giải phóng kho đang có hợp đồng hiệu lực.
- Bảo vệ quản trị viên hoạt động cuối cùng khi đổi role hoặc vô hiệu hóa.
- Nhận/phân công task/ticket kiểm tra nhân viên, cơ sở và trạng thái thực.
- Chính sách, báo cáo và nhật ký lấy từ database; ghi log server cho mọi thao tác quan trọng.

## Kiểm chứng sau thay đổi

`npm run build` đạt; `npm test` 80/80 đạt; `npm run e2e` 9/9 đạt (guard đăng nhập của tám route workspace và validation login). Lint không có error, còn warning React hiện có. Đây là kiểm tra frontend/HTTP adapter với fixture trong test, chưa chứng minh backend thật tương thích.

Báo cáo `docs/qa/b3f63d4/REPORT.md` mô tả trạng thái lịch sử trước khi xóa mock. Bốn case QA phụ thuộc store đã bỏ được thay bằng test HTTP trong suite chính; `frontend/qa/` chỉ giữ hai case lỗi ngày FE1 chưa thuộc phạm vi sửa lần này.
