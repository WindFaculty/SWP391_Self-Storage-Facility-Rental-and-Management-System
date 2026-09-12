# KẾ HOẠCH PHÁT TRIỂN HỆ THỐNG STORAGE MANAGEMENT

## 1. Cơ cấu nhóm

Nhóm gồm 5 thành viên:

| Thành viên         | Mã      | Vai trò chính                | Ownership                                                                |
| ------------------ | ------- | ---------------------------- | ------------------------------------------------------------------------ |
| **Hồ Xuân Thanh**  | **BE1** | Backend Platform & Facility  | Authentication, RBAC, User, Facility, Inventory, Staff Assignment, Audit |
| **Bùi Văn Tình**   | **BE2** | Backend Reservation & Rental | Availability, Reservation, Check-in, Handover, Rental Contract, Return   |
| **Lê Trí Thiện**   | **BE3** | Backend Business & Billing   | Pricing, Policy, Payment, Renewal, Overdue, Support, Reporting           |
| **Bùi Tuấn Thanh** | **FE1** | Customer Frontend            | Customer Portal, Reservation, Payment, Rental, Renewal, Support          |
| **Trần Xuân Khoa** | **FE2** | Internal Frontend            | Staff, Facility Manager, Business Manager, System Admin                  |

---

# 2. Nguyên tắc phân chia công việc

Không chia theo kiểu:

```text
BE1 làm 1/3 API
BE2 làm 1/3 API
BE3 làm 1/3 API
```

Cách này khiến ownership không rõ ràng và khi xảy ra bug rất khó xác định ai chịu trách nhiệm.

Nhóm sử dụng:

```text
DOMAIN OWNERSHIP
+
VERTICAL SLICE
+
API CONTRACT FIRST
```

Mỗi backend có domain rõ ràng.

Mỗi frontend có nhóm người dùng rõ ràng.

Mỗi business flow có một Backend Owner và một Frontend Owner.

---

# 3. Domain ownership

## 3.1. Hồ Xuân Thanh — BE1

### Backend Platform & Facility Owner

Chịu trách nhiệm chính:

```text
Identity
Authentication
Authorization
RBAC
User Management

Facility
Floor
Zone

Unit Type
Storage Unit
Inventory

Facility Staff Assignment

Unit Status

Audit
Security
Facility Scope
```

BE1 chịu trách nhiệm bảo đảm:

```text
User nào?
Có role gì?
Thuộc facility nào?
Có quyền làm hành động gì?
Unit đang ở trạng thái gì?
```

BE1 là owner chính của các nền tảng mà các backend khác sử dụng.

---

# 4. Bùi Văn Tình — BE2

## Backend Reservation & Rental Lifecycle Owner

Chịu trách nhiệm:

```text
Availability

Reservation
Reservation Item

Check-in Appointment

Unit Assignment

Handover

Rental Contract
Contract Unit

Unit Change

Return Request
Inspection

Rental Lifecycle
```

BE2 chịu trách nhiệm cho lifecycle:

```text
AVAILABLE
↓
RESERVED
↓
CONFIRMED
↓
ASSIGNED
↓
CHECKED_IN
↓
OCCUPIED
↓
RETURN
↓
AVAILABLE
```

Các transaction liên quan reservation/rental do BE2 kiểm soát.

---

# 5. Lê Trí Thiện — BE3

## Backend Business, Billing & Reporting Owner

Chịu trách nhiệm:

```text
Pricing

Deposit Policy
Fee Policy
Discount Policy
Overdue Policy

Charge
Payment
Payment Allocation

Renewal

Overdue

Support Request

Notifications foundation

Revenue Reporting
Occupancy Reporting
Business Reporting
```

BE3 chịu trách nhiệm các câu hỏi:

```text
Giá bao nhiêu?

Khách phải trả bao nhiêu?

Deposit bao nhiêu?

Đã thanh toán chưa?

Có overdue không?

Gia hạn bao nhiêu tiền?

Doanh thu bao nhiêu?
```

---

# 6. Bùi Tuấn Thanh — FE1

## Customer Frontend Owner

Chịu trách nhiệm toàn bộ giao diện phía khách hàng:

```text
Register
Login

Customer Dashboard

Facility Search

Facility Details

Storage Unit Selection

Reservation Wizard

Payment

My Reservations

My Storage Units

Rental Contract

Renewal

Return Request

Support

Payment History

Profile
```

FE1 phải bảo đảm customer flow hoàn chỉnh.

---

# 7. Trần Xuân Khoa — FE2

## Internal Frontend Owner

Chịu trách nhiệm giao diện:

```text
FACILITY_STAFF

FACILITY_MANAGER

BUSINESS_OPERATIONS_MANAGER

SYSTEM_ADMIN
```

Bao gồm:

```text
Internal Dashboard

Facility Management

Inventory

Staff Management

Reservation Management

Check-in

Handover

Rental Management

Pricing Management

Overdue

Support Queue

Reporting

User Management

Audit
```

---

# 8. Quy tắc API Contract

Trước khi bắt đầu mỗi business flow, Backend Owner và Frontend Owner phải chốt:

```text
Endpoint

HTTP Method

Request DTO

Response DTO

HTTP Status Code

Business Error Code

Enum

Pagination

Filter

Sort

Authorization

Facility Scope
```

Ví dụ Reservation:

```http
GET /api/v1/facilities/{facilityId}/availability

POST /api/v1/reservations

GET /api/v1/reservations/{reservationId}

POST /api/v1/reservations/{reservationId}/payments
```

