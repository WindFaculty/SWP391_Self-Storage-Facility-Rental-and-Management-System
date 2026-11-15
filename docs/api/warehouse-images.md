# Bộ ảnh cơ sở và từng kho

## Sử dụng

- Quản lý cơ sở: **Quản lý kho lưu trữ → Thêm kho mới / Sửa thông tin kho** để quản lý ảnh từng kho; **Ảnh cơ sở** để sửa bộ ảnh cơ sở được phân công.
- Quản lý kinh doanh và admin: **Mạng lưới cơ sở → Thêm cơ sở mới / Sửa** để lưu thông tin và bộ ảnh cùng nhau.
- Khách hàng: trang chi tiết cơ sở có bộ ảnh cơ sở và mục **Ảnh từng kho**, lọc theo loại kho và phân trang. Việc đặt chỗ vẫn theo loại kho.

Mỗi đối tượng có tối đa 10 ảnh JPEG/PNG, tối đa 5 MiB và 20 megapixel mỗi ảnh. Ảnh không bắt buộc. Có thể xem trước, thay, xóa và đưa một ảnh lên làm đại diện. Nhấn Hủy không ghi thay đổi.

## Hợp đồng API

Các đường dẫn dưới đây có tiền tố `/api/v1`.

| Phương thức | Đường dẫn | Quyền và tác dụng |
| --- | --- | --- |
| POST / PUT | `/management/facilities` / `/management/facilities/{id}` | BUSINESS_MANAGER, ADMIN: tạo/sửa cơ sở và bộ ảnh |
| POST / PUT | `/ops/units` / `/ops/units/{id}` | Quyền sửa kho hiện có, kiểm tra cơ sở sở hữu: tạo/sửa kho và bộ ảnh |
| PUT | `/ops/facilities/{id}/images` | FACILITY_MANAGER tại cơ sở được giao; BUSINESS_MANAGER/ADMIN toàn hệ thống; chỉ sửa ảnh |
| GET | `/facilities/{id}/units?page=0&size=12&unitTypeId=…` | Công khai, cơ sở ACTIVE; `size` từ 1 đến 48 |
| GET | `/media/{imageId}` | Công khai, trả tệp JPEG/PNG đang được tham chiếu trong DB |

Request lưu bộ ảnh dùng `multipart/form-data`:

- Part `data`: JSON với `Content-Type: application/json`. Form tạo/sửa chứa các trường thông tin hiện có cùng `images`; endpoint chỉ sửa ảnh chỉ cần `images`.
- Part `files`: các tệp mới, có thể lặp tên part. Không gửi part này khi chỉ giữ/xóa/đổi đại diện.
- `images` là danh sách theo thứ tự: `{ "id": "ID ảnh hiện có" }` hoặc `{ "fileIndex": 0 }`. `fileIndex` bắt đầu từ 0 theo thứ tự các part `files`. Mỗi tham chiếu chỉ được xuất hiện một lần; không được tham chiếu ảnh của đối tượng khác hoặc gửi tệp không được sử dụng.
- Ảnh đầu là đại diện. Bỏ ID khỏi danh sách để xóa ảnh; gửi `images: []` để xóa hết.

Ví dụ part `data` của form kho:

```json
{
  "facilityId": 1,
  "unitTypeId": 2,
  "unitCode": "LK-01",
  "locationLabel": "Tầng 1",
  "monthlyPrice": 650000,
  "images": [{ "fileIndex": 0 }, { "id": "existing-image-uuid" }]
}
```

Response dùng envelope API hiện có. Đối tượng cơ sở/kho bổ sung `images: [{ id, url, sortOrder }]`; `imageUrl` là URL ảnh đầu, không có giá trị khi bộ ảnh trống. Endpoint công khai danh sách kho trả `content`, `page`, `size`, `totalElements`, `totalPages`, không trả khách thuê, trạng thái vận hành hay ghi chú nội bộ.

Endpoint tạo/sửa JSON cũ được giữ lại. Với cơ sở, không gửi `imageUrl` thì giữ bộ ảnh; gửi URL sẽ thay ảnh đầu; gửi chuỗi rỗng sẽ bỏ ảnh đầu và giữ các ảnh còn lại. Các ảnh loại kho hiện có không thay đổi.

## Lưu trữ và triển khai

