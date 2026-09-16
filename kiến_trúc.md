Dưới đây là bản kiến trúc tôi đề xuất để dùng làm kiến trúc chính thức cho dự án. Nó giữ đủ 5 actor và 7 business flow nhưng cố tình giới hạn độ phức tạp kỹ thuật.

# SELF-STORAGE FACILITY RENTAL AND MANAGEMENT SYSTEM

## 1. Mục tiêu kiến trúc

Hệ thống được xây dựng cho đồ án SWP391 với mục tiêu:

* Đáp ứng đầy đủ 5 nhóm người dùng.
* Đáp ứng đầy đủ 7 business flow.
* Hỗ trợ nhiều cơ sở lưu trữ.
* Quản lý được toàn bộ vòng đời thuê kho.
* Có phân quyền theo vai trò và cơ sở.
* Dễ chia việc cho nhiều thành viên.
* Dễ đọc và bảo trì.
* Dễ kiểm thử.
* Dễ demo trước hội đồng.
* Không đưa các kỹ thuật phân tán không cần thiết vào MVP.

Kiến trúc chính:

**Layered Monolith + Package by Feature**

Công nghệ:

* Backend: Java + Spring Boot.
* Frontend: React + Vite + Tailwind CSS.
* Database: Microsoft SQL Server.
* ORM: Spring Data JPA / Hibernate.
* Security: Spring Security + JWT.
* API documentation: OpenAPI / Swagger.
* Database Migration: Flyway.
* Build: Maven.

Không sử dụng trong MVP:

* Microservices.
* Kafka.
* RabbitMQ.
* Event Bus.
* CQRS.
* Event Sourcing.
* Redis.
* Elasticsearch.
* Workflow Engine.
* Policy Engine.
* Permission Engine.
* API Gateway riêng.
* Distributed Transaction.

---

# 2. Business Scope

Hệ thống có 5 role chính:

1. Storage Customer.
2. Facility Staff.
3. Facility Manager.
4. Business Operations Manager.
5. System Administrator.

Hệ thống phải xử lý 7 business flow:

1. Storage Unit Reservation Flow.
2. Storage Check-in and Handover Flow.
3. Rented Storage Unit Management Flow.
4. Business Rules, Fee Management and Revenue Monitoring Flow.
5. Facility Storage and Staff Management Flow.
6. Storage Renewal and Overdue Handling Flow.
7. Support Request and Issue Handling Flow.

---

# 3. Kiến trúc tổng thể

```text
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                                                             │
│                  React + Vite + Tailwind                    │
│                                                             │
│ Customer │ Staff │ Facility Manager │ Business │ Admin      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTPS / REST JSON
                               │ /api/v1
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     SPRING BOOT API                         │
│                                                             │
│  JWT Authentication                                         │
│  Role Authorization                                         │
│  Facility Scope                                             │
│  Request Validation                                         │
│  Exception Handling                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS FEATURES                        │
│                                                             │
│   ┌───────────┐ ┌───────────┐ ┌────────────┐               │
│   │  Account  │ │ Facility  │ │   Rental   │               │
│   └───────────┘ └───────────┘ └────────────┘               │
│                                                             │
│   ┌───────────┐ ┌───────────┐ ┌────────────┐               │
│   │  Payment  │ │  Support  │ │ Management │               │
│   └───────────┘ └───────────┘ └────────────┘               │
│                                                             │
│                 Common + Configuration                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                        Spring Data JPA
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQL SERVER                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 4. Nguyên tắc dependency

Luồng chuẩn của backend:

```text
HTTP Request
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
Database
```

Controller chỉ chịu trách nhiệm:

* Nhận HTTP request.
* Validate request cơ bản.
* Kiểm tra security annotation.
* Gọi Service.
* Trả HTTP response.

Service chịu trách nhiệm:

* Business rules.
* Transaction.
* Kiểm tra trạng thái.
* Phối hợp nhiều repository hoặc service.

Repository chịu trách nhiệm:

* Query database.
* Persistence.

Không cho phép:

```text
Controller → Repository
```

Không đặt business logic trong:

* Controller.
* DTO.
* Entity callback.
* Frontend.

---

# 5. Backend Project Structure

```text
SWP391/
│
├── backend/
│   │
│   ├── pom.xml
│   │
│   └── src/
│       │
│       ├── main/
│       │   │
│       │   ├── java/com/storage/
│       │   │   │
│       │   │   ├── StorageApplication.java
│       │   │   │
│       │   │   ├── account/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   ├── dto/
│       │   │   │   └── security/
│       │   │   │
│       │   │   ├── facility/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── rental/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── payment/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── support/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── management/
│       │   │   │   ├── controller/
│       │   │   │   ├── service/
│       │   │   │   ├── repository/
│       │   │   │   ├── entity/
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── common/
│       │   │   │   ├── entity/
│       │   │   │   ├── exception/
│       │   │   │   ├── response/
│       │   │   │   ├── pagination/
│       │   │   │   └── util/
│       │   │   │
│       │   │   └── config/
│       │   │       ├── SecurityConfig.java
│       │   │       ├── CorsConfig.java
│       │   │       ├── OpenApiConfig.java
│       │   │       └── JpaConfig.java
│       │   │
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-test.yml
│       │       │
│       │       └── db/migration/
│       │           ├── V001__account.sql
│       │           ├── V002__facility.sql
│       │           ├── V003__rental.sql
│       │           ├── V004__payment.sql
│       │           ├── V005__support.sql
│       │           └── V006__management.sql
│       │
│       └── test/
│           └── java/com/storage/
│               ├── account/
│               ├── facility/
│               ├── rental/
│               ├── payment/
│               ├── support/
│               └── management/
│
├── frontend/
│
├── docs/
│
└── README.md
```

---

# 6. Account Module

Account chịu trách nhiệm:

* Register.
* Login.
* JWT authentication.
* User management.
* Role management.
* Facility assignment.
* Login history.
* User activity log.

## Entity

### User

```text
User
--------------------------------
id
fullName
email
phone
passwordHash