FE không được chờ Backend hoàn thành mới code.

Quy trình:

```text
API contract
      ↓
Mock JSON
      ↓
FE triển khai UI
      │
      │ song song
      ↓
BE triển khai API
      ↓
Integration
```

---

# 9. PHASE 0 — FOUNDATION

Mục tiêu:

```text
Project chạy được
Database chạy được
Login được
Role hoạt động
Frontend route được theo role
```

---

## 9.1. Hồ Xuân Thanh — BE1

### Công việc

Khởi tạo Spring Boot project.

Thiết kế package:

```text
config
security
common
identity
facility
inventory
reservation
rental
billing
support
reporting
audit
```

Implement:

```text
User
Role
Permission
RolePermission
```

Role:

```text
CUSTOMER

FACILITY_STAFF

FACILITY_MANAGER

BUSINESS_OPERATIONS_MANAGER

SYSTEM_ADMIN
```

Xây authentication:

```text
Register

Login

Password hashing bằng BCrypt

JWT generation

JWT validation

Refresh authentication nếu thiết kế có

Current authenticated user
```

Xây:

```text
Spring Security

AuthenticationFilter

SecurityContext

Role authorization

Permission foundation
```

Tạo:

```text
GlobalExceptionHandler

ValidationError

BusinessException

NotFoundException

ForbiddenException
```

Chuẩn hóa response.

Ví dụ:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

### Test BE1

Phải có test:

```text
Register success

Duplicate email

Login success

Wrong password

Invalid JWT

Expired JWT

Unauthorized API

Role forbidden
```

---

## 9.2. Bùi Văn Tình — BE2

### Công việc

Thiết lập database foundation:

```text
SQL Server

Spring Data JPA

Hibernate

Database migration

BaseEntity
```

BaseEntity:

```text
id

createdAt
updatedAt
createdBy
updatedBy
```

Thống nhất:

```text
UUID strategy

Enum mapping

Timestamp

Soft delete nếu sử dụng
```

Chuẩn hóa:

```text
Repository

Service

Controller

DTO mapper
```

Xây transaction foundation:

```java
@Transactional
```

Tạo utility cho:

```text
Date Range

Rental Period

Entity Locking

Optimistic Lock
```

Chuẩn bị database cho transaction reservation/rental sau này.

### Test BE2

```text
Database connection

Migration

Repository save

Repository update

Transaction rollback

Date calculation
```

---

## 9.3. Lê Trí Thiện — BE3

### Công việc

Tạo business service foundation.

Interface:

```java
PaymentGateway
EmailSender
NotificationSender
```

Implementation MVP:

```text
MockPaymentGateway

MockEmailSender

MockNotificationSender
```

Chuẩn hóa pagination:

```text
page
size
sort
direction
```

Chuẩn hóa business money calculation:

```text
BigDecimal

Currency handling

Rounding
```

Chuẩn bị:

```text
Charge abstraction

Payment abstraction

Pricing abstraction
```

Thiết lập logging cho business operation.

Ví dụ:

```text
payment initiated

payment success

payment failed

charge generated
```

### Test BE3

```text
Mock payment SUCCESS

Mock payment FAILURE

Money rounding

Pagination

Business exception
```

---

# 9.4. Bùi Tuấn Thanh — FE1

Khởi tạo:

```text
React

TypeScript

Tailwind CSS

Router

Axios/Fetch API client
```

Tạo:

```text
Auth Store

JWT storage

Current User

Protected Route
```

Customer layout:

```text
Header

Navigation

Content

Footer
```

Component dùng chung:

```text
Button

Input

Select

DatePicker

Modal

Form

Toast

Loading

Skeleton

EmptyState

ErrorState
```

Trang:

```text
/login

/register

/customer
```

---

# 9.5. Trần Xuân Khoa — FE2

Xây Internal Application Layout.

Component:

```text
Sidebar

Header

Breadcrumb

Role Navigation

DataTable

Pagination

Filter

StatusBadge

ConfirmDialog
```

Layout:

```text
StaffLayout

FacilityManagerLayout

BusinessManagerLayout

AdminLayout
```

Xây:

```text
PermissionGuard

RoleGuard
```

Ví dụ:

```tsx
<PermissionGuard permission="FACILITY_EDIT">
```

---

# 9.6. Acceptance Phase 0

Demo:

```text
Register
↓
Login
↓
JWT
↓
GET Current User
↓
Detect Role
↓
Redirect
```

Kết quả:

```text
CUSTOMER
→ Customer Dashboard

FACILITY_STAFF
→ Staff Dashboard

FACILITY_MANAGER
→ Facility Dashboard

BUSINESS_OPERATIONS_MANAGER
→ Operations Dashboard

SYSTEM_ADMIN
→ Admin Dashboard
```

---

# 10. PHASE 1 — FACILITY, INVENTORY & STAFF

Đây phải là business phase đầu tiên vì reservation không thể hoạt động nếu chưa tồn tại facility và storage unit.

---

# 10.1. Hồ Xuân Thanh — BE1 — OWNER

Implement entity:

```text
Facility

FacilityFloor

FacilityZone

UnitType

StorageUnit

FacilityUserAssignment

UnitStatusHistory

UnitMaintenanceRecord
```

StorageUnit status:

```text
AVAILABLE

RESERVED

OCCUPIED

MAINTENANCE

INSPECTION

DISABLED
```

API:

