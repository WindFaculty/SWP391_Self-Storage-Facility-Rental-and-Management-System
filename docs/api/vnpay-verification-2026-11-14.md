# Kiểm chứng VNPay Sandbox local — 14/11/2026

Thanh toán Sandbox đã hoạt động từ giao diện đến cập nhật trạng thái trên backend. Luồng được thao tác bằng Computer Use trên Microsoft Edge và kiểm tra lại qua API đang chạy ở `http://localhost:5173/api/v1`.

## Giao dịch đặt chỗ còn hiệu lực

Thời điểm đối chiếu: **00:14 ngày 14/11/2026, UTC+7**.

| Nội dung | Kết quả đã quan sát |
| --- | --- |
| Mã tham chiếu | `VNP-19-CE8792D27F9E` |
| Hóa đơn | `19` |
| Đơn thuê | `16` |
| Số tiền | `747.500 VND` |
| Giao dịch trên backend | `SUCCESS` |
| Hóa đơn trên backend | `PAID` |
| Đơn thuê trên backend | `RESERVED` |
| Giao diện `/billing` | Hóa đơn #19 nằm trong tab **Đã thanh toán** |

Đặt chỗ mới được tạo qua API của ứng dụng với trạng thái ban đầu `PENDING_PAYMENT`, ngày thuê 16/11–16/12/2026. Sau đó chọn **Thanh toán qua VNPay** trên giao diện, chọn NCB và dùng thẻ/OTP test công khai trong [demo chính thức](https://sandbox.vnpayment.vn/apis/vnpay-demo/#link-demo). Người dùng đã xác nhận cho phép chấp nhận điều khoản Sandbox; những lần kiểm thử sau trong cùng phiên không hiện lại hộp điều khoản. Không sử dụng tiền thật.

Bản đối chiếu API local: [vnpay-settlement-19.json](../../.run/vnpay-settlement-19.json). File thuộc thư mục `.run` được Git bỏ qua; các giá trị quan trọng đã được ghi lại trong bảng trên để báo cáo vẫn đọc được khi chia sẻ mã nguồn.

## Thay đổi đã thực hiện

- `run.ps1` nạp mã terminal và khóa ký từ biến môi trường hoặc hai file local `Vnpay_tmn_code.key` / `Vnpay_secret.key`. Biến môi trường được ưu tiên; cả hai file được Git bỏ qua. Khóa sẵn có đã được đối chiếu với thông tin VNPay cấp, không chép vào mã nguồn hay báo cáo.
- Bổ sung cấu hình mẫu và hướng dẫn khởi động, callback, thẻ test trong `vnpay-integration.md`.
- `CustomerBillingService` chặn hóa đơn không còn chờ trả tiền và đơn giữ chỗ đã hết hạn; thời hạn VNPay không vượt quá hạn giữ chỗ còn lại. Gia hạn hợp đồng vẫn dùng luồng riêng.
- Trang kết quả dùng thông báo xác nhận từ hệ thống, phù hợp cả IPN và chế độ local xác nhận qua return có chữ ký.

## Kiểm tra đã chạy

- 29/29 bài kiểm tra đạt: `CustomerBillingServiceTest`, `VnPayServiceTest`, `VnPayIpnServiceTest`, `VnPayControllerTest`, `PaymentServiceTest`.
- Frontend: `npm run build` thành công. Vite còn cảnh báo kích thước bundle; không có lỗi biên dịch.
- Launcher: cú pháp PowerShell hợp lệ; đã kiểm tra nạp và trim file, ưu tiên biến môi trường, từ chối terminal sai định dạng và khóa placeholder.
- API thực tế: hóa đơn #3 gắn với đơn hết hạn bị chặn `400`; hóa đơn #4 đã trả tiền bị chặn `400` khi yêu cầu tạo giao dịch mới.
- `git diff --check` không phát hiện lỗi khoảng trắng.

## Dữ liệu demo cũ và giới hạn

Lần kiểm thử đầu tiên dùng hóa đơn demo #4 (`VNP-4-6633A173262C`) cũng thanh toán Sandbox thành công: giao dịch `SUCCESS`, hóa đơn `PAID`. Tuy nhiên đơn thuê #4 đã là `EXPIRED` từ trước và không được khôi phục. Phát hiện này dẫn tới việc bổ sung chặn checkout hết hạn và kiểm thử lại bằng đặt chỗ mới ở bảng trên. Không sửa trực tiếp trạng thái đơn cũ để tạo kết quả thành công.

Local đang dùng `VNPAY_CONFIRM_ON_RETURN=true`: backend xác minh return rồi chuyển qua các kiểm tra của `VnPayIpnService`. **Chưa kiểm chứng VNPay gọi IPN qua một địa chỉ HTTPS công khai**, cũng chưa kiểm thử thanh toán production. Khi triển khai, cấu hình IPN theo [tài liệu PAY của VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), tắt xác nhận trên return và kiểm thử lại server-to-server. Bộ E2E Testcontainers/Docker không được chạy trong lần này; kết quả 29 bài ở trên là các bài kiểm tra thanh toán đã nêu.