- Migration V012 tạo `warehouse_images`, khóa ngoại tới đúng một cơ sở hoặc kho, và nhập các URL cơ sở đã có thành ảnh đầu. Không tải lại hay xóa các tệp ảnh cũ trong frontend.
- `MEDIA_STORAGE_DIR` mặc định `./uploads`, tính từ thư mục chạy backend. Nếu khởi động trong thư mục `backend`, ảnh nằm tại `backend/uploads`. Các thư mục này được Git bỏ qua.
- `MEDIA_PUBLIC_BASE_URL` mặc định `/api/v1/media` khi chạy qua Vite proxy. Khi frontend và backend khác host, đặt URL tuyệt đối, ví dụ `https://api.example.com/api/v1/media`.
- Docker staging dùng volume `media-data:/app/uploads`; thư mục trong image thuộc tài khoản chạy ứng dụng. Compose cấu hình URL công khai từ `API_HOST`.
- Sao lưu DB và volume/thư mục ảnh cùng nhau. Không xóa volume khi tạo lại container.
- Request tối đa 55 MiB. Backend kiểm tra nội dung ảnh, loại MIME, kích thước tệp và số điểm ảnh. Frontend giữ CSRF/cookie hoặc Bearer auth như các API hiện tại và để trình duyệt tự đặt multipart boundary.
- Khi giao dịch rollback, tệp mới được xóa và bộ ảnh cũ giữ nguyên. Tệp bị thay/xóa chỉ được dọn sau commit. Tác vụ định kỳ dọn các tệp do ứng dụng tạo, không còn được DB tham chiếu và đã quá 24 giờ.

## Kiểm thử

Kết quả local ngày 15/11/2026: frontend 106/106 test đạt, TypeScript/build/lint đạt (còn các cảnh báo có sẵn); trình duyệt với backend thật 2/2 luồng ảnh đạt; 12/12 test về ảnh, schema và seed đạt. Toàn bộ backend chạy 109 test, 108 đạt và 1 lỗi bàn giao được mô tả bên dưới. Backend đóng gói JAR thành công khi chạy `package -DskipTests`; đây là kiểm tra đóng gói riêng, không thay thế kết quả test. Compose staging qua kiểm tra cấu hình mà chưa triển khai.

Các bài kiểm thử mới:

- `LocalImageStorageTest`: nội dung ảnh thật, MIME sai, tệp rỗng/quá dung lượng/quá 20 megapixel, đường dẫn, dọn tệp mồ côi và mở lại thư mục ảnh.
- `WarehouseMediaE2ETests`: MySQL thật qua Testcontainers; tạo/sửa/xóa/đổi đại diện, catalog công khai, phân quyền, chống gắn nhầm ảnh, tương thích JSON và rollback sau khi ghi tệp.
- `LocalSeedTests`: seed 25 kho hiện có và không khôi phục ảnh đã bị quản lý xóa khi seed được chạy lại.
- Frontend: multipart đúng thứ tự, CSRF/Bearer, giới hạn tệp, thao tác picker, thu hồi URL xem trước và không khôi phục ảnh demo sau khi xóa hết.

Chạy trình duyệt với backend có local demo seed trên database thử nghiệm riêng:

```powershell
$env:MEDIA_E2E = '1'
npx playwright test e2e/warehouse-images.spec.ts
```

Bộ test trình duyệt tạo dữ liệu thử và sửa ảnh cơ sở demo; chỉ chạy trên DB thử nghiệm. Test bao gồm quản lý kho, admin, khách hàng, ảnh chụp desktop/mobile và tải lại trang. Kiểm tra restart riêng đã đối chiếu SHA-256 tệp trước/sau khi khởi động lại backend, đồng thời xác nhận bộ ảnh cơ sở đã xóa vẫn trống.

Giới hạn xác minh: chưa triển khai lên staging hoặc kiểm chứng việc tạo lại container Docker staging. Toàn bộ test backend còn lỗi sẵn có `FacilityOpsE2ETests.unassignedStaffCannotConfirmAnotherStaffMembersHandover`: mong đợi HTTP 403 nhưng nhận 200. `OpsService.requireTaskAccess` hiện chỉ kiểm tra task có hợp đồng, chưa kiểm tra người được phân công; phương thức này giống bản HEAD trước thay đổi ảnh và được giữ nguyên trong phạm vi này.
