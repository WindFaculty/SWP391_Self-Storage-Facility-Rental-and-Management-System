Tóm tắt phân công 5 người như sau:

* **Hồ Xuân Thanh — BE1: Backend Platform & Facility**

  * Xây Authentication, JWT, Spring Security.
  * Quản lý User, Role, Permission, RBAC.
  * Quản lý Facility, Floor, Zone.
  * Quản lý Unit Type, Storage Unit, trạng thái kho.
  * Quản lý nhân viên theo Facility.
  * Kiểm soát Facility Scope và quyền truy cập.
  * Quản lý Audit Log, Login History.
  * Hỗ trợ locking/status của Storage Unit trong reservation, check-in, return.
  * Phụ trách phần System Admin backend.
  * Trọng tâm: **ai được làm gì, tại facility nào, và storage unit đang ở trạng thái nào.**

* **Bùi Văn Tình — BE2: Backend Reservation & Rental**

  * Xây Availability Service.
  * Xử lý Reservation và Reservation Item.
  * Chống đặt trùng/đặt vượt số lượng unit.
  * Xử lý Check-in Appointment.
  * Assign Storage Unit cho khách.
  * Xử lý Handover.
  * Tạo và quản lý Rental Contract.
  * Quản lý Contract Unit.
  * Xử lý đổi storage unit.
  * Xử lý Return Request và Unit Inspection.
  * Quản lý toàn bộ lifecycle của thuê kho.
  * Đảm bảo transaction và rollback đúng.
  * Trọng tâm: **từ lúc khách đặt kho → check-in → thuê → trả kho.**

* **Lê Trí Thiện — BE3: Backend Business, Billing & Reporting**

  * Xây Pricing và Facility-specific pricing.
  * Quản lý Deposit Policy, Fee Policy, Discount Policy, Overdue Policy.
  * Tính tiền thuê, tiền cọc, giảm giá, phí phát sinh.
  * Quản lý Charge, Payment, Payment Allocation.
  * Xử lý payment success/fail và chống duplicate payment.
  * Xử lý Renewal.
  * Tính Grace Period và Overdue Fee.
  * Xử lý Support Request/Ticket.
  * Xây Revenue, Occupancy, Facility Performance report.
  * Hỗ trợ notification/email/payment abstraction.
  * Trọng tâm: **giá bao nhiêu, khách phải trả bao nhiêu, đã trả chưa, có quá hạn không và doanh thu thế nào.**

* **Bùi Tuấn Thanh — FE1: Customer Frontend**

  * Login/Register phía khách hàng.
  * Customer Dashboard.
  * Danh sách và chi tiết Facility.
  * Hiển thị Unit Type, kích thước, tính năng, giá.
  * Xây Reservation Wizard.
  * Hiển thị Price Breakdown.
  * Giao diện Payment.
  * My Reservations và Reservation Detail.
  * My Storage Units.
  * Rental Contract và Payment History.
  * Renewal.
  * Request Return/Change Unit.
  * Support Request và theo dõi ticket.
  * Profile và lịch sử giao dịch.
  * Xử lý loading, validation, empty state, error state, responsive.
  * Trọng tâm: **toàn bộ hành trình của Customer từ tìm kho → đặt → thanh toán → thuê → gia hạn/trả kho.**

* **Trần Xuân Khoa — FE2: Internal Frontend**

  * Xây giao diện cho Staff, Facility Manager, Business Manager và System Admin.
  * Internal Dashboard, Sidebar, Header, Role-based navigation.
  * Facility Management.
  * Floor/Zone/Unit Type/Storage Unit Management.
  * Staff Assignment.
  * Reservation Management.
  * Assign Unit.
  * Check-in và Handover UI.
  * Active Rental và Return Queue.
  * Unit Inspection.
  * Pricing và Policy Management.
  * Expiring/Overdue Rental Management.
  * Support Queue và Ticket Assignment.
  * Revenue/Occupancy/Facility Performance Dashboard.
  * User, Role, Facility Assignment và Audit Log.
  * Kiểm soát Permission UI, DataTable, filter, pagination.
  * Trọng tâm: **toàn bộ giao diện vận hành nội bộ của hệ thống.**

Có thể nhớ ngắn gọn theo sơ đồ:

```text
Hồ Xuân Thanh — BE1
→ Auth + User + Facility + Inventory + Security

Bùi Văn Tình — BE2
→ Reservation + Check-in + Rental + Return

Lê Trí Thiện — BE3
→ Pricing + Payment + Renewal + Overdue + Report

Bùi Tuấn Thanh — FE1
→ Toàn bộ giao diện Customer

Trần Xuân Khoa — FE2
→ Toàn bộ giao diện Staff + Manager + Admin
```

Cách chia này có boundary khá rõ: **BE1 quản lý nền tảng và tài nguyên, BE2 quản lý vòng đời thuê, BE3 quản lý tiền và business rule; FE1 lo khách hàng, FE2 lo vận hành nội bộ.**