```http
POST /api/v1/facilities

GET /api/v1/facilities

GET /api/v1/facilities/{id}

PUT /api/v1/facilities/{id}
```

Floor:

```http
POST /api/v1/facilities/{id}/floors

GET /api/v1/facilities/{id}/floors
```

Zone:

```http
POST /api/v1/floors/{id}/zones
```

Unit Type:

```http
POST /api/v1/unit-types

GET /api/v1/unit-types
```

Storage Unit:

```http
POST /api/v1/facilities/{id}/units

GET /api/v1/facilities/{id}/units

GET /api/v1/units/{id}

PATCH /api/v1/units/{id}/status
```

Staff:

```http
POST /api/v1/facilities/{id}/staff

GET /api/v1/facilities/{id}/staff

DELETE /api/v1/facilities/{id}/staff/{userId}
```

BE1 phải implement facility scope:

```text
Manager A thuộc Facility A

→ được quản lý Facility A

→ không được quản lý Facility B
```

---

# 10.2. Bùi Văn Tình — BE2

Hỗ trợ inventory domain bằng:

```text
Unit availability query foundation

Unit locking foundation

Unit status transition rules
```

Xác định transition hợp lệ.

Ví dụ:

```text
AVAILABLE → RESERVED

RESERVED → OCCUPIED

OCCUPIED → INSPECTION

INSPECTION → AVAILABLE
```

Không cho:

```text
OCCUPIED → AVAILABLE
```

trực tiếp nếu business rule yêu cầu inspection.

---

# 10.3. Lê Trí Thiện — BE3

Chuẩn bị business data phục vụ pricing:

```text
Facility + UnitType relationship

Base price placeholder

Facility-specific pricing capability
```

Chuẩn bị query cho:

```text
Facility statistics

Unit count

Available count

Occupied count
```

---

# 10.4. Bùi Tuấn Thanh — FE1

Customer public pages:

```text
Facility List

Facility Detail

Unit Type List

Unit Type Detail
```

Hiển thị:

```text
Unit name

Size

Dimensions

Features

Capacity

Availability

Price placeholder
```

---

# 10.5. Trần Xuân Khoa — FE2 — OWNER

Trang:

```text
Facility List

Create Facility

Edit Facility

Facility Detail
```

Quản lý:

```text
Floor

Zone

Unit Type

Storage Unit

Staff
```

Storage Unit page phải hỗ trợ:

```text
Filter status

Filter floor

Filter zone

Filter unit type

Pagination
```

---

# 10.6. Acceptance Phase 1

```text
Business Manager
↓
Create Facility

Facility Manager
↓
Create Floor
↓
Create Zone
↓
Create Storage Units

Admin/Manager
↓
Assign Staff

Customer
↓
Open Facility
↓
View Unit Types
```

---

# 11. PHASE 2 — PRICING & BUSINESS POLICY

## Backend Owner: Lê Trí Thiện — BE3

---

# 11.1. Lê Trí Thiện — BE3

Entity:

```text
FacilityUnitTypePricing

DepositPolicy

FeePolicy

DiscountPolicy

OverduePolicy
```

Service:

```text
PricingService

PricingResolver

DepositCalculator

DiscountCalculator

FeeCalculator
```

Pricing resolution:

```text
Facility override?
      │
   ┌──┴──┐
 Yes     No
  │       │
  ▼       ▼
Facility  UnitType
Price     Base Price
```

API:

```http
GET /api/v1/facilities/{id}/pricing

POST /api/v1/facilities/{id}/pricing

GET /api/v1/policies

POST /api/v1/policies/deposits

POST /api/v1/policies/fees

POST /api/v1/policies/discounts

POST /api/v1/policies/overdue
```

---

# 11.2. Hồ Xuân Thanh — BE1

Bảo đảm authorization cho pricing.

Ví dụ:

```text
CUSTOMER
→ read price

FACILITY_MANAGER
→ read facility pricing

BUSINESS_OPERATIONS_MANAGER
→ modify pricing

SYSTEM_ADMIN
→ modify pricing
```

---

# 11.3. Bùi Văn Tình — BE2

Implement availability foundation:

```text
Facility

UnitType

Quantity

StartDate

RentalPeriod
```

Query:

```text
How many units are available?
```

Chuẩn bị interface:

```java
AvailabilityService
```

---

# 11.4. Bùi Tuấn Thanh — FE1

Component:

```text
Rental Period Selector

Price Preview

Price Breakdown
```

Hiển thị:

```text
Rental fee

Deposit

Discount

Fee

Total
```

---

# 11.5. Trần Xuân Khoa — FE2

Trang:

```text
Pricing Management

Facility Pricing

Deposit Policy

Fee Policy

Discount Policy

Overdue Policy
```

---

# 11.6. Acceptance Phase 2

Ví dụ:

```text
Medium Base Price
= 1,000,000

Facility A Override
= 1,200,000
```

Customer chọn Facility A:

```text
Price = 1,200,000
```

Customer chọn Facility B:

```text
Price = 1,000,000
```

---

# 12. PHASE 3 — RESERVATION & PAYMENT

Đây là vertical slice quan trọng nhất của MVP.

Backend Owner:

```text
Reservation → BE2
Payment → BE3
Facility/Authorization → BE1
```

Frontend Owner:

```text
Customer Flow → FE1
Internal Monitoring → FE2
```

---

# 12.1. Bùi Văn Tình — BE2 — OWNER RESERVATION

Entity:

```text
Reservation

ReservationItem
```

