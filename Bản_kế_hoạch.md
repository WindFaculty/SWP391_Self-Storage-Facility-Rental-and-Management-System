# Kế hoạch triển khai SWP391

Kiến trúc chuẩn: [kiến_trúc.md](kiến_trúc.md). Mọi công việc phải giữ nguyên sáu module: `account`, `facility`, `rental`, `payment`, `support`, `management`.

## Phân công

| Nhóm | Phạm vi |
| --- | --- |
| Backend foundation | Account, JWT, security, Facility, UnitType, StorageUnit |
| Backend rental | Reservation, contract, handover, check-in/out, renewal, overdue |
| Backend business | Charge, Payment, SupportTicket, RentalPolicy, FeePolicy, report query |
| Customer frontend | Auth, facility browse, reservation, contracts, payments, support |
| Internal frontend | Staff, manager, business manager, admin routes và dashboard |

## Thứ tự thực hiện

1. Khóa ERD, enums, API contract, migration và role names.
2. Hoàn thành Account và Facility làm dependency cho các module còn lại.
3. Xây Rental, sau đó Payment và Support.
4. Thêm Management policy/report sau khi dữ liệu nghiệp vụ đã ổn định.
5. Tích hợp frontend theo API contract; không để page chứa business logic.
6. Chạy bảy business flow end-to-end trước khi demo.

## Quy tắc merge

- Mỗi thay đổi database phải đi kèm migration Flyway mới.
- Service là transaction boundary; controller không gọi repository trực tiếp.
- Role chỉ dùng: `CUSTOMER`, `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`.
- Facility Staff và Facility Manager chỉ thao tác trong `assignedFacilityId` của mình.
- Mỗi PR phải nêu API/migration đã thay đổi và kết quả test/build.

## Tiêu chí hoàn thành

```text
[ ] Business rule và validation hoàn chỉnh
[ ] Authorization và facility scope được kiểm tra
[ ] Migration chạy được
[ ] Unit/API test phù hợp
[ ] Frontend npm run build thành công
[ ] Không commit secret
[ ] API và README được cập nhật
```