role

assignedFacilityId

status

createdAt
updatedAt
```

Role:

```text
CUSTOMER
FACILITY_STAFF
FACILITY_MANAGER
BUSINESS_MANAGER
ADMIN
```

Status:

```text
ACTIVE
INACTIVE
LOCKED
```

`assignedFacilityId`:

* CUSTOMER → NULL.
* BUSINESS_MANAGER → NULL.
* ADMIN → NULL.
* FACILITY_STAFF → facility ID.
* FACILITY_MANAGER → facility ID.

Điều này giải quyết Facility Scope mà không cần hệ thống permission phức tạp.

---

## ActivityLog

```text
ActivityLog
--------------------------------
id
userId

action
entityType
entityId

description

ipAddress
createdAt
```

Ví dụ action:

```text
LOGIN_SUCCESS
LOGIN_FAILED

CREATE_RESERVATION
CANCEL_RESERVATION

ASSIGN_UNIT

CHECK_IN
CHECK_OUT

CREATE_CHARGE
PAYMENT_SUCCESS

CREATE_SUPPORT_TICKET
RESOLVE_SUPPORT_TICKET

CHANGE_UNIT_STATUS
CHANGE_PRICE

ASSIGN_ROLE
ASSIGN_FACILITY
```

Không cần bảng LoginHistory riêng.

Login được lưu:

```text
ActivityLog.action = LOGIN_SUCCESS
```

hoặc:

```text
LOGIN_FAILED
```

---

# 7. Facility Module

Facility chịu trách nhiệm:

* Facility.
* Unit type.
* Storage unit.
* Unit availability.
* Unit status.
* Storage location.
* Rental price tại facility.

Các entity:

```text
Facility
UnitType
StorageUnit
```

---

# 8. Facility Entity

```text
Facility
--------------------------------
id
name
address
phone

description

status

createdAt
updatedAt
```

Status:

```text
ACTIVE
INACTIVE
```

---

# 9. UnitType Entity

UnitType mô tả loại và kích thước kho.

```text
UnitType
--------------------------------
id

name

width
length
height

description

minMonthlyPrice
maxMonthlyPrice

createdAt
updatedAt
```

Ví dụ:

```text
SMALL
1 x 1 x 2 m

MEDIUM
2 x 2 x 2 m

LARGE
3 x 3 x 2.5 m
```

`minMonthlyPrice` và `maxMonthlyPrice` do Business Operations Manager thiết lập.

Facility Manager chỉ được đặt giá StorageUnit trong khoảng:

```text
minMonthlyPrice
<=
StorageUnit.monthlyPrice
<=
maxMonthlyPrice
```

---

# 10. StorageUnit Entity

```text
StorageUnit
--------------------------------
id

facilityId
unitTypeId

code

floor
location

monthlyPrice

status

createdAt
updatedAt
```

Status:

```text
AVAILABLE
RESERVED
OCCUPIED
INSPECTION
MAINTENANCE
UNAVAILABLE
```

Ý nghĩa:

### AVAILABLE

Kho có thể được gán cho khách.

### RESERVED

Kho đã được gán cho reservation nhưng chưa check-in.

### OCCUPIED

Khách đang thuê.

### INSPECTION

Kho đang được kiểm tra sau khi khách trả.

### MAINTENANCE

Kho cần sửa chữa.

### UNAVAILABLE

Kho không được phép sử dụng.

---

# 11. Rental Module

Rental là module nghiệp vụ trung tâm.

Chịu trách nhiệm:

* Reservation.
* Assign StorageUnit.
* Rental Contract.
* Check-in.
* Handover.
* Check-out.
* Unit return.
* Renewal.
* Overdue.

Entity:

```text
Reservation
RentalContract
HandoverRecord
```

---

# 12. Reservation Entity

Customer không chọn StorageUnit cụ thể.

Customer chỉ chọn:

```text
Facility
Unit Type
Start Date
Rental Period
```

Sau đó Facility Manager mới assign StorageUnit.

```text
Reservation
--------------------------------
id

