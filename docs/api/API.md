# API Contract

Base URL: `/api/v1`  
Content type: `application/json`

Endpoint có nhãn **Implemented** đã có controller trong mã nguồn. Endpoint **Planned** là contract phải được giữ khi triển khai các module còn lại.

## Xác thực và phản hồi

Các endpoint private gửi header:

```http
Authorization: Bearer <access-token>
```

Phản hồi thành công:

```json
{ "success": true, "message": "Success", "data": {} }
```

Phản hồi lỗi:

```json
{ "success": false, "error": { "code": "UNIT_NOT_AVAILABLE", "message": "Storage unit is not available" } }
```

Roles: `CUSTOMER`, `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`.

## Account

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Implemented |
| POST | `/auth/login` | Public | Implemented |
| GET | `/auth/me` | Authenticated | Implemented |
| POST | `/auth/refresh` | Public | Planned |

### Register

```http
POST /api/v1/auth/register
```

```json
{ "email": "customer@example.com", "password": "password123", "fullName": "Nguyễn Văn A", "phone": "0900000000" }
```

### Login

```json
{ "email": "customer@example.com", "password": "password123" }
```

Response của register/login:

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": "uuid", "email": "customer@example.com", "fullName": "Nguyễn Văn A",
      "phone": "0900000000", "role": "CUSTOMER", "assignedFacilityId": null, "status": "ACTIVE"
    }
  }
}
```

## Facility

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| GET | `/facilities` | Public | Implemented |
| GET | `/facilities/{facilityId}` | Public | Implemented |
| GET | `/facilities/{facilityId}/unit-types` | Public | Implemented |
| GET | `/facilities/{facilityId}/available-units` | Public | Implemented |
| POST | `/business/facilities` | BUSINESS_MANAGER, ADMIN | Implemented |
| PUT | `/business/facilities/{id}` | BUSINESS_MANAGER, ADMIN | Implemented |
| POST | `/business/unit-types` | BUSINESS_MANAGER, ADMIN | Implemented |
| GET | `/manager/facilities/{facilityId}/units` | FACILITY_MANAGER scope | Implemented |
| POST | `/manager/facilities/{facilityId}/units` | FACILITY_MANAGER scope | Implemented |
| PUT | `/manager/units/{id}/status` | FACILITY_MANAGER scope | Implemented |

### Create/Update facility

```json
{
  "name": "Kho Quận 7",
  "address": "Quận 7, TP.HCM",
  "phone": "0280000000",
  "description": "Cơ sở lưu trữ phía Nam",
  "status": "ACTIVE"
}
```

### Create unit type

```json
{
  "name": "SMALL",
  "width": 1.0,
  "length": 1.0,
  "height": 2.0,
  "description": "Kho nhỏ",
  "minMonthlyPrice": 500000,
  "maxMonthlyPrice": 800000
}
```

### Create storage unit

```json
{
  "code": "Q7-A-001",
  "unitTypeId": "uuid",
  "floor": "Tầng 1",
  "location": "Dãy A",
  "monthlyPrice": 650000
}
```

`monthlyPrice` phải nằm trong khoảng `minMonthlyPrice` đến `maxMonthlyPrice`. `StorageUnit.status` nhận: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `INSPECTION`, `MAINTENANCE`, `UNAVAILABLE`.

## Rental

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| POST | `/reservations` | CUSTOMER | Planned |
| GET | `/reservations/my` | CUSTOMER | Planned |
| GET | `/reservations/{id}` | Owner/Manager | Planned |
| PUT | `/reservations/{id}/cancel` | CUSTOMER | Planned |
| GET | `/manager/reservations` | FACILITY_MANAGER | Planned |
| PUT | `/manager/reservations/{id}/confirm` | FACILITY_MANAGER | Planned |
| PUT | `/manager/reservations/{id}/assign-unit` | FACILITY_MANAGER | Planned |
| GET | `/contracts/my` | CUSTOMER | Planned |
| GET | `/contracts/{id}` | Owner/Manager | Planned |
| POST | `/contracts/{id}/renew` | CUSTOMER | Planned |
| GET | `/manager/contracts` | FACILITY_MANAGER | Planned |
| POST | `/manager/contracts/{id}/check-in` | FACILITY_MANAGER, FACILITY_STAFF | Planned |
| POST | `/manager/contracts/{id}/check-out` | FACILITY_MANAGER, FACILITY_STAFF | Planned |

Create reservation body:

```json
{ "facilityId": "uuid", "unitTypeId": "uuid", "preferredStartDate": "2026-10-01", "rentalMonths": 3 }
```

Manager assign unit body:

```json
{ "storageUnitId": "uuid" }
```

## Payment

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| GET | `/payments/my` | CUSTOMER | Planned |
| GET | `/contracts/{contractId}/charges` | Customer/Manager | Planned |
| POST | `/charges/{chargeId}/payments` | CUSTOMER/Staff | Planned |
| POST | `/payments/online/create` | CUSTOMER | Planned |
| GET | `/payments/online/callback` | Payment provider | Planned |

Payment body:

```json
{ "amount": 650000, "method": "BANK_TRANSFER", "transactionReference": "BANK-123" }
```

Charge type: `DEPOSIT`, `RENT`, `RENEWAL`, `EXTRA`, `OVERDUE`. Payment method: `CASH`, `BANK_TRANSFER`, `ONLINE`.

## Support

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| POST | `/support-tickets` | CUSTOMER | Planned |
| GET | `/support-tickets/my` | CUSTOMER | Planned |
| GET | `/support-tickets/{id}` | Owner/Assigned staff/Manager | Planned |
| GET | `/manager/support-tickets` | FACILITY_MANAGER | Planned |
| PUT | `/manager/support-tickets/{id}/assign` | FACILITY_MANAGER | Planned |
| GET | `/staff/support-tickets` | FACILITY_STAFF | Planned |
| PUT | `/staff/support-tickets/{id}/start` | FACILITY_STAFF | Planned |
| PUT | `/staff/support-tickets/{id}/resolve` | FACILITY_STAFF | Planned |

## Management and Admin

| Method | Path | Access | Status |
| --- | --- | --- | --- |
| GET/PUT | `/business/rental-policy` | BUSINESS_MANAGER | Planned |
| GET/POST | `/business/fee-policies` | BUSINESS_MANAGER | Planned |
| PUT | `/business/fee-policies/{id}` | BUSINESS_MANAGER | Planned |
| GET | `/admin/users` | ADMIN | Planned |
| POST | `/admin/users` | ADMIN | Planned |
| PUT | `/admin/users/{id}` | ADMIN | Planned |
| PUT | `/admin/users/{id}/role` | ADMIN | Planned |
| PUT | `/admin/users/{id}/facility` | ADMIN | Planned |
| PUT | `/admin/users/{id}/status` | ADMIN | Planned |
| GET | `/admin/activity-logs` | ADMIN | Planned |

## Pagination

List có phân trang sử dụng `page` (zero-based) và `size` (1–100). Ví dụ:

```text
GET /api/v1/facilities/{facilityId}/available-units?page=0&size=20&unitTypeId={uuid}
```