Reservation status:

```text
PENDING_PAYMENT

CONFIRMED

CANCELLED

EXPIRED

CHECKED_IN
```

Service:

```text
AvailabilityService

ReservationService

ReservationValidator
```

API:

```http
GET /api/v1/facilities/{id}/availability

POST /api/v1/reservations

GET /api/v1/reservations

GET /api/v1/reservations/{id}

POST /api/v1/reservations/{id}/cancel
```

Phải xử lý:

```text
Concurrent reservation

Insufficient availability

Invalid start date

Invalid quantity

Invalid rental period

Reservation expiry
```

---

# 12.2. Lê Trí Thiện — BE3 — OWNER PAYMENT

Entity:

```text
Charge

Payment

PaymentAllocation
```

Implement:

```text
Deposit calculation

Rental calculation

Discount

Fee

Final total
```

API:

```http
GET /api/v1/reservations/{id}/charges

POST /api/v1/reservations/{id}/payments

GET /api/v1/payments/{id}
```

Payment result:

```text
SUCCESS

FAILED

PENDING
```

Rule:

```text
Payment SUCCESS
→ Reservation CONFIRMED
```

Payment fail:

```text
Reservation remains PENDING_PAYMENT
```

---

# 12.3. Hồ Xuân Thanh — BE1

Phụ trách:

```text
Facility validation

Unit Type validation

User authorization

Audit reservation actions
```

Kiểm tra customer chỉ được:

```text
View own reservation

Cancel own reservation
```

---

# 12.4. Bùi Tuấn Thanh — FE1 — OWNER

Xây Reservation Wizard.

### Step 1

```text
Select Facility
```

### Step 2

```text
Select Unit Type
```

### Step 3

```text
Select Quantity
```

### Step 4

```text
Select Start Date
```

### Step 5

```text
Select Rental Period
```

### Step 6

```text
Price Preview
```

### Step 7

```text
Confirm Reservation
```

### Step 8

```text
Payment
```

### Step 9

```text
Confirmation
```

Trang:

```text
My Reservations

Reservation Detail

Cancel Reservation
```

---

# 12.5. Trần Xuân Khoa — FE2

Trang:

```text
Facility Reservations
```

Filter:

```text
Pending

Confirmed

Cancelled

Expired

Date

Customer

Unit Type
```

Reservation Detail phải hiển thị:

```text
Customer

Facility

Items

Amount

Payment

Status

Timeline
```

---

# 12.6. Acceptance Phase 3

Customer:

```text
Facility A

Medium × 2

Large × 1

Start = 01/10/2026

Duration = 3 months
```

System:

```text
Check Availability

↓

Create Reservation

↓

Create ReservationItems

↓

Calculate Pricing

↓

Create Charge

↓

Payment SUCCESS

↓

Reservation CONFIRMED
```

---

# 13. PHASE 4 — CHECK-IN & HANDOVER

## Owner: Bùi Văn Tình — BE2

---

# 13.1. Bùi Văn Tình — BE2

Entity:

```text
CheckInAppointment

UnitAssignment

RentalContract

ContractUnit

HandoverRecord
```

Service:

```text
createAppointment()

assignUnits()

verifyCheckin()

completeHandover()
```

Transaction quan trọng:

```text
Create RentalContract

+

Create ContractUnit

+

Create HandoverRecord

+

StorageUnit → OCCUPIED

+

Reservation → CHECKED_IN
```

Tất cả phải:

```text
COMMIT cùng nhau
```

hoặc:

```text
ROLLBACK cùng nhau
```

---

# 13.2. Hồ Xuân Thanh — BE1

Phụ trách:

```text
Unit locking

StorageUnit status transition

Facility Scope

Staff authorization
```

Staff Facility A không được check-in khách tại Facility B.

---

# 13.3. Lê Trí Thiện — BE3

Phụ trách:

```text
Payment verification

Outstanding charge check

Deposit verification
```

Không cho complete handover nếu:

```text
Required Payment != PAID
```

trừ khi policy cho phép.

---

# 13.4. Trần Xuân Khoa — FE2 — OWNER

Staff pages:

```text
Today's Check-ins

Reservation Detail

Verify Customer

Verify Payment

Assigned Units

Handover Form

Access Card / Key / Code

Complete Handover
```

Manager:

```text
Confirmed Reservations

Assign Unit

Change Assigned Unit

Schedule Check-in
```

---

# 13.5. Bùi Tuấn Thanh — FE1

Customer:

```text
Check-in Appointment

Assigned Unit

Contract Summary

Payment Status

Check-in Status
```

---

# 13.6. Acceptance Phase 4

```text
Manager
↓
Assign Unit A-101

Staff
↓
Verify Customer
↓
Verify Payment
↓
Complete Handover

System
↓
Rental Contract ACTIVE
↓
Unit OCCUPIED
↓
Reservation CHECKED_IN
```

---

# 14. PHASE 5 — RENTED STORAGE UNIT MANAGEMENT

## Owner: Bùi Văn Tình — BE2

---

# 14.1. Bùi Văn Tình — BE2

Implement:

```text
Rental Contract Query

ContractUnit Management

Unit Change Request

Return Request

Unit Inspection
```

API:

```http
GET /api/v1/rentals

GET /api/v1/rentals/{id}

POST /api/v1/rentals/{id}/change-unit

POST /api/v1/rentals/{id}/return

POST /api/v1/returns/{id}/inspect

POST /api/v1/returns/{id}/complete
```