customerId

facilityId
unitTypeId

preferredStartDate
rentalMonths

assignedUnitId

estimatedPrice

status

createdAt
updatedAt
```

Status:

```text
PENDING
CONFIRMED
UNIT_ASSIGNED
CANCELLED
CHECKED_IN
COMPLETED
```

---

# 13. Reservation State Flow

```text
                 ┌─────────────┐
                 │   PENDING   │
                 └──────┬──────┘
                        │
               confirm reservation
                        │
                        ▼
                 ┌─────────────┐
                 │  CONFIRMED  │
                 └──────┬──────┘
                        │
                    assign unit
                        │
                        ▼
               ┌─────────────────┐
               │  UNIT_ASSIGNED  │
               └────────┬────────┘
                        │
                     check-in
                        │
                        ▼
                 ┌─────────────┐
                 │ CHECKED_IN  │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  COMPLETED  │
                 └─────────────┘
```

Cancellation:

```text
PENDING
   └──→ CANCELLED

CONFIRMED
   └──→ CANCELLED
```

tùy RentalPolicy.

---

# 14. RentalContract Entity

```text
RentalContract
--------------------------------
id

reservationId
customerId
storageUnitId

startDate
endDate

monthlyPrice
depositAmount

status

createdAt
updatedAt
```

Status:

```text
PENDING
ACTIVE
OVERDUE
ENDED
CANCELLED
```

Không cần một Contract Workflow Engine.

Business rule được xử lý trực tiếp trong `RentalContractService`.

---

# 15. HandoverRecord

Một entity dùng chung cho cả:

* Check-in.
* Check-out.
* Handover.
* Return.
* Unit inspection.

```text
HandoverRecord
--------------------------------
id

contractId

type

scheduledAt
completedAt

staffId

unitCondition

lockHandled
accessCardHandled
accessCodeHandled

notes

createdAt
```

Type:

```text
CHECK_IN
CHECK_OUT
```

Ví dụ:

```text
CHECK_IN

lockHandled = true
accessCardHandled = true
accessCodeHandled = true
```

Check-out có thể ghi:

```text
unitCondition = DAMAGED
```

sau đó tạo:

```text
Charge.type = EXTRA
```

---

# 16. Check-in Flow

```text
Reservation CONFIRMED
        ↓
Manager selects suitable Unit
        ↓
StorageUnit = RESERVED
        ↓
Reservation = UNIT_ASSIGNED
        ↓
Create / Confirm appointment
        ↓
Customer arrives
        ↓
Staff verifies reservation
        ↓
Staff checks StorageUnit
        ↓
Create HandoverRecord CHECK_IN
        ↓
RentalContract = ACTIVE
        ↓
StorageUnit = OCCUPIED
        ↓
Reservation = CHECKED_IN
```

Các thay đổi trên phải nằm trong transaction phù hợp.

---

# 17. Check-out Flow

```text
ACTIVE Contract
      ↓
Return appointment
      ↓
Staff checks StorageUnit
      ↓
Create HandoverRecord CHECK_OUT
      ↓
StorageUnit = INSPECTION
      ↓
Check damage / missing key / card
      ↓
If problem:
    Create EXTRA Charge
      ↓
Finish inspection
      ↓
Contract = ENDED
      ↓
StorageUnit = AVAILABLE
      ↓
Reservation = COMPLETED
```

Nếu kho bị hư:

```text
StorageUnit = MAINTENANCE
```

thay vì `AVAILABLE`.

---

# 18. Payment Module

Payment chịu trách nhiệm:

* Deposit.
* Rental fee.
* Renewal fee.
* Overdue fee.
* Extra fee.
* Fee waiver.
* Payment history.

Entity:

```text
Charge
Payment
```

Tách Charge khỏi Payment là quan trọng.

`Charge` trả lời câu hỏi:

> Khách cần trả bao nhiêu và vì lý do gì?

`Payment` trả lời:

> Khách đã thanh toán bao nhiêu bằng cách nào?

---

# 19. Charge Entity

```text
Charge
--------------------------------
id

contractId

type

description

amount

status

dueDate

createdBy

createdAt
updatedAt
```

Type:

```text
DEPOSIT
RENT
RENEWAL
EXTRA
OVERDUE
```

Status:

```text
UNPAID
PARTIALLY_PAID
PAID
WAIVED
CANCELLED
```

Ví dụ:

```text
type = EXTRA
description = "Lost access card"
amount = 200000
```

---

# 20. Payment Entity

```text
Payment
--------------------------------
id

chargeId
customerId

amount

method

transactionReference

status

paidAt

createdAt
```

Method:

```text
CASH
BANK_TRANSFER
ONLINE
```

Status:

```text
PENDING
SUCCESS
FAILED
REFUNDED
```

MVP chỉ cần một payment gateway nếu có thanh toán online.

Không triển khai nhiều gateway cùng lúc.

---

# 21. Renewal Flow

```text
ACTIVE Contract
       ↓
Customer requests renewal
       ↓
Check Unit availability
       ↓
