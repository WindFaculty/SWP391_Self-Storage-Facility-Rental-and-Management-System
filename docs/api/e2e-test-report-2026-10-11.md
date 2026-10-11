# Báo cáo kiểm thử API — 11/10/2026

## Kết quả

Có **2 lỗi nghiệp vụ đã tái hiện**. Bộ test ban đầu: **74 pass, 0 fail, 0 skip**. Sau khi bổ sung 3 ca, tổng các ca đã chạy là **77: 75 pass, 2 fail, 0 error, 0 skip** (tổng hợp lần chạy toàn bộ và lần chạy lại CustomerFlowE2ETests).

Ba suite hành trình E2E có 14 ca: 12 pass, 2 fail. Các test còn lại gồm integration/API, schema và unit test; không phải cả 77 ca đều là E2E qua mạng.

## Môi trường và cách chạy

- Windows, Java 25.0.4.1, Spring Boot 4.1.1.
- MySQL 8.4 thật qua Testcontainers, Flyway chạy trên database kiểm thử riêng.
- Profile `test`; customer suite chạy embedded server trên cổng ngẫu nhiên.
- Test HTTP dùng context path `/api/v1`, Java HttpClient và callback VNPay ký HMAC-SHA512 với khóa test.
- Không sử dụng tài khoản hay dữ liệu production, không gửi tiền tới VNPay.

Chạy trong thư mục `backend`:

```powershell
rtk proxy .\mvnw.cmd test
rtk proxy .\mvnw.cmd '-Dtest=CustomerFlowE2ETests' test
```

Lần chạy toàn bộ đầu tiên thành công. Lần chạy customer suite sau khi thêm test có 6 ca, 4 pass và 2 fail đúng tại hai lỗi dưới đây. Các test fail được giữ để tái hiện lỗi; chưa sửa code nghiệp vụ.

## Luồng đã chạy

| Nhóm | Nội dung | Kết quả |
|---|---|---|
| Xác thực | Đăng ký, trùng email, sai mật khẩu, đăng nhập, `/auth/me`, refresh, logout | Pass |
| Catalog | Danh sách/chi tiết cơ sở, loại kho, kiểm tra số kho trống | Pass với cơ sở active |
| Đặt thuê | Giữ chỗ, hóa đơn, hai khách đặt chồng thời gian nhận kho khác nhau, hủy giữ chỗ và giải phóng kho | Pass |
| Thanh toán | Tạo URL VNPay, theo dõi attempt, xác nhận thanh toán, hóa đơn PAID và rental RESERVED | Pass |
| HTTP và IPN | HTTP thật: đăng ký → giữ chỗ → URL thanh toán → callback ký hợp lệ → đọc rental/invoice/attempt; callback lặp trả RspCode 02 | Pass |
| Vận hành | Tạo/sửa kho, trạng thái kho, staff/task, bắt đầu task, bàn giao, gia hạn và thanh toán, yêu cầu trả kho, nhận kho, kiểm tra và giải phóng kho | Pass |
| Hỗ trợ | Khách tạo/xem ticket; nhân viên xử lý ticket; luồng workspace | Pass |
| Quản lý kinh doanh | Chính sách, phí, tạo/sửa/vô hiệu hóa cơ sở, báo cáo theo kỳ/cơ sở | Pass |
| Quản trị | Tìm/lọc/tạo/sửa user, đổi trạng thái, kiểm tra dữ liệu, activity/audit logs | Pass |
| Phân quyền | Chặn sai role, chặn khác cơ sở, chặn truy cập dữ liệu thuê của khách khác | Pass cho các ca hiện có |
| Thanh toán phụ trợ | Chữ ký giả, return callback, unit test số tiền/chữ ký/IPN/refund/invoice | Pass; một phần là unit test |
| Database | Migration từ database rỗng, unique index một thanh toán thành công trên hóa đơn, seed local | Pass |
| Cơ sở INACTIVE | Tạo giữ chỗ qua API trực tiếp | **Fail** |
| Giữ chỗ hết hạn | Tính lại availability sau thời hạn giữ chỗ | **Fail** |