---

# 14.2. Hồ Xuân Thanh — BE1

Phụ trách:

```text
Unit status history

Replacement Unit

Maintenance

Inspection → Available transition
```

---

# 14.3. Lê Trí Thiện — BE3

Phụ trách financial consequence:

```text
Damage fee

Outstanding charge

Final settlement
```

Nếu inspection phát hiện damage:

```text
Inspection
↓
Damage
↓
Fee Calculation
↓
Charge
```

---

# 14.4. Bùi Tuấn Thanh — FE1 — OWNER

Customer:

```text
My Storage Units

Rental Detail

Contract

Payment History

Request Unit Change

Request Return
```

---

# 14.5. Trần Xuân Khoa — FE2

Staff/Manager:

```text
Active Rentals

Return Queue

Inspection Form

Damage Information

Fee Preview

Complete Return
```

---

# 14.6. Acceptance

```text
Customer
↓
Request Return

Staff
↓
Inspection

No Damage
↓
Contract ENDED
↓
Unit INSPECTION
↓
Unit AVAILABLE
```

---

# 15. PHASE 6 — RENEWAL & OVERDUE

## Owner: Lê Trí Thiện — BE3

---

# 15.1. Lê Trí Thiện — BE3

Entity:

```text
RentalRenewal
```

Implement:

```text
Renewal Pricing

Renewal Charge

Grace Period

Overdue Detection

Overdue Fee

Contract Expiry
```

Scheduler:

```text
Find expiring contracts
↓
Check expiry
↓
Check grace period
↓
Mark OVERDUE
↓
Generate Overdue Charge
```

Contract statuses:

```text
ACTIVE

EXPIRING

OVERDUE

ENDED
```

---

# 15.2. Bùi Văn Tình — BE2

Phụ trách:

```text
Contract validation

Contract extension

Rental lifecycle transition
```

Renewal success:

```text
Payment SUCCESS
↓
Update Contract End Date
↓
Contract ACTIVE
```

---

# 15.3. Hồ Xuân Thanh — BE1

Phụ trách:

```text
Facility overdue query

Notification hooks

Access status integration

Audit
```

---

# 15.4. Bùi Tuấn Thanh — FE1 — OWNER

Customer:

```text
Expiry Warning

Renew Rental

Renewal Quote

Renewal Payment

Overdue Information
```

---

# 15.5. Trần Xuân Khoa — FE2

Internal:

```text
Expiring Rentals

Overdue Rentals

Overdue Charges

Customer Details

Overdue Actions
```

---

# 15.6. Acceptance

Scenario 1:

```text
Contract expires
↓
Grace Period
↓
Customer does not renew
↓
OVERDUE
↓
Late Charge
```

Scenario 2:

```text
Customer chooses Renew
↓
Renewal Quote
↓
Payment
↓
Extend End Date
↓
ACTIVE
```

---

# 16. PHASE 7 — SUPPORT REQUEST

## Owner: Lê Trí Thiện — BE3

---

# 16.1. Lê Trí Thiện — BE3

Entity:

```text
SupportRequest

SupportAssignment

SupportComment

SupportAttachment
```

State machine:

```text
OPEN
↓
ASSIGNED
↓
IN_PROGRESS
↓
WAITING_CUSTOMER
↓
RESOLVED
↓
CLOSED
```

Hỗ trợ:

```text
RESOLVED
↓
REOPENED
```

API:

```http
POST /api/v1/support

GET /api/v1/support

GET /api/v1/support/{id}

POST /api/v1/support/{id}/comments

PATCH /api/v1/support/{id}/status

POST /api/v1/support/{id}/assign

POST /api/v1/support/{id}/reopen
```

---

# 16.2. Hồ Xuân Thanh — BE1

Phụ trách:

```text
Facility scope

Staff permission

Attachment security

Audit
```

---

# 16.3. Bùi Văn Tình — BE2

Tích hợp ticket với:

```text
Reservation

Rental

Storage Unit
```

Ví dụ support request có thể liên kết:

```text
reservationId

rentalId

storageUnitId
```

---

# 16.4. Bùi Tuấn Thanh — FE1

Customer:

```text
Create Support Request

My Tickets

Ticket Detail

Comment

Upload Attachment

Reopen Ticket
```

---

# 16.5. Trần Xuân Khoa — FE2

Staff:

```text
Support Queue

Assigned Tickets

Ticket Detail

Update Status

Internal Note

Reply
```

Manager:

```text
Assign Ticket

Facility Tickets

Escalated Tickets
```

---

# 17. PHASE 8 — REPORTING & SYSTEM ADMIN

---

# 17.1. Lê Trí Thiện — BE3 — REPORTING OWNER

Implement:

```text
Revenue

Revenue by Facility

Revenue by Period

Occupancy Rate

Available Units

Occupied Units

Overdue Count

Facility Performance
```

Endpoints:

```http
GET /api/v1/reports/revenue

GET /api/v1/reports/occupancy

GET /api/v1/reports/facilities

GET /api/v1/reports/overdue
```

---

# 17.2. Hồ Xuân Thanh — BE1 — ADMIN OWNER

Implement:

```text
User Management

Lock Account

Unlock Account

Assign Role

Assign Facility

Login History

Audit Log
```

API:

```http
GET /api/v1/admin/users

PATCH /api/v1/admin/users/{id}/status

POST /api/v1/admin/users/{id}/roles

POST /api/v1/admin/users/{id}/facilities

GET /api/v1/admin/audit-logs
```