Check Policy
       ↓
Calculate renewal amount
       ↓
Create RENEWAL Charge
       ↓
Customer pays
       ↓
Payment SUCCESS
       ↓
Extend Contract.endDate
       ↓
Contract remains ACTIVE
```

Không cần entity Renewal riêng cho MVP.

---

# 22. Overdue Flow

Một scheduled job chạy mỗi ngày:

```text
Current Date
    >
Contract.endDate
```

và:

```text
Contract.status = ACTIVE
```

thì:

```text
Contract.status = OVERDUE
```

Sau đó:

```text
Calculate overdue days
        ↓
Read RentalPolicy
        ↓
Calculate overdue fee
        ↓
Create OVERDUE Charge
```

Có thể triển khai:

```java
@Scheduled(cron = "0 0 1 * * *")
```

---

# 23. Support Module

Support xử lý:

* Unit problem.
* Lock.
* Lost key.
* Access card.
* Access code.
* Payment.
* Stored items.
* Other problem.

Entity:

```text
SupportTicket
```

---

# 24. SupportTicket Entity

```text
SupportTicket
--------------------------------
id

customerId
facilityId

contractId
storageUnitId

category

title
description

priority
status

assignedStaffId

resolutionNote

createdAt
resolvedAt
```

Category:

```text
UNIT
LOCK
KEY
ACCESS_CARD
ACCESS_CODE
PAYMENT
STORED_ITEM
OTHER
```

Priority:

```text
LOW
NORMAL
HIGH
```

Status:

```text
OPEN
IN_PROGRESS
RESOLVED
CLOSED
```

---

# 25. Support Flow

```text
Customer
    ↓
Create Support Ticket
    ↓
OPEN
    ↓
Facility Manager
    ↓
Assign Staff
    ↓
IN_PROGRESS
    ↓
Staff handles problem
    ↓
Add resolution note
    ↓
RESOLVED
    ↓
CLOSED
```

Nếu vấn đề liên quan StorageUnit:

```text
SupportTicket
      ↓
StorageUnit → MAINTENANCE
```

Nếu vấn đề phát sinh phí:

```text
SupportTicket
      ↓
Create EXTRA Charge
```

---

# 26. Staff Daily Work List

Không tạo bảng DailyTask.

Daily workload được tổng hợp bằng query.

Endpoint:

```text
GET /api/v1/staff/today
```

Response:

```json
{
  "checkIns": [],
  "checkOuts": [],
  "supportTickets": []
}
```

Nguồn dữ liệu:

```text
HandoverRecord
WHERE scheduledAt = TODAY
AND staffId = currentUser

SupportTicket
WHERE assignedStaffId = currentUser
AND status IN (OPEN, IN_PROGRESS)
```

---

# 27. Management Module

Management xử lý những nghiệp vụ thuộc Business Operations Manager:

* Rental policies.
* Fee policies.
* Revenue monitoring.
* Occupancy monitoring.
* Reports.
* Export reports.

Entity:

```text
RentalPolicy
FeePolicy
```

Report không cần entity riêng.

---

# 28. RentalPolicy Entity

```text
RentalPolicy
--------------------------------
id

depositPercent

minimumRentalMonths

cancellationAllowedBeforeDays
cancellationFeePercent

renewalNoticeDays

returnGraceDays

overdueFeePerDay

active

updatedBy
updatedAt
```

Không xây Rule Engine.

Đây chỉ là một bảng configuration.

---

# 29. FeePolicy Entity

```text
FeePolicy
--------------------------------
id

code
name

defaultAmount

waivable

active

createdAt
updatedAt
```

Ví dụ:

```text
LOST_KEY
200000

LOST_ACCESS_CARD
300000

DAMAGED_LOCK
500000
```

Khi Staff/Manager tạo EXTRA charge:

```text
FeePolicy
    ↓
Charge
```

Manager có thể thay đổi amount nếu quyền nghiệp vụ cho phép.

---

# 30. Reporting Architecture

Không có Reporting Module riêng.

Các report được query trực tiếp từ database thông qua:

```text
DashboardService
ReportService
```

---

# 31. Facility Manager Dashboard

Endpoint:

```text
GET /api/v1/manager/dashboard
```

Scope:

```text
currentUser.assignedFacilityId
```

Response có thể gồm:

```text
totalUnits

availableUnits
reservedUnits
occupiedUnits
maintenanceUnits

activeContracts
overdueContracts

todayCheckIns
todayCheckOuts

monthlyRevenue

occupancyRate
```

Occupancy:

```text
occupied units
---------------- × 100
rentable units
```

---

# 32. Business Operations Dashboard

Endpoint:

```text
GET /api/v1/business/dashboard
```

Bao gồm:

```text
totalFacilities

totalUnits

availableUnits
occupiedUnits

systemOccupancyRate

monthlyRevenue

overdueContracts

revenueByFacility

occupancyByFacility

revenueByUnitType
```

---

# 33. Export Report

Các định dạng MVP:

```text
CSV
XLSX
```

Ví dụ:

```text
GET /api/v1/business/reports/revenue/export