## Lỗi 1 — Cơ sở INACTIVE vẫn nhận đặt thuê

Mức độ: cao. Test: `inactiveFacilityRejectsNewCustomerHold`.

1. Tạo cơ sở active có loại kho và kho available; đăng ký khách hàng.
2. Đổi `facilities.status` thành `INACTIVE` trong database test.
3. Gửi `POST /api/v1/rentals/holds` với `facilityId`, `unitTypeId`, ngày bắt đầu ngày mai và `rentalMonths: 1`.
4. Mong đợi từ chối với HTTP 4xx.
5. Thực tế: **HTTP 200**, tạo rental `PENDING_PAYMENT` và hóa đơn `PENDING`.

Nguyên nhân trong code: `RentalService.createHold` lấy cơ sở theo ID nhưng không kiểm tra trạng thái ACTIVE trước khi gán kho/tạo hóa đơn. Danh sách cơ sở công khai đã lọc ACTIVE trong `FacilityService`, nhưng khách vẫn gọi trực tiếp API với ID cũ.

Đề xuất: kiểm tra trạng thái cơ sở trong transaction tạo giữ chỗ; xác định rõ cách xử lý đơn đã tồn tại khi cơ sở bị vô hiệu hóa.

## Lỗi 2 — Giữ chỗ hết hạn vẫn chặn kho

Mức độ: cao. Test: `expiredHoldStopsBlockingAvailability`.

1. Tạo cơ sở có hai kho available cùng loại.
2. Khách tạo giữ chỗ một tháng; availability giảm từ 2 xuống 1.
3. Đặt `rentals.payment_expires_at` về một giờ trước để mô phỏng hết hạn mà không chờ 15 phút.
4. Gọi `GET /api/v1/availability?facilityId=...&startDate=...&endDate=...` trong khoảng thời gian của đơn.
5. Mong đợi `availableCount: 2`.
6. Thực tế: **`availableCount: 1`**; giữ chỗ đã hết hạn tiếp tục chiếm suất kho.

Nguyên nhân trong code: availability và truy vấn kho trống dùng trạng thái `PENDING_PAYMENT` làm điều kiện chặn, không xét thời hạn thanh toán. Không tìm thấy cơ chế tự chuyển các hold hết hạn trong code backend hiện tại.

Đề xuất: bổ sung cơ chế expire rental/invoice và loại hold hết hạn khỏi availability/assignUnit một cách nhất quán; kiểm tra thêm cạnh tranh đặt kho và callback thanh toán tới muộn.

## Phạm vi và giới hạn

Đã chạy các hành trình nghiệp vụ chính trong ba suite E2E và toàn bộ bộ test backend hiện có. Phần lớn endpoint test dùng MockMvc với service/repository/database thật; chỉ ca `realHttpCheckoutAndSignedIpnConfirmRentalIdempotently` chạy xuyên HTTP thật. Payment trong các hành trình cũ được xác nhận bằng gọi service trực tiếp; ca HTTP bổ sung đi qua endpoint IPN thật.

Chưa xác nhận bao phủ 100% mọi endpoint/nhánh dữ liệu. Chưa chạy UI trình duyệt, VNPay sandbox bên ngoài, tải cao, cuộc đua nhiều request đồng thời, hoặc E2E hoàn tiền tới cổng thanh toán. Các kết quả pass không chứng minh các phạm vi này hoạt động đúng.

## Bằng chứng

- Test bổ sung: `backend/src/test/java/com/storage/e2e/CustomerFlowE2ETests.java`.
- Báo cáo customer suite: `backend/target/surefire-reports/com.storage.e2e.CustomerFlowE2ETests.txt` và XML cùng tên.
- Log lần chạy bổ sung: `backend/target/customer-e2e-run.log`.
- Các suite còn lại: `backend/target/surefire-reports/`.

Các file trong `target` có thể bị ghi đè ở lần chạy tiếp theo; tài liệu này lưu kết quả của lần kiểm thử ngày 11/10/2026.
