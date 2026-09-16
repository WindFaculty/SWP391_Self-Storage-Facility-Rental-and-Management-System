# Kiến trúc hệ thống

Tài liệu này là bản tóm tắt triển khai. Quyết định kiến trúc đầy đủ nằm trong [kiến_trúc.md](kiến_trúc.md).

```text
React + Vite
     │ HTTPS / REST JSON (/api/v1)
     ▼
Spring Boot
 ├── JWT authentication
 ├── role authorization
 ├── facility scope
 ├── validation
 └── exception handling
     │
     ▼
Account · Facility · Rental · Payment · Support · Management
     │
     ▼
SQL Server
```

## Quy tắc phụ thuộc

```text
Controller → Service → Repository → Database
```

Business rule và transaction thuộc Service. Controller không truy cập Repository trực tiếp. Không dùng microservice, event bus, CQRS, permission engine hoặc workflow engine trong MVP.

## Thực thể lõi

```text
User, ActivityLog
Facility, UnitType, StorageUnit
Reservation, RentalContract, HandoverRecord
Charge, Payment
SupportTicket
RentalPolicy, FeePolicy
```

## Migrations

Flyway chạy các migration trong `src/main/resources/db/migration`. Không sử dụng thư mục `database/` cũ.