GET /api/v1/business/reports/occupancy/export

GET /api/v1/business/reports/contracts/export
```

Không cần BI engine.

---

# 34. Database Model Tổng thể

Core entities:

```text
1. User
2. ActivityLog

3. Facility
4. UnitType
5. StorageUnit

6. Reservation
7. RentalContract
8. HandoverRecord

9. Charge
10. Payment

11. SupportTicket

12. RentalPolicy
13. FeePolicy
```

Tổng cộng:

**13 core entities.**

---

# 35. ERD Logical View

```text
User
 │
 ├──────────────────────────┐
 │                          │
 ▼                          ▼
Reservation             ActivityLog
 │
 │
 ▼
RentalContract
 │
 ├───────────────┬─────────────────────┐
 │               │                     │
 ▼               ▼                     ▼
HandoverRecord  Charge            SupportTicket
                  │
                  ▼
               Payment


Facility
 │
 ├────────────── StorageUnit
 │                    │
 │                    ▼
 │                 UnitType
 │
 ├────────────── Facility Staff
 │
 └────────────── Facility Manager


RentalPolicy

FeePolicy
```

---

# 36. Quan hệ chính

## Facility → StorageUnit

```text
1 : N
```

Một facility có nhiều storage unit.

---

## UnitType → StorageUnit

```text
1 : N
```

Một loại kho có nhiều storage unit.

---

## Customer → Reservation

```text
1 : N
```

Một customer có thể thuê nhiều kho.

---

## Reservation → RentalContract

```text
1 : 0..1
```

Reservation có thể chưa tạo contract.

---

## StorageUnit → RentalContract

Theo thời gian:

```text
1 : N
```

Một StorageUnit có thể có nhiều contract lịch sử.

Nhưng chỉ được có tối đa một ACTIVE contract tại một thời điểm.

---

## RentalContract → Charge

```text
1 : N
```

---

## Charge → Payment

```text
1 : N
```

cho phép partial payment nếu cần.

---

## RentalContract → HandoverRecord

```text
1 : N
```

Thông thường:

```text
1 CHECK_IN
1 CHECK_OUT
```

---

## RentalContract → SupportTicket

```text
1 : N
```

---

# 37. Security Architecture

Security pipeline:

```text
HTTP Request
      ↓
JWT Authentication Filter
      ↓
Validate Token
      ↓
Load User
      ↓
SecurityContext
      ↓
Role Check
      ↓
Facility Scope Check
      ↓
Controller
```

---

# 38. Role Authorization

Ví dụ:

```java
@PreAuthorize("hasRole('FACILITY_MANAGER')")
```

hoặc:

```java
@PreAuthorize("hasAnyRole('FACILITY_MANAGER','BUSINESS_MANAGER')")
```

Không xây permission matrix quá lớn.

---

# 39. Facility Scope

Role:

```text
FACILITY_STAFF
FACILITY_MANAGER
```

chỉ được truy cập resource của:

```text
User.assignedFacilityId
```

Ví dụ:

Manager facility 5 không được:

```text
GET /facilities/7/reservations
```

Service phải validate:

```text
resource.facilityId
==
currentUser.assignedFacilityId
```

Không chỉ kiểm tra trên frontend.

---

# 40. REST API Architecture

Base URL:

```text
/api/v1
```

---

# 41. Authentication APIs

```text
POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me
```

---

# 42. Customer Facility APIs

```text
GET /api/v1/facilities

GET /api/v1/facilities/{facilityId}

GET /api/v1/facilities/{facilityId}/unit-types

GET /api/v1/facilities/{facilityId}/available-units
```

Search có thể hỗ trợ:

```text
facility
unitType
startDate
rentalMonths
price
```

---

# 43. Reservation APIs

Customer:

```text
POST /api/v1/reservations

GET /api/v1/reservations/my

GET /api/v1/reservations/{id}

PUT /api/v1/reservations/{id}/cancel
```

Manager:

```text
GET /api/v1/manager/reservations

PUT /api/v1/manager/reservations/{id}/confirm

PUT /api/v1/manager/reservations/{id}/assign-unit
```

---

# 44. Contract APIs

Customer:

```text
GET /api/v1/contracts/my

GET /api/v1/contracts/{id}

POST /api/v1/contracts/{id}/renew
```

Manager/Staff:

```text
GET /api/v1/manager/contracts

POST /api/v1/manager/contracts/{id}/check-in

POST /api/v1/manager/contracts/{id}/check-out
```

---

# 45. Payment APIs

```text
GET /api/v1/payments/my

GET /api/v1/contracts/{contractId}/charges

POST /api/v1/charges/{chargeId}/payments
```

Nếu online payment:

```text
POST /api/v1/payments/online/create

GET /api/v1/payments/online/callback
```

---

# 46. Support APIs

Customer:

```text
POST /api/v1/support-tickets

GET /api/v1/support-tickets/my

GET /api/v1/support-tickets/{id}
```

Manager:

```text
GET /api/v1/manager/support-tickets

