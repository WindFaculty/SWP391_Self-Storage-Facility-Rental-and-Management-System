# 🏢 Self-Storage Facility Rental and Management System (SWP391)

> Hệ thống quản lý và cho thuê kho tự quản (Self-Storage) đa cơ sở, được xây dựng theo kiến trúc **Modular Monolith** kết hợp **Spring Boot** và **React (Vite + Tailwind CSS)**.

---

## 📌 Giới thiệu dự án

**Self-Storage Facility Rental and Management System** là giải pháp toàn diện hỗ trợ doanh nghiệp tự động hóa và tối ưu hóa quy trình vận hành kho lưu trữ mini / kho tự quản:
- Quản lý nhiều cơ sở (Multi-facility), khu vực kho, tầng và các loại đơn vị kho (Storage Units).
- Quy trình đặt chỗ (Reservation) và hợp đồng thuê (Rental Contract) minh bạch, nhanh chóng.
- Hệ thống thanh toán, xuất hóa đơn (Billing & Invoices) tích hợp cổng thanh toán.
- Quản lý vận hành bảo trì, nhật ký truy cập (Operations & Maintenance).
- Hỗ trợ khách hàng (Support Tickets) và báo cáo doanh thu, tỷ lệ lấp đầy (Reporting & Analytics).

---

## 🏛️ Kiến trúc hệ thống (System Architecture)

Dự án áp dụng mô hình **Modular Monolith** nhằm đảm bảo tính toàn vẹn dữ liệu, dễ dàng mở rộng và tách thành Microservices khi cần thiết.

```
┌────────────────────────────────────────────────────────────────────┐
│                            CLIENT                                  │
│                       React + Tailwind                             │
│                                                                    │
│ Customer UI │ Staff UI │ Manager UI │ Operations UI │ Admin UI     │
└───────────────────────────────┬────────────────────────────────────┘
                                │ REST /api/v1
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT API                              │
│  Authentication │ JWT │ MFA │ RBAC │ Facility Scope │ Validation   │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                     MODULAR MONOLITH                               │
│                                                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐                  │
│ │  Identity   │ │  Facility   │ │  Inventory   │                  │
│ └─────────────┘ └─────────────┘ └──────────────┘                  │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐                  │
│ │ Reservation │ │   Rental    │ │   Billing    │                  │
│ └─────────────┘ └─────────────┘ └──────────────┘                  │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐                  │
│ │   Policy    │ │   Support   │ │  Reporting   │                  │
│ └─────────────┘ └─────────────┘ └──────────────┘                  │
│ ┌─────────────┐ ┌─────────────┐                                   │
│ │ Operations  │ │    Audit    │                                   │
│ └─────────────┘ └─────────────┘                                   │
└───────────────────────────────┬────────────────────────────────────┘
                                │ Spring Data JPA
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         SQL SERVER                                 │
└────────────────────────────────────────────────────────────────────┘
```

> 📄 Xem chi tiết sơ đồ kiến trúc tại: [kiến_trúc_hệ_thống.md](kiến_trúc_hệ_thống.md)

---

## ⚙️ Công nghệ sử dụng (Tech Stack)