---

# 17.3. Bùi Văn Tình — BE2

Cung cấp aggregation dữ liệu rental:

```text
Active Rentals

Completed Rentals

Rental Duration

Unit Turnover

Return Statistics
```

cho BE3 Reporting.

---

# 17.4. Trần Xuân Khoa — FE2

Dashboard:

```text
Revenue Dashboard

Occupancy Dashboard

Facility Performance

Overdue Dashboard
```

Admin:

```text
User Management

User Detail

Role Management

Facility Assignment

Audit Logs
```

---

# 17.5. Bùi Tuấn Thanh — FE1

Hoàn thiện Customer Portal:

```text
Dashboard

Reservation History

Rental History

Payment History

Support History

Profile
```

---

# 18. PHASE 9 — INTEGRATION & HARDENING

Phase này:

**Không thêm feature mới.**

---

# 18.1. Hồ Xuân Thanh — BE1

Tập trung:

```text
Authentication

Authorization

RBAC

Facility Scope

Validation

Security

Audit

Access Control
```

Test đặc biệt:

```text
Customer gọi Admin API

Staff truy cập facility khác

Manager sửa facility khác

Expired JWT

Locked Account

Unauthorized Resource Access
```

---

# 18.2. Bùi Văn Tình — BE2

Review:

```text
Reservation Transaction

Availability Race Condition

Unit Lock

Check-in Transaction

Contract State

Return Transaction

Unit State Machine
```

Test concurrent:

```text
2 customer cùng reserve unit cuối cùng
```

Chỉ một request được thành công.

---

# 18.3. Lê Trí Thiện — BE3

Review:

```text
Pricing Accuracy

Payment Idempotency

Duplicate Payment

Renewal Calculation

Overdue Calculation

Reporting Accuracy

Support State Machine
```

Đặc biệt:

```text
Một payment request gửi 2 lần

→ Không được charge 2 lần
```

---

# 18.4. Bùi Tuấn Thanh — FE1

Customer E2E:

```text
Register

Login

Browse Facility

Reserve

Payment

Check-in

Rental

Renewal

Return

Support
```

Fix:

```text
Validation

Loading State

Error State

Empty State

Responsive

Double Submit

Expired Session
```

---

# 18.5. Trần Xuân Khoa — FE2

Internal E2E:

```text
Facility

Inventory

Reservation

Check-in

Rental

Pricing

Overdue

Support

Reporting

Admin
```

Kiểm tra:

```text
Role Navigation

Permission Guard

DataTable

Pagination

Filter

Status Display

Dashboard Data
```

---

# 19. 7 E2E BUSINESS TEST BẮT BUỘC

## E2E-01 — Reservation

Owner:

```text
BE2 + BE3 + FE1
```

Scenario:

```text
Customer
→ Reservation
→ Charge
→ Payment
→ CONFIRMED
```

---

## E2E-02 — Check-in

Owner:

```text
BE2 + BE1 + FE2
```

Scenario:

```text
Manager Assign Unit
→ Staff Verify
→ Handover
→ Contract ACTIVE
→ Unit OCCUPIED
```

---

## E2E-03 — Rental Return

Owner:

```text
BE2 + BE1
FE1 + FE2
```

```text
Customer Request Return
→ Staff Inspection
→ Complete Return
→ Contract ENDED
→ Unit AVAILABLE
```

---

## E2E-04 — Pricing

Owner:

```text
BE3 + FE2 + FE1
```

```text
Manager Change Price
→ Customer sees New Price
→ Reservation uses New Price
→ Revenue reflects New Price
```

---

## E2E-05 — Facility

Owner:

```text
BE1 + FE2
```

```text
Create Facility
→ Floor
→ Zone
→ Unit
→ Assign Staff
```

---

## E2E-06 — Renewal / Overdue

Owner:

```text
BE3 + BE2 + FE1 + FE2
```

```text
Contract expires
→ Renew
```

hoặc:

```text
Contract expires
→ Grace Period
→ OVERDUE
→ Late Fee
```

---

## E2E-07 — Support

Owner:

```text
BE3 + FE1 + FE2
```

```text
Customer Create Ticket
→ Manager Assign
→ Staff Handle
→ Resolve
→ Customer View Result
```

---

# 20. MA TRẬN OWNERSHIP CUỐI CÙNG

| Domain            | Owner                | Reviewer |
| ----------------- | -------------------- | -------- |
| Authentication    | Hồ Xuân Thanh – BE1  | BE2      |
| RBAC              | Hồ Xuân Thanh – BE1  | BE3      |
| Facility          | Hồ Xuân Thanh – BE1  | BE2      |
| Inventory         | Hồ Xuân Thanh – BE1  | BE2      |
| Staff Assignment  | Hồ Xuân Thanh – BE1  | BE3      |
| Availability      | Bùi Văn Tình – BE2   | BE1      |
| Reservation       | Bùi Văn Tình – BE2   | BE3      |
| Check-in          | Bùi Văn Tình – BE2   | BE1      |
| Rental Contract   | Bùi Văn Tình – BE2   | BE3      |
| Return            | Bùi Văn Tình – BE2   | BE1      |
| Pricing           | Lê Trí Thiện – BE3   | BE2      |
| Payment           | Lê Trí Thiện – BE3   | BE2      |
| Renewal           | Lê Trí Thiện – BE3   | BE2      |
| Overdue           | Lê Trí Thiện – BE3   | BE2      |
| Support           | Lê Trí Thiện – BE3   | BE1      |
| Reporting         | Lê Trí Thiện – BE3   | BE2      |
| Customer Frontend | Bùi Tuấn Thanh – FE1 | FE2      |
| Internal Frontend | Trần Xuân Khoa – FE2 | FE1      |