PUT /api/v1/manager/support-tickets/{id}/assign
```

Staff:

```text
GET /api/v1/staff/support-tickets

PUT /api/v1/staff/support-tickets/{id}/start

PUT /api/v1/staff/support-tickets/{id}/resolve
```

---

# 47. Facility Management APIs

Business Manager:

```text
POST /api/v1/business/facilities

PUT /api/v1/business/facilities/{id}

GET /api/v1/business/facilities
```

Facility Manager:

```text
GET /api/v1/manager/units

POST /api/v1/manager/units

PUT /api/v1/manager/units/{id}

PUT /api/v1/manager/units/{id}/status
```

---

# 48. Policy APIs

```text
GET /api/v1/business/rental-policy

PUT /api/v1/business/rental-policy

GET /api/v1/business/fee-policies

POST /api/v1/business/fee-policies

PUT /api/v1/business/fee-policies/{id}
```

---

# 49. Admin APIs

```text
GET /api/v1/admin/users

POST /api/v1/admin/users

PUT /api/v1/admin/users/{id}

PUT /api/v1/admin/users/{id}/role

PUT /api/v1/admin/users/{id}/facility

PUT /api/v1/admin/users/{id}/status

GET /api/v1/admin/activity-logs
```

---

# 50. API Response Standard

Success:

```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Storage unit is not available",
  "errorCode": "UNIT_NOT_AVAILABLE",
  "data": null
}
```

Validation:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "startDate": "Start date must not be in the past"
  }
}
```

---

# 51. Exception Architecture

```text
common/exception/

BusinessException
NotFoundException
ForbiddenException
ConflictException
ValidationException

GlobalExceptionHandler
```

Không tạo hàng chục custom exception nếu không cần.

---

# 52. Transaction Architecture

Service là transaction boundary.

Ví dụ check-in:

```text
BEGIN TRANSACTION

Validate reservation
Validate unit
Create contract
Create handover record

Reservation → CHECKED_IN
Unit → OCCUPIED
Contract → ACTIVE

COMMIT
```

Nếu bất kỳ bước nào lỗi:

```text
ROLLBACK
```

Vì hệ thống dùng chung SQL Server nên không cần Saga.

---

# 53. Concurrency Rule

Một vấn đề bắt buộc phải xử lý:

**Không được assign cùng một StorageUnit cho hai customer.**

Khi Manager assign unit:

```text
SELECT StorageUnit
WHERE id = ?
AND status = AVAILABLE
```

sau đó update:

```text
AVAILABLE → RESERVED
```

thực hiện trong transaction.

Có thể sử dụng:

```text
@Version
```

optimistic locking.

Ví dụ:

```text
StorageUnit

id
...
version
```

Nếu hai request cùng assign một unit, một request phải fail.

---

# 54. Pricing Rule

Business Manager:

```text
UnitType.minMonthlyPrice
UnitType.maxMonthlyPrice
```

Facility Manager:

```text
StorageUnit.monthlyPrice
```

Rule:

```text
minMonthlyPrice
<= monthlyPrice
<= maxMonthlyPrice
```

---

# 55. Reservation Price

MVP:

```text
estimatedPrice
=
monthlyPrice × rentalMonths
```

Deposit:

```text
deposit
=
estimatedPrice × depositPercent
```

Không xây dynamic pricing engine.

---

# 56. Frontend Architecture

Một React application duy nhất.

```text
frontend/
│
├── package.json
├── vite.config.js
│
└── src/
    │
    ├── api/
    │   ├── axiosClient.js
    │   ├── authApi.js
    │   ├── facilityApi.js
    │   ├── rentalApi.js
    │   ├── paymentApi.js
    │   └── supportApi.js
    │
    ├── components/
    │   ├── Button/
    │   ├── Modal/
    │   ├── Table/
    │   ├── Pagination/
    │   ├── Loading/
    │   └── ConfirmDialog/
    │
    ├── layouts/
    │   ├── CustomerLayout.jsx
    │   ├── StaffLayout.jsx
    │   └── ManagementLayout.jsx
    │
    ├── features/
    │   │
    │   ├── auth/
    │   │
    │   ├── facility/
    │   │
    │   ├── reservation/
    │   │
    │   ├── rental/
    │   │
    │   ├── payment/
    │   │
    │   ├── support/
    │   │
    │   ├── staff/
    │   │
    │   ├── facility-manager/
    │   │
    │   ├── business-manager/
    │   │
    │   └── admin/
    │   │
    │   └── routes/
    │       ├── AppRouter.jsx
    │       ├── ProtectedRoute.jsx
    │       └── RoleRoute.jsx
    │
    ├── store/
    │   └── authStore.js
    │
    ├── App.jsx
    └── main.jsx
```

Không tạo 5 frontend project riêng.

---

# 57. Customer Routes

```text
/

/facilities

/facilities/:facilityId

/reserve

/my-reservations

/my-storage

/my-contracts

/my-payments

/support

/profile
```

---

# 58. Staff Routes