| Phân hệ | Công nghệ / Thư viện |
| :--- | :--- |
| **Ngôn ngữ Backend** | Java 25 |
| **Backend Framework** | Spring Boot 4.1.1 |
| **Bảo mật & Phân quyền**| Spring Security, JJWT (JSON Web Token), RBAC |
| **Cơ sở dữ liệu** | Microsoft SQL Server |
| **ORM / Data Access** | Spring Data JPA (Hibernate) |
| **API Documentation** | Springdoc OpenAPI 3 (Swagger UI) |
| **Frontend Framework**| React (Vite) |
| **Styling** | Tailwind CSS |
| **External Adapters** | Google OAuth, Zalo Login, Email OTP, Zalo OTP, Payment Gateway |

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
SWP391/
├── pom.xml                                   # Cấu hình Spring Boot 4.1.1 & Java 25
├── .gitignore
├── README.md
├── kiến_trúc_hệ_thống.md                     # Bản vẽ kiến trúc hệ thống
│
├── src/
│   ├── main/
│   │   ├── java/com/storage/
│   │   │   ├── StorageApplication.java       # Main entry point của ứng dụng
│   │   │   │
│   │   │   ├── shared/                       # Shared Kernel dùng chung
│   │   │   │   ├── security/                 # JWT Provider, Security Filters, UserPrincipal
│   │   │   │   ├── exception/                # GlobalExceptionHandler, Custom Exceptions
│   │   │   │   ├── validation/               # Custom Bean Validators
│   │   │   │   ├── pagination/               # PageRequest / PageResponse helpers
│   │   │   │   ├── auditing/                 # AuditableEntity (createdAt, updatedAt)
│   │   │   │   └── config/                   # CORS, OpenAPI / Swagger configurations
│   │   │   │
│   │   │   ├── identity/                     # Quản lý tài khoản, phân quyền, OAuth, OTP
│   │   │   ├── facility/                     # Quản lý cơ sở kho, tòa nhà, phân tầng
│   │   │   ├── inventory/                    # Quản lý loại kho, đơn vị kho, trạng thái
│   │   │   ├── reservation/                  # Quản lý đặt giữ chỗ trước
│   │   │   ├── rental/                       # Quản lý hợp đồng thuê kho & check-in/out
│   │   │   ├── billing/                      # Quản lý hóa đơn, giao dịch, cổng thanh toán
│   │   │   ├── policy/                       # Chính sách giá, phụ phí, hủy kho
│   │   │   ├── operations/                   # Lịch bảo trì, kiểm tra kho, an ninh
│   │   │   ├── support/                      # Yêu cầu hỗ trợ (Ticket System)
│   │   │   ├── reporting/                    # Thống kê doanh thu, tỷ lệ lấp đầy
│   │   │   └── audit/                        # Ghi log hoạt động hệ thống
│   │   │
│   │   └── resources/
│   │       └── application.yml               # Cấu hình Database, JWT, Server
│   │
│   └── frontend/                             # React Client (Vite + Tailwind CSS)
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
│
├── database/                                 # SQL DDL & Migration Scripts
│   ├── V001__identity.sql
│   ├── V002__facility.sql
│   ├── V003__inventory.sql
│   ├── V004__pricing.sql
│   ├── V005__reservation.sql
│   ├── V006__billing.sql
│   └── V007__rental.sql
│
└── docs/                                     # Tài liệu thiết kế & API
    ├── erd/                                  # Sơ đồ quan hệ thực thể (ERD)
    └── api/                                  # Đặc tả REST API
```

---

## 👥 Phân quyền người dùng (User Roles)

Hệ thống hỗ trợ 5 vai trò người dùng chính:

1. **Customer (Khách hàng):** Tìm kiếm cơ sở, xem thông tin kho, đặt chỗ, ký hợp đồng thuê, thanh toán và gửi phiếu hỗ trợ.
2. **Staff (Nhân viên lễ tân / CSKH):** Hỗ trợ khách hàng check-in, check-out, bàn giao kho, xử lý yêu cầu trực tiếp tại quầy.
3. **Manager (Quản lý cơ sở):** Quản lý trạng thái kho, phê duyệt yêu cầu, cấu hình giá, xem báo cáo của cơ sở phụ trách.
4. **Operations (Đội ngũ vận hành & kỹ thuật):** Bảo trì cơ sở vật chất, bảo dưỡng kho định kỳ, quản lý truy cập và an ninh.
5. **Admin (Quản trị viên toàn hệ thống):** Quản lý danh mục cơ sở, phân quyền tài khoản, cấu hình hệ thống toàn diện, xem audit log.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu môi trường
- **Java:** JDK 25 trở lên.
- **Node.js:** Node 20.x hoặc 22.x, NPM 10.x.
- **Database:** Microsoft SQL Server 2019 trở lên.

### 2. Cấu hình cơ sở dữ liệu
Chỉnh sửa thông tin kết nối trong `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=StorageDB;encrypt=true;trustServerCertificate=true
    username: sa
    password: YourPassword123!
```

### 3. Chạy Backend (Spring Boot)
```bash
# Sử dụng Maven Wrapper hoặc Maven đã cài đặt
mvn clean spring-boot:run
```
- API Base URL: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`

### 4. Chạy Frontend (React + Vite)
```bash
cd src/frontend
npm install
npm run dev
```
- Frontend URL: `http://localhost:5173`

---

## 📄 Bản quyền
Dự án được phát triển trong khuôn khổ môn học **SWP391** - Đại học FPT.