---

# 21. BUSINESS FLOW OWNERSHIP

| Flow             | Backend Owner | Frontend Owner | Reviewer  |
| ---------------- | ------------- | -------------- | --------- |
| Facility & Staff | Hồ Xuân Thanh | Trần Xuân Khoa | BE2       |
| Pricing          | Lê Trí Thiện  | Trần Xuân Khoa | BE1       |
| Reservation      | Bùi Văn Tình  | Bùi Tuấn Thanh | BE3 + FE2 |
| Payment          | Lê Trí Thiện  | Bùi Tuấn Thanh | BE2       |
| Check-in         | Bùi Văn Tình  | Trần Xuân Khoa | BE1       |
| Rental           | Bùi Văn Tình  | Bùi Tuấn Thanh | BE1 + FE2 |
| Renewal          | Lê Trí Thiện  | Bùi Tuấn Thanh | BE2       |
| Overdue          | Lê Trí Thiện  | Trần Xuân Khoa | BE2       |
| Support          | Lê Trí Thiện  | FE1 + FE2      | BE1       |
| Reporting        | Lê Trí Thiện  | Trần Xuân Khoa | BE2       |
| Admin            | Hồ Xuân Thanh | Trần Xuân Khoa | BE3       |

---

# 22. GIT WORKFLOW

Branch:

```text
main
 │
 └── develop
       │
       ├── feature/be1-auth
       ├── feature/be1-facility
       ├── feature/be1-inventory
       │
       ├── feature/be2-reservation
       ├── feature/be2-checkin
       ├── feature/be2-rental
       │
       ├── feature/be3-pricing
       ├── feature/be3-payment
       ├── feature/be3-renewal
       │
       ├── feature/fe1-reservation
       ├── feature/fe1-rental
       │
       └── feature/fe2-facility
```

Không push trực tiếp:

```text
main

develop
```

Quy trình:

```text
feature branch

↓

Pull Request

↓

Review

↓

Automated Test

↓

develop
```

Sau khi hoàn thành một phase:

```text
develop

↓

Integration Test

↓

E2E

↓

main
```

---

# 23. REVIEW RULE

Không cho người viết code tự approve code của mình.

Backend:

```text
BE1 → BE2 hoặc BE3 review

BE2 → BE1 hoặc BE3 review

BE3 → BE1 hoặc BE2 review
```

Frontend:

```text
FE1 → FE2 review

FE2 → FE1 review
```

API thay đổi ảnh hưởng FE:

```text
Backend PR
+
Frontend Owner review contract
```

---

# 24. DEFINITION OF DONE — BACKEND

Một Backend Task chỉ được Done khi có đầy đủ:

```text
Entity

Repository

Service

Controller

DTO

Validation

Authorization

Facility Scope

Error Handling

Transaction nếu cần

Database Migration

Unit Test

Integration Test

API Documentation
```

Không được coi:

```text
"Endpoint chạy được"
```

là Done.

---

# 25. DEFINITION OF DONE — FRONTEND

Frontend Task phải có:

```text
UI

API Integration

Validation

Loading State

Empty State

Error State

Success State

Permission

Responsive

Basic Test
```

Không được coi:

```text
"Giao diện đã vẽ xong"
```

là Done.

---

# 26. DEFINITION OF DONE — BUSINESS FLOW

Flow chỉ Done khi:

```text
Backend PASS

+

Frontend PASS

+

Database PASS

+

Authorization PASS

+

Integration PASS

+

E2E PASS
```

---

# 27. TRÁCH NHIỆM CUỐI CÙNG CỦA TỪNG THÀNH VIÊN

## Hồ Xuân Thanh — BE1

Chịu trách nhiệm cuối cùng cho:

```text
Security
Authentication
Authorization
RBAC
Facility
Inventory
User
Staff Assignment
Audit
```

Nếu có lỗi:

```text
Sai permission
Sai facility scope
Sai unit state
Sai user access
```

BE1 là người chịu trách nhiệm chính.

---

## Bùi Văn Tình — BE2

Chịu trách nhiệm cuối cùng cho:

```text
Availability
Reservation
Check-in
Handover
Rental Contract
Unit Assignment
Return
Rental Lifecycle
```

Nếu có lỗi:

```text
Double reservation

Sai availability

Sai contract state

Sai unit assignment

Return không cập nhật unit
```

BE2 là owner.

---

## Lê Trí Thiện — BE3

Chịu trách nhiệm cuối cùng cho:

```text
Pricing
Payment
Charge
Deposit
Discount
Renewal
Overdue
Support
Reporting
```

Nếu có lỗi:

```text
Sai giá

Sai payment

Duplicate payment

Sai overdue fee

Sai renewal amount

Sai revenue report
```

BE3 là owner.

---

## Bùi Tuấn Thanh — FE1

Chịu trách nhiệm cuối cùng cho toàn bộ Customer Journey:

```text
Register

Login

Browse Facility

Reservation

Payment

Rental

Renewal

Return

Support

Profile
```

Mục tiêu:

> Customer có thể tự hoàn thành toàn bộ nghiệp vụ chính mà không cần thao tác trực tiếp trong database hoặc gọi API thủ công.