```text
/staff/today

/staff/check-ins

/staff/check-outs

/staff/support

/staff/support/:ticketId
```

---

# 59. Facility Manager Routes

```text
/manager/dashboard

/manager/units

/manager/reservations

/manager/contracts

/manager/staff

/manager/support

/manager/reports
```

---

# 60. Business Manager Routes

```text
/business/dashboard

/business/facilities

/business/pricing

/business/policies

/business/fees

/business/reports
```

---

# 61. Admin Routes

```text
/admin/users

/admin/users/:id

/admin/activity-logs
```

---

# 62. Frontend Authorization

Frontend có:

```text
ProtectedRoute
RoleRoute
```

Ví dụ:

```text
RoleRoute
allowedRoles = [
  FACILITY_MANAGER
]
```

Nhưng frontend authorization chỉ để UI.

Backend vẫn phải kiểm tra quyền thật.

---

# 63. State Management

Không cần Redux nếu state chưa phức tạp.

Có thể sử dụng:

```text
React Context
```

hoặc:

```text
Zustand
```

cho:

```text
current user
JWT
role
facility
```

Server data nên lấy trực tiếp qua API.

---

# 64. Database Migration Structure

```text
backend/src/main/resources/db/migration/

V001__account.sql

V002__facility.sql

V003__rental.sql

V004__payment.sql

V005__support.sql

V006__management.sql

V007__seed_roles_and_admin.sql
```

Không tạo một migration cho mỗi bảng nhỏ nếu chưa cần.

---

# 65. Database Index

Nên index:

```text
users.email

storage_units.facility_id
storage_units.unit_type_id
storage_units.status

reservations.customer_id
reservations.facility_id
reservations.status
reservations.preferred_start_date

rental_contracts.customer_id
rental_contracts.storage_unit_id
rental_contracts.status
rental_contracts.end_date

charges.contract_id
charges.status

payments.charge_id

support_tickets.facility_id
support_tickets.assigned_staff_id
support_tickets.status

activity_logs.user_id
activity_logs.created_at
```

---

# 66. Seven Flow Mapping

## Flow 1 — Storage Unit Reservation

Modules:

```text
Facility
Rental
Payment
```

Flow:

```text
Browse Facility
      ↓
Choose Unit Type
      ↓
Choose Start Date
      ↓
Choose Rental Period
      ↓
Create Reservation
      ↓
Calculate Price
      ↓
Create Deposit Charge
      ↓
Payment
      ↓
Reservation CONFIRMED
```

---

# 67. Flow 2 — Check-in and Handover

Modules:

```text
Facility
Rental
```

```text
Confirmed Reservation
       ↓
Manager Assign Unit
       ↓
Unit RESERVED
       ↓
Schedule Handover
       ↓
Customer Arrives
       ↓
Staff Verify
       ↓
Handover
       ↓
Contract ACTIVE
       ↓
Unit OCCUPIED
```

---

# 68. Flow 3 — Rented Storage Management

Modules:

```text
Rental
Payment
Support
```

```text
ACTIVE Contract
      ↓
View rental
      ↓
View payment
      ↓
Request support
      ↓
Renew
or
Return
```

---

# 69. Flow 4 — Business Rules and Revenue

Modules:

```text
Management
Payment
Facility
```

```text
Rental Policy
Fee Policy
Price Range
      ↓
Charges
      ↓
Payments
      ↓
Revenue Aggregation
      ↓
Dashboard / Reports
```

---

# 70. Flow 5 — Facility Storage and Staff Management

Modules:

```text
Facility
Account
Rental
Support
```

```text
Business Manager
      ↓
Facility
      ↓
Facility Manager
      ↓
Storage Units
      ↓
Facility Staff
      ↓
Assign Handover / Support
```

---

# 71. Flow 6 — Renewal and Overdue

Modules:

```text
Rental
Payment
Management
```

```text
ACTIVE Contract
      ↓
Renewal Request
      ↓
Create Renewal Charge
      ↓
Payment
      ↓
Extend Contract
```

Overdue:

```text
Scheduled Job
      ↓
Detect Expired Contract
      ↓
OVERDUE
      ↓
Calculate Fee
      ↓
Create OVERDUE Charge
```

---

# 72. Flow 7 — Support Request

Modules:

```text
Support
Account
Facility
Payment
```

```text
Customer
      ↓
Support Ticket
      ↓
Manager
      ↓
Assign Staff
      ↓
Staff Handles
      ↓
Resolve
```

Nếu cần:

```text
Unit → MAINTENANCE
```

hoặc:

```text
Create EXTRA Charge
```

---

# 73. Testing Architecture

Ba lớp test chính.

## Unit Test

Test Service business logic.

Ví dụ:

```text
ReservationServiceTest

RentalContractServiceTest

PaymentServiceTest

SupportServiceTest
```

---

# 74. Repository Test

Kiểm tra query database:

```text
StorageUnitRepositoryTest

ReservationRepositoryTest

ContractRepositoryTest
```

---

# 75. Integration Test

Test API end-to-end:

```text
POST reservation

↓

manager assign unit

↓

check-in

↓

payment

↓

renew

↓

check-out
```

---

# 76. Critical Test Cases

Bắt buộc test:

### Reservation

```text
Cannot reserve invalid UnitType

Cannot reserve inactive Facility

Cannot cancel after configured deadline
```

### Unit Assignment

```text
Cannot assign OCCUPIED unit

Cannot assign MAINTENANCE unit

Cannot assign same unit twice
```

### Check-in

```text
Cannot check-in without assigned unit

Cannot check-in cancelled reservation
```

### Payment

```text
Cannot mark charge paid without valid payment

Cannot pay cancelled charge
```

### Renewal

```text
Cannot renew ENDED contract
```

### Facility Scope

```text
Manager Facility A
cannot manage Facility B
```

### Authorization

```text
CUSTOMER cannot call ADMIN APIs
```

---

# 77. Logging

Application log:

```text
INFO

WARN

ERROR
```

Không log:

```text
password
JWT
payment secret
```

Business actions quan trọng được ghi vào:

```text
ActivityLog
```

---

# 78. Configuration

`application.yml`:

```text
server

database

jwt

cors

payment

logging
```

Secret không commit vào Git.

Dùng environment variables:

```text
DB_URL

DB_USERNAME

DB_PASSWORD

JWT_SECRET

PAYMENT_SECRET
```

---

# 79. Deployment Architecture

MVP có thể deploy:

```text
┌─────────────────┐
│ React Frontend  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Spring Boot API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQL Server    │
└─────────────────┘
```

Không cần Kubernetes.

Docker Compose có thể dùng:

```text
frontend
backend
sqlserver
```

nhưng không bắt buộc cho phát triển local.

---

# 80. Package Dependency

Mối quan hệ chính:

```text
account
   ↑

facility ← rental → payment
   ↑        ↓
   │      support
   │
   └──── management
```

Cho phép Service gọi Service trực tiếp.

Ví dụ:

```text
ReservationService
        ↓
FacilityService
```

hoặc:

```text
RentalService
        ↓
PaymentService
```

Không cần:

```text
Event
Command Bus
Message Bus
Port
Adapter
```

---

# 81. Business Logic Placement

Ví dụ:

```text
ReservationController
```

không được tự tính deposit.

Controller gọi:

```text
ReservationService.createReservation()
```

Service:

```text
validate facility
validate unit type
validate dates
calculate estimated price
create reservation
create deposit charge
```

Đây là nơi business logic phải nằm.

---

# 82. MVP Architecture Summary

Kiến trúc cuối:

```text
                       React SPA
                           │
                           │ REST
                           ▼
                     Spring Boot
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Account          Facility          Rental
          │                │                │
          │                └──────┬─────────┘
          │                       │
          │                    Payment
          │                       │
          │                    Support
          │                       │
          └────────────── Management
                           │
                           ▼
                      SQL Server
```

---

# 83. Business Modules

Chỉ có 6 nhóm nghiệp vụ chính:

```text
1. Account

2. Facility

3. Rental

4. Payment

5. Support

6. Management
```

Không chia nhỏ hơn nếu chưa có nhu cầu thực tế.

---

# 84. Core Entities

```text
User
ActivityLog

Facility
UnitType
StorageUnit

Reservation
RentalContract
HandoverRecord

Charge
Payment

SupportTicket

RentalPolicy
FeePolicy
```

Tổng:

```text
13 entities
```

Đây là mức đủ để đáp ứng toàn bộ requirement hiện tại mà vẫn giữ hệ thống nhỏ.

---

# 85. Nguyên tắc phát triển

Khi xuất hiện một yêu cầu mới:

Không ngay lập tức tạo:

```text
module mới
entity mới
layer mới
framework mới
```

Trước tiên kiểm tra xem có thể:

```text
thêm field
thêm enum
thêm Service method
thêm query
```

vào kiến trúc hiện tại hay không.

Chỉ tạo abstraction mới khi có ít nhất hai hoặc nhiều use case thực sự cần nó.

---

# 86. Architecture Decision cuối cùng

Hệ thống sử dụng:

**Layered Monolith + Package by Feature**

với:

```text
1 Spring Boot application

1 React application

1 SQL Server database

6 business feature groups

13 core entities

5 user roles

7 business flows
```

Mục tiêu kiến trúc không phải chuẩn bị sẵn cho một hệ thống microservices tương lai chưa tồn tại.

Mục tiêu là:

```text
Requirement đúng
        +
Code dễ hiểu
        +
Transaction đơn giản
        +
Team dễ chia việc
        +
Dễ kiểm thử
        +
Dễ demo
        +
Có thể hoàn thành trong SWP391
```

Đây là baseline kiến trúc nên được giữ ổn định trong toàn bộ giai đoạn MVP.

Kiến trúc trên đủ chi tiết để bước tiếp sang **ERD, database schema, API contract và chia module cho từng thành viên** mà không cần quay lại thay đổi kiến trúc lõi.