---

## Trần Xuân Khoa — FE2

Chịu trách nhiệm cuối cùng cho Internal Operation:

```text
Staff

Facility Manager

Business Manager

System Admin
```

Bao gồm:

```text
Facility

Inventory

Staff

Reservation

Check-in

Rental

Pricing

Overdue

Support

Reporting

Administration
```

Mục tiêu:

> Nhân viên và quản lý có thể vận hành toàn bộ facility từ giao diện hệ thống.

---

# 28. PHÂN CÔNG KIẾN TRÚC TỔNG QUÁT

```text
                         STORAGE MANAGEMENT SYSTEM
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
             BACKEND                             FRONTEND
                │                                   │
       ┌────────┼────────┐                    ┌─────┴─────┐
       │        │        │                    │           │
      BE1      BE2      BE3                  FE1         FE2
       │        │        │                    │           │
   Platform  Rental   Business             Customer    Internal
       │      Flow       │                   Portal      Portal
       │        │        │
     Auth   Reservation Pricing
     RBAC   Check-in    Payment
   Facility Rental      Renewal
  Inventory Return      Overdue
    Audit   Handover    Support
                       Reporting
```

---

# 29. THỨ TỰ TRIỂN KHAI

Không làm module tùy ý.

Thứ tự bắt buộc:

```text
PHASE 0
Foundation

↓

PHASE 1
Facility + Inventory + Staff

↓

PHASE 2
Pricing + Policy

↓

PHASE 3
Reservation + Payment

↓

PHASE 4
Check-in + Handover

↓

PHASE 5
Rental Management + Return

↓

PHASE 6
Renewal + Overdue

↓

PHASE 7
Support

↓

PHASE 8
Reporting + Admin

↓

PHASE 9
Integration + Hardening
```

Lý do:

```text
Facility
↓
Storage Unit
↓
Pricing
↓
Availability
↓
Reservation
↓
Payment
↓
Check-in
↓
Rental
↓
Renewal / Return
```

Mỗi phần phụ thuộc vào phần trước.

---

# 30. QUY TẮC LÀM VIỆC HẰNG NGÀY

Trước khi code:

```text
1. Xác định Task

2. Xác định Owner

3. Chốt API Contract

4. Chốt Business Rule

5. Chốt Acceptance Scenario

6. Tạo Branch

7. Code

8. Test

9. Pull Request

10. Review

11. Integration
```

Không bắt đầu frontend bằng cách đoán API.

Không bắt đầu backend mà chưa xác định business rule.

Không merge nếu:

```text
Test fail

API contract sai

Authorization thiếu

Validation thiếu

Business flow chưa chạy
```

---

# 31. QUY TẮC CHỐNG BOTTLENECK CHO NHÓM 5 NGƯỜI

Không để:

```text
BE hoàn thành toàn bộ
↓
FE mới bắt đầu
```

Phải làm:

```text
             API CONTRACT
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
      Backend          Frontend
          │               │
          └───────┬───────┘
                  ▼
             Integration
                  ▼
                 E2E
```

Ví dụ Reservation:

```text
Ngày bắt đầu flow

BE2
→ Reservation contract

BE3
→ Payment contract

FE1
→ Mock Reservation Wizard

FE2
→ Mock Manager Reservation Page
```

Sau đó mới tích hợp API thật.

---

# 32. INTEGRATION CAPTAIN

Nhóm hiện có 5 người nhưng không có QA riêng.

Vì vậy mỗi phase phải chỉ định một **Integration Captain**.

Không phải người viết phần lớn code của phase đó.

Đề xuất:

```text
Phase 0 → Trần Xuân Khoa

Phase 1 → Bùi Văn Tình

Phase 2 → Hồ Xuân Thanh

Phase 3 → Trần Xuân Khoa

Phase 4 → Lê Trí Thiện

Phase 5 → Hồ Xuân Thanh

Phase 6 → Bùi Văn Tình

Phase 7 → Trần Xuân Khoa

Phase 8 → Bùi Văn Tình

Phase 9 → cả nhóm
```

Integration Captain chịu trách nhiệm:

```text
Kiểm tra API contract

Kiểm tra FE-BE integration

Chạy acceptance scenario

Ghi bug

Xác nhận phase PASS/BLOCKED
```

Integration Captain **không có nghĩa là tự sửa toàn bộ bug**.

Bug thuộc domain nào thì trả về đúng owner của domain đó.

---

# 33. TIÊU CHÍ HOÀN THÀNH DỰ ÁN

Dự án chỉ được coi là hoàn thành khi:

```text
Authentication PASS

RBAC PASS

Facility Scope PASS

7 Business Flow PASS

Customer Portal PASS

Internal Portal PASS

Payment Idempotency PASS

Transaction PASS

Authorization PASS

Database Migration PASS

E2E PASS
```

Và phải demo được chuỗi hoàn chỉnh:

```text
Admin
→ Setup system

Business Manager
→ Setup Facility + Pricing

Facility Manager
→ Setup Units + Staff

Customer
→ Reservation + Payment

Manager
→ Assign Unit

Staff
→ Check-in + Handover

Customer
→ Manage Rental

Customer
→ Renewal hoặc Return

Staff
→ Complete Return

Business Manager
→ View Report
```

Nếu chuỗi này chạy xuyên suốt:

```text
Frontend
→ API
→ Business Service
→ Database
→ Response
→ Frontend
```

thì hệ thống mới đạt mức MVP hoàn chỉnh.
