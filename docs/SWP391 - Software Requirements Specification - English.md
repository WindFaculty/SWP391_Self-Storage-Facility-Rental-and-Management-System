# FPT UNIVERSITY

# SOFTWARE REQUIREMENTS SPECIFICATION
## SWP391 - Self-Storage Facility Rental & Management System

- **Course:** SWP391 | **Group code:** SWP391-G01 *(update the official class/group code before submission)* | **Document version:** v1.0
- **Document status:** Draft (cross-checked against integrated codebase `2ccd920`)

| Document Control | Value |
|---|---|
| **Document Owner** | Trần Xuân Khoa - Full-Stack Integration Lead / FE1 & DevOps |
| **Prepared by** | Bùi Văn Tình (BE1 - Account, Facility, Security, Audit)<br>Hồ Xuân Thanh (BE2 - Rental Lifecycle, Concurrency, Operations)<br>Lê Trí Thiện (BE3 - Billing, VNPay Payment, Support, Policy & Reports)<br>Trần Xuân Khoa (FE1 - Customer Portal, OAuth2/Cookie Auth, CI/CD & Infrastructure)<br>Bùi Tuấn Thanh (FE2 - Internal Workspace, Role Dashboards, E2E QA) |
| **Reviewer / Supervisor** | SWP391 course supervisor *(enter the supervisor's full name when submitting for signature)* |
| **Issued Date** | 02/11/2026 |
| **Related Project Repository** | https://github.com/WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System.git |

> **Document governance note:** This document was prepared by examining the actual Backend (`Spring Boot 4.1.1 / Java 25`), Frontend (`React 19 / TypeScript / Vite`), database schema (`MySQL 8.4 / Flyway V001-V010`), and project Git history up to commit `2ccd920`. Items requiring further operational confirmation or UI alignment are explicitly recorded in Section 3.5 and Appendix 5.4 before formal approval.

---

# RECORD OF CHANGE

| Effective Date | Changed Section | A / M / D | Change Description (Cross-checked against Project Git History) | New Version |
|---|---|---|---|---|
| 09/09/2026 | Project initialization | A | Initialized the source repository and the Spring Boot & React Vite architecture (`b4d37fc`, `f72d10d`). | v0.1 |
| 10/10/2026 | Chapters 2 and 3 | M | Finalized Development Plan V2 (`db73845`), the Stitch UI audit (`FE1-01`, `FE2-01`), and the routing framework for five roles. | v0.3 |
| 11/10/2026 | Sections 3.3, 3.7, 3.9, 5.1 | M | Integrated Backend modules BE1 (`104004e`), BE2 (`727b938`), BE3 (`55990f3`), consolidated Flyway schema `V001-V008`, and integrated VNPay (`7ae7a68`). | v0.6 |
| 11/10/2026 | Sections 3.5, 4.6, 5.2 | M | Added Google OAuth2/OIDC login (PKCE) and session authentication through HttpOnly Cookies + CSRF (`17f1be1`, migrations `V009-V010`). | v0.8 |
| 18/10/2026 | Chapter 4 | M | Completed the GitHub Actions CI/CD pipeline, Cloudflare Pages deployment, and AWS EC2 + Caddy HTTPS staging infrastructure (`b579d0a`, `4306891`). | v0.9 |
| 02/11/2026 | Entire document (Chapters 1-5) | M | Completed the Vietnamese SRS and UML 2.5 / DFD / ERD diagram specifications based on the current codebase (`2ccd920`). | v1.0 |

*(Legend: `A` = Added, `M` = Modified, `D` = Deleted.)*

---

# SIGNATURE PAGE

| Role | Name / Position | Signature | Date |
|---|---|---|---|
| **Originator** | Trần Xuân Khoa - SWP391 Development Team Representative | *(Pending signature)* | 02/11/2026 |
| **Technical Reviewer** | Bùi Văn Tình (BE Lead) & Lê Trí Thiện (Integration Lead) | *(Pending signature)* | 02/11/2026 |
| **Approver** | SWP391 Supervisor - FPT University | *(Pending signature)* | ../../2026 |

---

# DOCUMENT GUIDELINES

- Preserve the five main chapters required by FPT University's SWR302 template.
- Maintain stable, consistent identifiers for Use Cases (`UC-xxx`), Business Processes (`BP-xx`), Screens (`SCR-xxx`), Non-Screen Functions (`NFN-xxx`), Non-Functional Requirements (`NFR-x.x-xx`), Business Rules (`BR-xxx`), Common Requirements (`CR-xxx`), Application Messages (`MSG/ERR/WARN/INFO-xxx`), and data entities.
- All rules, states, and data flows reflect behavior verifiable in the current source code. Do not claim acceptance of out-of-scope features such as automated SMS/email, digitally signed PDF contracts, or automatic refunds through payment gateway APIs.
- Include at least three detailed Use Case specifications (five core specifications are provided, with UML sequence diagram specifications), five UML State Machine Diagrams, and four Level-1 DFDs.

---

# TABLE OF CONTENTS

1. **INTRODUCTION**
   - 1.1 Purpose
   - 1.2 Definitions and Acronyms
   - 1.3 References
2. **OVERALL DESCRIPTION**
   - 2.1 Product Perspective
   - 2.2 Business Processes - Swimlanes
   - 2.3 User Classes and Characteristics
3. **FUNCTIONAL REQUIREMENTS**
   - 3.1 UML Use Case Diagrams
   - 3.2 Use Case Summary Table
   - 3.3 Use Case Specifications and UML Sequence Diagrams
   - 3.4 Screen Flows and Screen Descriptions
   - 3.5 Screen and API Authorization Matrix
   - 3.6 Non-Screen Functions
   - 3.7 UML State Diagrams
   - 3.8 Level-1 Data Flow Diagrams
   - 3.9 Data Models and Entity Descriptions
4. **NON-FUNCTIONAL REQUIREMENTS**
   - 4.1 Usability
   - 4.2 Reliability
   - 4.3 Performance
   - 4.4 Reusability
   - 4.5 Scalability
   - 4.6 External Interfaces
5. **SUPPORTING INFORMATION**
   - 5.1 Business Rules Catalog
   - 5.2 Common Requirements
   - 5.3 Application Messages and Error Codes
   - 5.4 Appendices and Supporting Evidence

---

# 1. INTRODUCTION

## 1.1 Purpose

This Software Requirements Specification (SRS) comprehensively defines the functional requirements, non-functional requirements, data models, security constraints, and business rules for the **Self-Storage Facility Rental & Management System**, developed for the **SWP391** course at **FPT University**.

- **System version scope (v1.0):** A web application for multiple roles, comprising a self-service Customer Portal and an Internal Operations Workspace, connected to a central RESTful API (`/api/v1`). It manages the complete self-storage rental lifecycle: date-based availability searches, atomic holds preventing double-booking, online VNPay payments, check-in handover, contract renewal, check-out requests, physical unit inspection, support tickets, business policy configuration, user administration, and audit logs.
- **Intended readers:**
  - **SWP391 Supervisor and Project Assessment Panel:** Assess the completeness, rigor, and consistency of business design and compare it with actual product acceptance.
  - **Backend developers (`BE1`, `BE2`, `BE3`):** Reference the MySQL schema, API contracts, state machines, concurrency locks, and payment gateway integration.
  - **Frontend developers (`FE1`, `FE2`):** Develop screen flows, form validation, UI states, and role-based navigation controls.
  - **QA / Testers:** Develop integration tests (Testcontainers MySQL), end-to-end tests (Playwright E2E), and standardized error-code checks.
- **Verifiability criteria:** Each requirement has a unique identifier and an observable outcome through HTTP status codes, database record states, activity log events (`activity_logs`), or UI behavior.

## 1.2 Definitions and Acronyms

| Term / Acronym | Definition | Project Source / Notes |
|---|---|---|
| **SRS** | Software Requirements Specification. | SWR302 template - FPT University |
| **UC / FR / NFR** | Use Case / Functional Requirement / Non-Functional Requirement. | IEEE 830 / SWR302 |
| **BR / CR** | Business Rule / Common Requirement. | Sections 5.1 and 5.2 |
| **Self-Storage** | Rental of separate storage units at physical facilities for monthly terms, with individual access methods (`KEY`, `ACCESS_CARD`, `ACCESS_CODE`). | Core SWP391 business domain |
| **Facility** | A physical storage branch (e.g., `DEMO-HCM-01`, `FAC-HAN-01`) containing storage units and its assigned operations personnel. | `facilities` table |
| **Unit Type** | A system-wide unit classification by area (`size_m2`) and minimum/maximum monthly rental prices (`min_monthly_price`, `max_monthly_price`). | `unit_types` table |
| **Storage Unit** | A specific physical unit at a facility, identified by a `unit_code` unique within that facility and having its own physical status. | `storage_units` table |
| **Atomic Hold** | A 15-minute hold (`PENDING_PAYMENT`): the system locks a unit row using `SELECT ... FOR UPDATE` (`PESSIMISTIC_WRITE`), immediately assigns the specific unit, and issues an initial invoice. | `RentalService.createHold` (BR-002, BR-003) |
| **Half-open interval `[start_date, end_date)`** | The rental term includes `start_date` and excludes `end_date`; the next customer may start on that exact end date. | `Rental.overlaps` (BR-001) |
| **VNPay IPN** | Instant Payment Notification: a server-to-server callback (`GET /api/v1/payments/vnpay/ipn`) signed with `HMAC-SHA512`, serving as the sole source of truth for payment confirmation. | `VnPayIpnService` (BR-009) |
| **Return URL** | The browser return path after a VNPay transaction (`/api/v1/payments/vnpay/return` -> `/payment/result`); used only for display, without settling invoices. | `VnPayController` |
| **Handover (Check-in)** | Facility staff hand over the unit and access method for a `RESERVED` rental, changing the rental to `ACTIVE` and the unit to `OCCUPIED`. | `OpsService.completeHandover` |
| **Return & Inspection (Check-out)** | Staff recover the unit (`RETURNED`) and place it under `INSPECTION` before making it `AVAILABLE` again or placing it under `MAINTENANCE`. | `OpsService.completeReturn`, `completeUnitInspection` |
| **RBAC & Facility Scope** | Role-based authorization combined with assigned-facility scope (`facility_id`) and record ownership (`customer_id`). | `SecurityConfig`, `FacilityAccessService` |
| **OIDC / PKCE** | OpenID Connect with Proof Key for Code Exchange: secure social authentication using Google OAuth 2.0. | `SecurityConfig`, `GoogleAccountService` |
| **SPA** | Single-Page Application built with React 19, TypeScript, and Vite. | `frontend/` directory |

## 1.3 References

| Reference ID | Document / Link | Version / Date | Purpose |
|---|---|---|---|
| **REF-01** | SWR302 Software Requirements Specification Template - FPT University | Fall 2026 semester | Standard five-chapter SRS structure |
| **REF-02** | Project development plan `SWP391_Development_Plan_V2.md` | v2.0 - 10/10/2026 | Architecture decisions (C01-C10), module assignments, and technical invariants |
| **REF-03** | Frontend architecture and flows `FE_Architecture_And_Flows.html` | v1.0 - 31/10/2026 | SPA routing, UI flows for five roles, and API connections |
| **REF-04** | Authentication Token Strategy `docs/architecture/adr-0001-authentication-token-strategy.md` & `docs/social-login.md` | 10-11/10/2026 | Rotating JWT Access/Refresh tokens, HttpOnly Cookies, CSRF, and Google OIDC |
| **REF-05** | VNPay PAY v2.1.0 integration documentation (`https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html`) & `docs/api/vnpay-integration.md` | v2.1.0 - 10/2026 | Payment parameters, HMAC-SHA512 signatures, and IPN response codes |
| **REF-06** | Flyway MySQL schema (`backend/src/main/resources/db/migration/mysql/V001..V010`) | V001-V010 - 10/2026 | Executable source of truth for the physical data model, foreign keys, and integrity constraints |
| **REF-07** | API E2E test report `docs/api/e2e-test-report-2026-10-11.md` | 11/10/2026 | Testcontainers MySQL integration test evidence and exception handling acceptance |

---

# 2. OVERALL DESCRIPTION

## 2.1 Product Perspective

In a multi-branch self-storage business, the core challenge is to synchronize **date-based inventory** (`[start_date, end_date)`), the **actual physical status of each unit**, and **financial payment status** in real time. Disconnected spreadsheets or manual confirmation can cause double-booking, unpaid phantom holds and lost revenue, handovers before full rent/deposit collection, or re-listing returned units before damage inspection.

The **Self-Storage Facility Rental & Management System** is an independent, greenfield product using a **Modular Monolith Backend + Single-Page Web Application Frontend**, providing a centralized transaction and operations platform for the entire storage network.

1. **System boundaries:**
   - **Inside the system:**
     - **Web Frontend (`React 19 + TypeScript + Vite`):** Two separate experiences in one SPA: the *Customer Portal* (`PublicLayout` for guests and customers) and *Internal Workspace* (`WorkspaceLayout` for four internal roles).
     - **REST API Backend (`Spring Boot 4.1.1 / Java 25`):** Business modules (`account`, `facility`, `rental`, `ops`, `payment`, `support`, `management`, `shared`), JWT/Cookie + CSRF authentication, RBAC/facility scope, pessimistic booking locks, and payment webhooks.
     - **Relational database (`MySQL 8.4 InnoDB`):** Centralized management of 15 transactional/audit tables with automatic schema versioning through **Flyway**.
   - **External dependencies:**
     - **VNPay (Sandbox/Gateway v2.1.0):** Customer domestic/international card and QR payments, communicating through browser redirects (`ReturnUrl`) and server-to-server notifications (`IPN URL`).
     - **Google OAuth 2.0 / OIDC:** Secure one-click registration/login using Authorization Code Flow with PKCE.
     - **Cloud infrastructure:** Static Frontend delivery through **Cloudflare Pages**; application server, **Caddy HTTPS** reverse proxy, and MySQL in Docker Compose on **AWS EC2**, with encrypted EBS and scheduled `mysqldump` backups.
   - **Outside v1.0 scope:** Automated SMS/email gateways, tax-authority-connected VAT e-invoices, digitally signed PDF contracts, real-time IoT/smart locks, and automatic bank refund API calls. Refunds are tracked manually with audit records.

### 1. System Context Diagram (`CTX-01`)

> **[Insert Diagram #1 - System Context Diagram (`CTX-01`) here]**
> - **Diagram type:** System Context Diagram / UML Context Diagram.
> - **Required content:**
>   - **Central system boundary:** `Self-Storage Facility Rental & Management System (SWP391)`.
>   - **Six user actors:**
>     1. `Guest`: Requests facility, unit type, and term-based availability searches.
>     2. `CUSTOMER`: Registers/logs in, creates holds, renews, requests returns, and opens support tickets; receives rental, invoice, booking-result, and ticket-status information.
>     3. `FACILITY_STAFF`: Receives daily tasks, performs check-in handovers, check-out returns, unit inspections, and ticket handling.
>     4. `FACILITY_MANAGER`: Creates/edits units and their status, views facility dashboards, and assigns tasks and tickets.
>     5. `BUSINESS_MANAGER`: Manages the facility network, seven business policy parameters and fee types, chain reports, and CSV exports.
>     6. `ADMIN`: Manages accounts, roles and `facility_id` scope, disables/restores accounts, and searches audit logs.
>   - **Two external systems:**
>     1. `VNPay Payment Gateway v2.1.0`: Receives `HMAC-SHA512`-signed payment URLs (`vnp_TxnRef`, `vnp_Amount`); returns transaction-confirming IPN webhooks and browser redirects.
>     2. `Google Identity Platform (OAuth 2.0 / OIDC + PKCE)`: Receives OAuth2 Authorization Code + PKCE requests; returns verified ID Token information (`sub`, `email`, `profile`).

### 2. Component & Deployment Diagram (`ARCH-01`)

> **[Insert Diagram #2 - UML Component & Deployment Diagram (`ARCH-01`) here]**
> - **Diagram type:** Combined UML Deployment & Component Diagram.
> - **Required content:**
>   - **Node 1 - Client Browser (Desktop/Tablet/Mobile):** The React 19 SPA's `Customer Portal SPA (PublicLayout)` and `Internal Workspace SPA (WorkspaceLayout)`.
>   - **Node 2 - Cloudflare Pages (Edge CDN):** Delivers `frontend/dist` static assets to browsers.
>   - **Node 3 - AWS EC2 Staging Host (Amazon Linux 2023 + Docker Compose):**
>     - `Caddy 2 Reverse Proxy`: HTTPS port 443, automatic TLS certificates, forwarding `/api/v1/*` to internal port `:8080`.
>     - `Spring Boot 4.1.1 Modular Monolith (Java 25)`: A `Security & Auth Filter (JWT + HttpOnly Cookie + CSRF + OIDC)` before five business module groups: `account & admin`, `facility & catalog`, `rental & ops`, `payment & vnpay`, `support & management`.
>     - `MySQL 8.4 InnoDB (EBS gp3)`: Fifteen tables versioned through Flyway `V001-V010`, backed up daily by `backup-mysql.sh`.
>   - **External node - Third-party cloud services:** Bidirectional HTTPS connections between `payment & vnpay` and `VNPay Sandbox Gateway`, and between the `Security Filter` and `Google OAuth2 / OIDC`.

---

## 2.2 Business Processes - Swimlanes

The system operates around three interconnected end-to-end business processes, modeled using **UML 2.5 Activity Diagrams with Swimlane Partitions**.

| Process ID | Business Process | Actors / Lanes | Related Use Cases |
|---|---|---|---|
| **BP-01** | Booking, atomic hold, VNPay payment, and check-in handover | `CUSTOMER`, `System Backend`, `VNPay Gateway`, `FACILITY_MANAGER`, `FACILITY_STAFF` | `UC-004`, `UC-005`, `UC-006`, `UC-007`, `UC-008`, `UC-012`, `UC-017` |
| **BP-02** | Renewal, return request, check-out, and unit inspection | `CUSTOMER`, `System Backend`, `VNPay Gateway`, `FACILITY_STAFF`, `FACILITY_MANAGER` | `UC-008`, `UC-010`, `UC-011`, `UC-013`, `UC-014`, `UC-017` |
| **BP-03** | Support ticket intake, assignment, and resolution | `CUSTOMER`, `System Backend`, `FACILITY_MANAGER`, `FACILITY_STAFF` | `UC-015`, `UC-018`, `UC-019`, `UC-020` |

### 3. Swimlane `BP-01`: Booking, Atomic Hold, VNPay Payment & Check-in Handover

> **[Insert Diagram #3 - UML Activity Diagram with Swimlanes (`BP-01`) here]**
> - **Diagram type:** UML Activity Diagram with five swimlanes: `CUSTOMER`, `SYSTEM BACKEND`, `VNPAY GATEWAY`, `FACILITY_MANAGER`, `FACILITY_STAFF`.
> - **Required flow:**
>   1. **CUSTOMER:** Select facility, unit type, start date, and rental months -> accept terms and submit a hold request.
>   2. **SYSTEM BACKEND:** Expire holds older than 15 minutes (`expireStaleHolds`) -> find the cheapest available candidate and lock its row with `SELECT ... FOR UPDATE`.
>      - *No units:* Return `400 BAD_REQUEST`, allowing another selection.
>      - *Lock acquired:* Assign `unit_id`; create `Rental(PENDING_PAYMENT, +15 minutes)` and `Invoice(RENTAL, PENDING)` for rent + deposit.
>   3. **Customer decision during the hold:**
>      - *Cancel:* Cancel the hold -> Backend sets `Rental -> CANCELLED`, `Invoice -> EXPIRED`, releases the schedule -> End.
>      - *No payment after 15 minutes:* Backend sets `Rental -> EXPIRED`, `Invoice -> EXPIRED` -> End.
>      - *Pay with VNPay:* Backend creates `PaymentAttempt(PENDING)` and an `HMAC-SHA512`-signed URL.
>   4. **VNPAY GATEWAY:** Process card/QR payment -> send IPN webhook and redirect the customer's browser to the Return URL.
>   5. **SYSTEM BACKEND (IPN validation):**
>      - *Failed transaction:* Set `PaymentAttempt -> FAILED`; leave `Invoice(PENDING)` for retry.
>      - *Late payment after hold expiry:* Record `PaymentAttempt -> SUCCESS` for manual refund reconciliation; retain `Rental(EXPIRED)` -> End.
>      - *Valid success:* Atomically set `PaymentAttempt -> SUCCESS`, `Invoice -> PAID`, `Rental -> RESERVED`.
>   6. **FACILITY_MANAGER:** View the `RESERVED` rental -> assign `StaffTask(HANDOVER)` to facility staff.
>   7. **FACILITY_STAFF and CUSTOMER:** Customer arrives -> staff inspect the unit, provide `KEY` / `ACCESS_CARD` / `ACCESS_CODE`, and confirm handover -> Backend sets `StaffTask -> DONE`, `Rental -> ACTIVE`, `StorageUnit -> OCCUPIED` -> End.

### 4. Swimlane `BP-02`: Contract Renewal, Check-out & Unit Inspection

> **[Insert Diagram #4 - UML Activity Diagram with Swimlanes (`BP-02`) here]**
> - **Diagram type:** UML Activity Diagram with five swimlanes: `CUSTOMER`, `SYSTEM BACKEND`, `VNPAY GATEWAY`, `FACILITY_MANAGER`, `FACILITY_STAFF`.
> - **Start:** The customer's rental is `ACTIVE` or `OVERDUE`.
> - **Flow A - Renewal:**
>   1. `CUSTOMER` selects `additionalMonths` and submits the request.
>   2. `SYSTEM BACKEND` checks for another rental in `[endDate, newEndDate)` and whether the unit is under `INSPECTION`/`MAINTENANCE`.
>      - *Conflict:* Return `400`, reject renewal -> End.
>      - *No conflict:* Create `RentalRenewal(REQUESTED)` and `Invoice(RENEWAL, PENDING, deposit = 0)`.
>   3. `CUSTOMER` pays the `RENEWAL` invoice through `VNPAY GATEWAY`.
>   4. On successful IPN (`00`), Backend sets `Invoice -> PAID`, `RentalRenewal -> APPLIED`, and `rental.end_date = requested_end_date` -> End.
> - **Flow B - Return & Unit Inspection:**
>   1. `CUSTOMER` selects a return appointment (`requestedDate >= startDate`) and submits a return request.
>   2. Backend sets `Rental -> RETURN_REQUESTED` and automatically creates `StaffTask(RETURN_INSPECTION)` for on-duty facility staff.
>   3. Customer removes belongings and returns keys/cards to staff.
>   4. Staff inspect the premises, enter return-condition notes, and confirm return -> Backend sets `Rental -> RETURNED`, `StaffTask -> DONE`, `StorageUnit -> INSPECTION`.
>   5. Manager creates/assigns `StaffTask(UNIT_INSPECTION)` for technical inspection of the unit under `INSPECTION`.
>   6. Staff check cleanliness, doors, locks, and partitions, then submit the result:
>      - *PASS:* Set `StorageUnit -> AVAILABLE` (re-list in catalog) -> End.
>      - *FAIL:* Set `StorageUnit -> MAINTENANCE` (block booking pending repair) -> End.

### 5. Swimlane `BP-03`: Support Ticket Intake, Assignment & Resolution

> **[Insert Diagram #5 - UML Activity Diagram with Swimlanes (`BP-03`) here]**
> - **Diagram type:** UML Activity Diagram with four swimlanes: `CUSTOMER`, `SYSTEM BACKEND`, `FACILITY_MANAGER`, `FACILITY_STAFF`.
> - **Required flow:**
>   1. **CUSTOMER:** Select the rental, incident category (`UNIT`, `LOCK`, `ACCESS`, `PAYMENT`, `ITEMS`, `OTHER`), enter a title and detailed description, and submit a ticket.
>   2. **SYSTEM BACKEND:** Save `SupportTicket(status = OPEN)` with `facility_id`; write `ActivityLog(SUPPORT_TICKET_CREATED)`.
>   3. **FACILITY_MANAGER (or FACILITY_STAFF self-assignment):** View facility tickets -> assign a responsible staff member.
>   4. **SYSTEM BACKEND:** Update `assigned_staff_id`; create `StaffTask(taskType = SUPPORT, status = ASSIGNED)`.
>   5. **FACILITY_STAFF:** Start processing (`IN_PROGRESS`), investigate and fix the incident on site -> record resolution (`RESOLVED`).
>   6. **FACILITY_MANAGER / SYSTEM BACKEND:** Confirm ticket closure (`CLOSED`), complete `StaffTask(DONE)` -> customer views updated progress in the Support Portal -> End.

---

## 2.3 User Classes and Characteristics

The system serves **five authenticated roles**, defined by enum `UserRole` and the `users.ck_users_role` constraint, plus unauthenticated **Guests**, who may only search the public catalog.

| Role | Primary Goals | Usage Characteristics & Authorization Constraints |
|---|---|---|
| **CUSTOMER** | Individuals or small businesses seeking storage: search date-based availability, create holds, pay VNPay invoices, track rentals, renew, request returns, and open support tickets. | General technical proficiency; frequent mobile/desktop use through responsive `PublicLayout`. Self-registers using email/password or Google OAuth2. DB: `facility_id IS NULL`. May access only rentals, invoices, payments, and tickets belonging to their `customer_id`. Blocked from `/facility/*`, `/staff/*`, `/operations/*`, `/admin/*` (`403 FORBIDDEN`). |
| **FACILITY_STAFF** | On-site staff receiving daily `HANDOVER`, `RETURN_INSPECTION`, `UNIT_INSPECTION`, and `SUPPORT` tasks; performing handovers, returns, inspections, and incident handling. | Fast counter/corridor operations on tablet/laptop (`WorkspaceLayout`). Accounts created by `ADMIN`. DB `ck_users_facility_scope`: exactly one facility is required (`facility_id IS NOT NULL`). Default task lists include only their assigned tasks (`onlyMine = true`). No access to other facilities, chain policies, or account administration. |
| **FACILITY_MANAGER** | Operates one assigned facility: occupancy and six-month revenue dashboards, unit creation/editing within price limits, maintenance/inspection status, expiring/overdue rentals, task/ticket assignment. | Frequent desktop use at the facility office; understands handover, acceptance, and premises management. Accounts created by `ADMIN`. Must have one assigned facility (`facility_id IS NOT NULL`). All `OpsService` queries/writes are checked by `FacilityAccessService`. Cannot change system-wide business policies. |
| **BUSINESS_MANAGER** | Oversees commercial operations across the network: creates/updates/suspends facilities, configures seven global policy parameters (deposit, cancellation, grace/overdue fees, discount limits), manages `FeeType`, analyzes periodic revenue/occupancy reports, and exports CSV. | Headquarters executive using large desktop displays, data tables, and summary charts. Accounts created by `ADMIN`. DB: `facility_id IS NULL`; global `accessibleFacilityIds` scope. Cannot create/disable user accounts or change `ADMIN` permissions. |
| **ADMIN** | Manages identities, authorization, and platform security: creates/updates internal personnel accounts, assigns roles and facility scope, disables/restores accounts, and searches `activity_logs`. | Technical administrator. DB: `facility_id IS NULL`. BR-014 prevents self-disabling the current account and demoting/disabling the last `ACTIVE` administrator. |

---

# 3. FUNCTIONAL REQUIREMENTS

## 3.1 UML Use Case Diagrams

The diagrams follow **UML 2.5 Use Case Diagram** notation:
- A rectangle denotes the system boundary.
- Actors (`«actor»`, `«external actor»`) remain outside it and connect to use cases using solid association lines (`---`).
- `«include»`: a dashed arrow from the base use case to the mandatory shared use case (`Base -. "«include»" .-> Included`).
- `«extend»`: a dashed arrow from the optional/conditional extending use case to the base use case (`Extending -. "«extend»" .-> Base`).

### 6. Master Use Case Diagram (`UC-DIAG-01`)

> **[Insert Diagram #6 - Master UML Use Case Diagram (`UC-DIAG-01`) here]**
> - **Diagram type:** UML 2.5 master use case diagram: system boundary, actors, and 28 use cases grouped into six packages.
> - **Actors on both sides:** `Guest`, `CUSTOMER`, `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`, plus external actors `VNPay Gateway` and `Google OAuth2`.
> - **Packages and actor associations inside the boundary:**
>   1. **Identity & Sessions:** `UC-001` (customer registration - Guest), `UC-002` (login and JWT/Cookie sessions - All Roles), `UC-003` (Google OAuth2/OIDC login - Guest/CUSTOMER <-> Google OAuth2).
>   2. **Catalog & Availability:** `UC-004` (facility/unit-type lists and details - Guest/CUSTOMER), `UC-005` (term-based availability - Guest/CUSTOMER).
>   3. **Booking, Payment & Self-Service (CUSTOMER):** `UC-006` (atomic hold, includes `UC-005`), `UC-007` (cancel hold, extends `UC-016`), `UC-008` (VNPay/IPN, extends `UC-006`, `UC-009`, `UC-010`, linked to VNPay), `UC-009` (invoices/transactions), `UC-010` (renewal, extends `UC-016`), `UC-011` (return request, extends `UC-016`), `UC-015` (submit/track tickets), `UC-016` (my rentals).
>   4. **Facility Operations (STAFF & MANAGER):** `UC-012` (check-in), `UC-013` (check-out), `UC-014` (inspection), `UC-018` (ticket handling/closure). Manager additionally has `UC-017` (task assignment), `UC-019` (facility dashboard/revenue), `UC-020` (unit management/status), `UC-021` (facility rental monitoring).
>   5. **Chain Business Management (BUSINESS_MANAGER):** `UC-022` (facility network/suspension), `UC-023` (global policy), `UC-024` (fee types), `UC-025` (chain reports/CSV).
>   6. **System Administration & Security (ADMIN):** `UC-026` (accounts, roles, facility assignment), `UC-027` (disable/restore users), `UC-028` (audit logs).

### 7. Customer & VNPay Payment Subsystem Use Case Diagram (`UC-DIAG-02`)

> **[Insert Diagram #7 - Customer & Payment Subsystem Use Case Diagram (`UC-DIAG-02`) here]**
> - **Diagram type:** UML 2.5 self-service Customer Portal and Payment subsystem use case diagram.
> - **Actors:** `Guest`, `CUSTOMER`, `VNPay Gateway`, `Google OAuth2`.
> - **Main use cases:** `UC-001`, `UC-002`, `UC-003` (Google), `UC-004`, `UC-005`, `UC-006`, `UC-007`, `UC-008` (VNPay), `UC-009`, `UC-010`, `UC-011`, `UC-015`, `UC-016`.
> - **Include relationships:**
>   - `UC-005`, `UC-016` -> expire holds older than 15 minutes (`expireStaleHolds`).
>   - `UC-006` -> pessimistic unit locking and deposit calculation.
>   - `UC-008` -> HMAC-SHA512 signature validation.
> - **Extend relationships and guards:**
>   - `UC-007` -> `UC-016` `[status in PENDING_PAYMENT, RESERVED]`.
>   - `UC-010` -> `UC-016` `[status in ACTIVE, OVERDUE]`.
>   - `UC-011` -> `UC-016` `[status in ACTIVE, OVERDUE]`.
>   - `UC-008` -> `UC-009`, `UC-006`, `UC-010` `[invoice.status == PENDING]`.

### 8. Operations, Business & Administration Subsystem Use Case Diagram (`UC-DIAG-03`)

> **[Insert Diagram #8 - Internal Workspace Subsystem Use Case Diagram (`UC-DIAG-03`) here]**
> - **Diagram type:** UML 2.5 Internal Workspace use case diagram.
> - **Actors and associations:**
>   - `FACILITY_STAFF`: `UC-012`, `UC-013`, `UC-014`, `UC-018`.
>   - `FACILITY_MANAGER`: `UC-012`, `UC-013`, `UC-014`, `UC-017`, `UC-018`, `UC-019`, `UC-020`, `UC-021`.
>   - `BUSINESS_MANAGER`: `UC-022`, `UC-023`, `UC-024`, `UC-025`.
>   - `ADMIN`: `UC-026`, `UC-027`, `UC-028`.
> - **Include relationships:** Facility operations (`UC-012`, `UC-013`, `UC-014`, `UC-017`, `UC-020`) -> FacilityAccessService scope check. Account administration (`UC-026`, `UC-027`) -> Audit Logging.

---

## 3.2 Use Case Summary Table

| UC ID | Use Case Name | Primary Actor | Goal / Business Summary | Priority / Status |
|---|---|---|---|---|
| **UC-001** | Customer registration | `Guest` | Create a `CUSTOMER` account with name, email, phone, and a BCrypt-hashed password. | High / Draft |
| **UC-002** | Login, session refresh & logout | `All Roles` | Authenticate email/password; issue JWT Access/Refresh tokens through HttpOnly Cookies (or Bearer), rotate refresh tokens, and revoke on logout. | High / Draft |
| **UC-003** | Google OAuth2 / OIDC login | `Guest` / `CUSTOMER` | Quick Google login/registration with PKCE and secure `sub`-based linking in `social_identities`. | Normal / Draft |
| **UC-004** | View facilities and unit types | `Guest` / `CUSTOMER` | Display `ACTIVE` facilities, addresses, unit types, and published price ranges. | High / Draft |
| **UC-005** | Check term-based availability | `Guest` / `CUSTOMER` | Calculate available units by facility/type and half-open date interval after expiring stale holds. | High / Draft |
| **UC-006** | Create atomic rental hold | `CUSTOMER` | Pessimistically lock the best available unit; create a 15-minute `PENDING_PAYMENT` rental and rent + deposit invoice. | High / Draft |
| **UC-007** | Cancel hold / booking | `CUSTOMER` | Cancel a `PENDING_PAYMENT` or `RESERVED` rental and release the unit schedule. | Normal / Draft |
| **UC-008** | VNPay payment & IPN settlement | `CUSTOMER` | Create a `PaymentAttempt`, redirect to VNPay, and settle invoice/rental states through server IPN. | High / Draft |
| **UC-009** | View invoices & payment history | `CUSTOMER` | Show outstanding amounts, rent/deposit breakdowns, and pending, paid, or expired invoices. | High / Draft |
| **UC-010** | Request rental renewal | `CUSTOMER` | Check subsequent booking conflicts, create a `RentalRenewal` and `RENEWAL` invoice, then extend `end_date` after payment. | High / Draft |
| **UC-011** | Submit return request | `CUSTOMER` | Schedule return for `ACTIVE`/`OVERDUE` rentals, set `RETURN_REQUESTED`, and automatically create a return-inspection task. | High / Draft |
| **UC-012** | Check-in handover | `FACILITY_STAFF` / `FACILITY_MANAGER` | Hand over the unit and `KEY`/`ACCESS_CARD`/`ACCESS_CODE` for a `RESERVED` rental; set rental `ACTIVE`, unit `OCCUPIED`. | High / Draft |
| **UC-013** | Confirm check-out return | `FACILITY_STAFF` / `FACILITY_MANAGER` | Record the recovered premises' condition, set rental `RETURNED`, and block the unit under `INSPECTION`. | High / Draft |
| **UC-014** | Unit inspection | `FACILITY_STAFF` / `FACILITY_MANAGER` | Inspect an `INSPECTION` unit; set `AVAILABLE` for `PASS`, or `MAINTENANCE` for damage. | High / Draft |
| **UC-015** | Create & track support tickets | `CUSTOMER` | Submit rental-linked incident tickets by category and track progress. | Normal / Draft |
| **UC-016** | View my rentals | `CUSTOMER` | Manage personal rentals grouped as Awaiting Payment, Current, and History, with a linked-invoice drawer. | High / Draft |
| **UC-017** | Assign facility tasks | `FACILITY_MANAGER` | Assign `HANDOVER`, `RETURN_INSPECTION`, and `UNIT_INSPECTION` to active staff of the same facility by shift. | High / Draft |
| **UC-018** | Handle & close support tickets | `FACILITY_STAFF` / `FACILITY_MANAGER` | Manager assignment or staff self-assignment, `SUPPORT` tasks, resolution, and closure. | Normal / Draft |
| **UC-019** | Facility dashboard & revenue | `FACILITY_MANAGER` | View occupancy, urgent daily alerts, expiring rentals, and six-month facility revenue. | Normal / Draft |
| **UC-020** | Manage units & physical status | `FACILITY_MANAGER` | Create/edit units within type price limits; perform valid status transitions with controlled reasons. | High / Draft |
| **UC-021** | Monitor facility rentals | `FACILITY_MANAGER` | Search/filter by rental status, unit type, and payment/overdue condition. | Normal / Draft |
| **UC-022** | Manage facility network & suspension | `BUSINESS_MANAGER` | Add/edit branches and activate/suspend facilities with no effective rentals. | High / Draft |
| **UC-023** | Configure global business policy | `BUSINESS_MANAGER` | Configure and compare seven policy parameters: deposit, cancellation fee, grace/overdue fees, renewal/return notice, discount ceiling. | High / Draft |
| **UC-024** | Manage fee types | `BUSINESS_MANAGER` | View/update default amounts and active status of chain-wide additional fee types. | Normal / Draft |
| **UC-025** | Chain operations reports & CSV | `BUSINESS_MANAGER` | Aggregate collected revenue, growth, and facility occupancy by month/quarter/half-year/year; export CSV. | Normal / Draft |
| **UC-026** | Manage accounts, roles & facilities | `ADMIN` | Create/update users, assign one of five roles, and validate facility assignments. | High / Draft |
| **UC-027** | Disable / restore user accounts | `ADMIN` | Disable/reactivate users while protecting the current account and the last active administrator. | High / Draft |
| **UC-028** | Search audit logs | `ADMIN` | Search/filter security and critical operations history with actor and IP address. | Normal / Draft |

---

## 3.3 Use Case Specifications

This section details **five core use cases** on the system's critical business path, exceeding the SWR302 minimum of three, with **UML 2.5 Sequence Diagram** specifications.

### 3.3.1 UC-006: Create Atomic Rental Hold

| Metadata | Value |
|---|---|
| **Use Case ID / Version** | `UC-006` / `v1.0` |
| **Authors / Updated** | Hồ Xuân Thanh (BE2) & Trần Xuân Khoa (FE1) / 02/11/2026 |
| **Priority** | High - Core revenue flow |
| **Primary / Supporting Actors** | `CUSTOMER` / MySQL database (InnoDB row locking) |
| **Description / Goal** | Allow a customer to select a facility, unit type, start date, and rental months so the system automatically allocates and atomically holds one specific physical unit for 15 minutes pending payment, preventing double-booking under concurrent transactions. |

| Field | Specification |
|---|---|
| **Trigger** | The customer completes the three steps on `/reservation/new` and clicks **Confirm Hold** (`POST /api/v1/rentals/holds`). |
| **Preconditions** | 1. Logged-in `ACTIVE` user with role `CUSTOMER` and a valid CSRF token for Cookie sessions.<br>2. Selected facility exists and is `ACTIVE`.<br>3. `UnitType` exists.<br>4. `business_policies` configuration (`id = 1`) has been initialized. |
| **Postconditions** | **Success:** A specific `unit_id` is assigned to a new `rentals` record: `status = PENDING_PAYMENT`, `price_per_month` snapshots the unit's listed price, `end_date = start_date + rentalMonths`, `payment_expires_at = UTC_NOW + 15 minutes`. A new `invoices` record has `invoice_type = RENTAL`, `status = PENDING`, `amount = rent + deposit`, `due_at = payment_expires_at`.<br>**Failure:** Full DB rollback; no rental/invoice is created; the `storage_units` row lock is immediately released. |
| **Main Success Scenario** | 1. On `/reservation/new` (`SCR-004`), customer selects facility, unit type, `startDate`, `rentalMonths`, optional notes, accepts terms, and proceeds to the estimated-cost preview.<br>2. System displays estimated cost ranges and current availability (`UC-005`).<br>3. Customer checks Step 3 and clicks **Confirm Hold**.<br>4. Backend validates `startDate >= LocalDate.now(UTC)`, `rentalMonths >= 1`, and an existing `ACTIVE` facility.<br>5. Calculate `endDate = startDate.plusMonths(rentalMonths)` using `[startDate, endDate)`.<br>6. Query up to 25 candidate units of the selected facility/type, ordered by `monthly_price ASC, id ASC`, excluding `INSPECTION`/`MAINTENANCE` and overlapping blocking rentals.<br>7. In the same `@Transactional` transaction, lock the first candidate using `SELECT ... FOR UPDATE` (`PESSIMISTIC_WRITE`) and recheck availability for `[startDate, endDate)`.<br>8. Read `business_policies.deposit_percent`: `rent = monthly_price * rentalMonths`; `deposit = round((rent * deposit_percent) / 100, 2)`.<br>9. Save `Rental(PENDING_PAYMENT, payment_expires_at = now + 15 minutes)` and `Invoice(RENTAL, PENDING, amount = rent + deposit)`.<br>10. Commit and return `unitCode`, hold expiry, and invoice details; show the receipt and **Pay Now with VNPay**. |
| **Alternative Scenarios** | **7a. Another concurrent request takes the first candidate before locking:** After acquiring `FOR UPDATE`, `RentalAvailability.isAvailable(...)` returns `false`. Try subsequent candidates until an available unit is locked, then continue at Step 8. |
| **Exceptions / Error Handling** | **E1:** Unauthenticated / wrong role -> `401 UNAUTHORIZED` (`ERR-AUTH-001`) / `403 FORBIDDEN` (`ERR-AUTH-004`).<br>**E2:** Past start date -> `400 BAD_REQUEST`, "The start date must not be in the past" (`ERR-RENT-001`).<br>**E3:** Inactive facility -> `400 BAD_REQUEST`, "The facility is temporarily inactive; booking is unavailable" (`ERR-RENT-002`).<br>**E4:** No candidate remains -> `400 BAD_REQUEST`, "No suitable available unit was found. Please select another facility or unit type" (`ERR-RENT-003`).<br>**E5:** Missing policy -> `400 BAD_REQUEST`, "Business policy has not been configured" (`ERR-RENT-004`). |
| **Relationships** | Includes `UC-005` (availability at the estimate step); extended by `UC-008` (pay the newly created invoice through VNPay). |
| **Business Rules** | `BR-001`, `BR-002`, `BR-003`, `BR-004`, `BR-011`, `BR-013` |

---

### 3.3.2 UC-008: VNPay Payment & IPN Settlement

| Metadata | Value |
|---|---|
| **Use Case ID / Version** | `UC-008` / `v1.0` |
| **Authors / Updated** | Lê Trí Thiện (BE3) & Trần Xuân Khoa (FE1) / 02/11/2026 |
| **Priority** | High - Confirm cash flow and activate reservations/renewals |
| **Primary / Supporting Actors** | `CUSTOMER` / `VNPay Payment Gateway` v2.1.0 |
| **Description / Goal** | Start an `HMAC-SHA512`-signed online payment for a `PENDING` invoice, receive the returning browser, and use server-to-server IPN as the sole source of truth to settle the invoice, confirm a reservation (`RESERVED`), or apply a renewal (`APPLIED`). |

| Field | Specification |
|---|---|
| **Trigger** | Customer clicks **Pay Now with VNPay** on `/reservation/new`, `/my-rentals`, or `/billing`, sending `POST /api/v1/payments/vnpay/url`. |
| **Preconditions** | 1. Authenticated customer owns `invoiceId`.<br>2. Invoice exists and is `PENDING`.<br>3. Backend has a valid eight-character alphanumeric `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`. |
| **Postconditions** | **Successful IPN `00`:** `payment_attempts -> SUCCESS`, recording `paid_at` and `gateway_transaction_no`; `uq_payment_attempts_one_success` permits at most one successful attempt per invoice. A still-`PENDING` invoice becomes `PAID`. For `RENTAL` + `PENDING_PAYMENT`, rental becomes `RESERVED`; for `RENEWAL`, renewal becomes `APPLIED` and `rental.end_date = requested_end_date`.<br>**Gateway failure:** `PaymentAttempt -> FAILED`; invoice remains `PENDING` for retry while valid. |
| **Main Success Scenario** | 1. Customer chooses a `PENDING` invoice.<br>2. Backend checks ownership/status, generates `provider_reference = "VNP-" + invoiceId + "-" + 12_HEX`, and creates `PaymentAttempt(PENDING, amount = invoice.totalAmount(), method = "VNPAY")`.<br>3. Build VNPay v2.1.0 parameters (`vnp_Amount = amount * 100`, 15-minute expiry in `Asia/Ho_Chi_Minh`), sign with `HmacSHA512`, and return `paymentUrl`.<br>4. Browser redirects to VNPay; customer completes bank authentication.<br>5. **Server IPN (`GET /api/v1/payments/vnpay/ipn`):** Verify `vnp_SecureHash` in constant time, `vnp_TmnCode`, existence of `vnp_TxnRef`, `vnp_Amount == attempt.amount * 100`, and idempotency (`attempt.status == PENDING`).<br>6. For `vnp_ResponseCode == "00"` and `vnp_TransactionStatus == "00"`, atomically set attempt `SUCCESS`, invoice `PAID`, rental `RESERVED` (or extend `end_date` for renewal), and return `{"RspCode":"00","Message":"Confirm Success"}`.<br>7. **Browser Return (`GET /api/v1/payments/vnpay/return`):** Verify the signature without DB writes; redirect with `HTTP 303` to `/payment/result?vnp_TxnRef=...`.<br>8. `/payment/result` (`SCR-005`) polls `GET /api/v1/payments/attempts/{reference}` every three seconds, at most ten times, until `SUCCESS`, then displays confirmation. |
| **Alternative Scenarios** | **5a. Duplicate IPN:** When `attempt.status != PENDING`, do not overwrite; return `{"RspCode":"02","Message":"Order already confirmed"}`.<br>**6a. Late payment after expired/cancelled hold:** Record attempt `SUCCESS` for cash-flow reconciliation, retain the expired invoice, and do not reallocate the released unit; await manual refund reconciliation.<br>**7a. Browser arrives before IPN:** Show reconciliation status `PENDING` and poll every three seconds. |
| **Exceptions / Error Handling** | **E1:** Missing VNPay configuration -> `503 SERVICE_UNAVAILABLE`, `PAYMENT_GATEWAY_UNAVAILABLE` (`ERR-PAY-001`).<br>**E2:** Invoice no longer `PENDING` -> reject new URL with HTTP `400/500`.<br>**E3:** Forged signature or wrong `vnp_TmnCode` -> no DB update; `{"RspCode":"97","Message":"Invalid signature"}`.<br>**E4:** Amount mismatch -> no DB update; `{"RspCode":"04","Message":"Invalid amount"}`.<br>**E5:** Tampered Browser Return parameters -> `?returnVerified=false`; UI shows a red signature-verification warning. |
| **Relationships** | Extends `UC-006` (new hold), `UC-009` (invoice-page payment), and `UC-010` (renewal invoice payment). |
| **Business Rules** | `BR-003`, `BR-004`, `BR-008`, `BR-009`, `BR-010` |

### 9. UML Sequence `SEQ-01`: Atomic Hold & VNPay IPN Confirmation (`UC-006`, `UC-008`)

> **[Insert Diagram #9 - UML Sequence Diagram (`SEQ-01`) here]**
> - **Diagram type:** UML 2.5 Sequence Diagram.
> - **Six lifelines, left to right:** `CUSTOMER (Actor)` -> `Frontend SPA` -> `RentalController / RentalService` -> `MySQL 8.4 (InnoDB)` -> `Billing & VnPayService` -> `VNPay Gateway`.
> - **Messages and combined fragments (`alt`, `par`, `loop`):**
>   1. Customer -> SPA: choose facility/type/dates and **Confirm Hold**.
>   2. SPA -> RentalService: `POST /api/v1/rentals/holds (facilityId, unitTypeId, startDate, rentalMonths)`.
>   3. Service -> MySQL: find available candidates (`ORDER BY monthly_price ASC`), execute `SELECT * FROM storage_units WHERE id = ? FOR UPDATE`, and recheck `[startDate, endDate)` overlap.
>   4. **alt [No available unit]:** Return `400 BAD_REQUEST` to SPA.
>   5. **else [Unit locked]:** Insert `rentals(PENDING_PAYMENT, expires +15m)` and `invoices(RENTAL, PENDING, rent + deposit)`, commit, and return `200 OK HoldResponse(unitCode, holdExpiresAt, invoice)`.
>      - Customer clicks **Pay Now with VNPay** -> SPA calls `POST /api/v1/payments/vnpay/url (invoiceId)`.
>      - Billing service inserts `payment_attempts(PENDING, VNP-{invoiceId}-{hex})`, returns the signed URL, and redirects the browser to VNPay.
>      - **par [Server IPN]:** VNPay calls `GET /api/v1/payments/vnpay/ipn` -> verify HMAC, amount (`x100`), `PENDING` -> atomically set attempt `SUCCESS`, invoice `PAID`, rental `RESERVED` -> return `{"RspCode":"00","Message":"Confirm Success"}`.
>      - **and [Browser Return]:** VNPay redirects to `/api/v1/payments/vnpay/return` -> signature check without writes -> `HTTP 303` to `/payment/result` -> **loop [every 3 seconds, at most 10 times]** query `/api/v1/payments/attempts/{reference}` until `SUCCESS` and show completion.

---

### 3.3.3 UC-010: Request & Settle Contract Renewal

| Metadata | Value |
|---|---|
| **Use Case ID / Version** | `UC-010` / `v1.0` |
| **Authors / Updated** | Hồ Xuân Thanh (BE2), Lê Trí Thiện (BE3) & Trần Xuân Khoa (FE1) / 02/11/2026 |
| **Priority** | High |
| **Primary / Supporting Actors** | `CUSTOMER` / `VNPay Payment Gateway` |
| **Description / Goal** | Extend the rental of the same unit if the extension does not conflict with another customer's booking and the unit is not under maintenance/inspection. The contract term is officially extended only after successful renewal payment. |

| Field | Specification |
|---|---|
| **Trigger** | On `/my-rentals` (`SCR-006`), click **Renew**, select months in `RenewalModal`, and confirm invoice creation (`POST /api/v1/rentals/{rentalId}/renewals`). |
| **Preconditions** | 1. Logged-in customer owns `rentalId`.<br>2. Rental is `ACTIVE` or `OVERDUE`.<br>3. Unit is neither `INSPECTION` nor `MAINTENANCE`; no other blocking rental overlaps `[currentEndDate, newEndDate)`. |
| **Postconditions** | **After request:** Save `rental_renewals(REQUESTED, previous_end_date = rental.end_date, requested_end_date = end_date + additionalMonths)` and a `PENDING` `RENEWAL` invoice for `price_per_month * additionalMonths`, with no new deposit. Original `rental.end_date` remains unchanged.<br>**After successful VNPay IPN:** Invoice `PAID`, renewal `APPLIED`, `rental.end_date = requested_end_date`. |
| **Main Success Scenario** | 1. Open renewal dialog and select `additionalMonths >= 1` (suggested 1/3/6/12).<br>2. UI displays estimated new end date and cost at the rental's existing monthly rate.<br>3. Customer confirms.<br>4. Backend checks ownership and `{ACTIVE, OVERDUE}` status.<br>5. Compute `newEnd = rental.endDate.plusMonths(additionalMonths)` and check the same `unit_id` for overlaps, excluding this `rentalId`.<br>6. If available for the entire extension, create `RentalRenewal(REQUESTED)` and `Invoice(RENEWAL, PENDING, amount = rental.pricePerMonth * additionalMonths)`.<br>7. Return the invoice; customer completes `UC-008` to pay and apply the new end date. |
| **Alternative Scenarios** | **7a:** Customer defers payment; the `RENEWAL` invoice remains `PENDING` on `/billing` (`SCR-007`). |
| **Exceptions / Error Handling** | **E1:** Invalid status (e.g., `RESERVED`, `RETURNED`, `CANCELLED`) -> `400 BAD_REQUEST`, "Only active or overdue rentals can be renewed" (`ERR-RENT-006`).<br>**E2:** Conflicting future booking -> `400 BAD_REQUEST`, "The unit has another rental during the renewal period; please select another unit" (`ERR-RENT-007`).<br>**E3:** Duplicate invoice for the same renewal is blocked by `uq_invoices_renewal`. |
| **Relationships** | Extends `UC-016` (My Rentals); linked to `UC-008` through the payment extension. |
| **Business Rules** | `BR-001`, `BR-005`, `BR-009` |

### 10. UML Sequence `SEQ-02`: Renewal & Automatic Application after IPN (`UC-010`)

> **[Insert Diagram #10 - UML Sequence Diagram (`SEQ-02`) here]**
> - **Diagram type:** UML 2.5 Sequence Diagram.
> - **Six lifelines:** `CUSTOMER (Actor)` -> `Frontend SPA (MyRentalsPage)` -> `RentalService` -> `MySQL 8.4` -> `PaymentService / VnPayIpnService` -> `VNPay Gateway`.
> - **Messages and alt fragments:**
>   1. Customer opens `RenewalModal`, selects `additionalMonths`, confirms -> SPA sends `POST /api/v1/rentals/{rentalId}/renewals`.
>   2. Service checks ownership, `ACTIVE`/`OVERDUE`, and overlap on the same unit for `[endDate, endDate + additionalMonths)`.
>   3. **alt [Conflicting booking]:** Return `400 BAD_REQUEST` and ask the customer to choose another unit.
>   4. **else [No conflict]:** Insert `rental_renewals(REQUESTED)` and `invoices(RENEWAL, PENDING, deposit = 0)` -> `200 OK RenewalResponse`.
>      - Customer pays the renewal invoice at VNPay.
>      - VNPay calls `/api/v1/payments/vnpay/ipn (RspCode = 00)`.
>      - PaymentService sets attempt `SUCCESS`, invoice `PAID`, renewal `APPLIED`, `rentals.end_date = requested_end_date`; returns `{"RspCode":"00","Message":"Confirm Success"}`.

---

### 3.3.4 UC-012: Check-in Handover & Rental Activation

| Metadata | Value |
|---|---|
| **Use Case ID / Version** | `UC-012` / `v1.0` |
| **Authors / Updated** | Hồ Xuân Thanh (BE2) & Bùi Tuấn Thanh (FE2) / 02/11/2026 |
| **Priority** | High |
| **Primary / Supporting Actors** | `FACILITY_STAFF` or `FACILITY_MANAGER` / `CUSTOMER` receiving the unit on site |
| **Description / Goal** | Confirm physical handover and access rights for a paid reservation (`RESERVED`), atomically changing rental to `ACTIVE`, unit to `OCCUPIED`, and handover task to `DONE`. |

| Field | Specification |
|---|---|
| **Trigger** | In `/staff/operations` (`SCR-013`), open the `HANDOVER` task drawer, select access method, enter handover-condition notes, and click **Confirm Unit Handover** (`POST /api/v1/ops/tasks/{taskId}/handover`). |
| **Preconditions** | 1. Authenticated staff/manager belongs to the unit's `facility_id` (or is `ADMIN`/`BUSINESS_MANAGER`).<br>2. A `StaffTask(task_type = HANDOVER)` references a valid rental.<br>3. Rental is paid and `RESERVED`; handover is blocked for `PENDING_PAYMENT`, `EXPIRED`, or `CANCELLED`. |
| **Postconditions** | In one DB transaction: task -> `DONE`, `completed_at = UTC_NOW`, `notes = handoverCondition`; rental `RESERVED -> ACTIVE`, `checked_in_at = UTC_NOW`, with `access_method` (`KEY`/`ACCESS_CARD`/`ACCESS_CODE`) and `handover_condition`; unit row locked `FOR UPDATE` and set `OCCUPIED`. |
| **Main Success Scenario** | 1. Manager views a `RESERVED` rental at `/facility/rentals` (`SCR-012`, as referenced in the source) and assigns `HANDOVER` (`UC-017`).<br>2. At the appointment, staff selects the task in `/staff/operations` (`SCR-013`).<br>3. Optionally click **Start Work** (`POST /ops/tasks/{taskId}/start`) to change `ASSIGNED -> IN_PROGRESS`.<br>4. Verify customer details, inspect the unit with the customer, issue keys/cards/PIN, select `accessMethod`, and record `handoverCondition`.<br>5. Click **Confirm Unit Handover**.<br>6. Backend verifies facility scope (`FacilityAccessService`), task type, rental `RESERVED`, and locks `StorageUnit`.<br>7. Atomically set task `DONE`, rental `ACTIVE`, unit `OCCUPIED`; return updated `TaskRentalPair`.<br>8. UI shows completion and refreshes daily task KPIs. |
| **Alternative Scenarios** | **3a:** Staff confirms without first starting the task; `task.startIfNotStarted()` moves `ASSIGNED -> IN_PROGRESS -> DONE` within the same call. |
| **Exceptions / Error Handling** | **E1:** Different-facility staff -> `403 FORBIDDEN`, "You do not have access to this facility" (`ERR-AUTH-005`).<br>**E2:** Unpaid or non-`RESERVED` rental -> `400 BAD_REQUEST`, "Only paid and allocated rentals can be checked in" (`ERR-OPS-004`).<br>**E3:** Wrong task type, e.g., `SUPPORT`/`UNIT_INSPECTION` -> `400 BAD_REQUEST`, "Invalid operation for task ..." (`ERR-OPS-005`). |
| **Relationships** | Requires prior `UC-008` (paid reservation) and `UC-017` (`HANDOVER` assignment). |
| **Business Rules** | `BR-006`, `BR-013` |

---

### 3.3.5 UC-013: Check-out Return & Unit Inspection

| Metadata | Value |
|---|---|
| **Use Case ID / Version** | `UC-013` (in sequence with `UC-011` & `UC-014`) / `v1.0` |
| **Authors / Updated** | Hồ Xuân Thanh (BE2) & Bùi Tuấn Thanh (FE2) / 02/11/2026 |
| **Priority** | High |
| **Primary / Supporting Actors** | `FACILITY_STAFF` / `FACILITY_MANAGER`; supporting `CUSTOMER` initiates return |
| **Description / Goal** | Complete the rental termination process: customer schedules return; staff recover the premises, mark rental `RETURNED`, and block unit under `INSPECTION`; technical inspection determines whether it becomes `AVAILABLE` or `MAINTENANCE`. |

| Field | Specification |
|---|---|
| **Trigger** | 1. Customer requests return (`POST /api/v1/rentals/{id}/return-requests`), or manager assigns `RETURN_INSPECTION`.<br>2. Staff confirms return (`POST /api/v1/ops/tasks/{taskId}/return`) and inspection (`POST /api/v1/ops/tasks/{taskId}/inspection`). |
| **Preconditions** | 1. Rental is `ACTIVE`, `OVERDUE`, or `RETURN_REQUESTED`.<br>2. Facility has at least one `ACTIVE` staff member or manager to receive the task.<br>3. `completeUnitInspection` requires a unit under `INSPECTION` and a `UNIT_INSPECTION` task. |
| **Postconditions** | **After completeReturn:** Rental -> terminal `RETURNED`, recording `returned_at`, `return_condition`; return task -> `DONE`; unit `OCCUPIED -> INSPECTION`, blocking new bookings.<br>**After completeUnitInspection:** Inspection task -> `DONE`; `result == "PASS"` -> unit `AVAILABLE`; otherwise `MAINTENANCE`. |
| **Main Success Scenario** | 1. Customer selects a current rental on `/my-rentals`, chooses `requestedDate >= startDate`, and submits return (`UC-011`).<br>2. System sets `RETURN_REQUESTED`, records `appointment_at`, and automatically creates/assigns `RETURN_INSPECTION` to on-duty staff.<br>3. After belongings and keys/cards are removed/returned, staff checks the premises, records `condition`, and calls `POST /ops/tasks/{taskId}/return`.<br>4. Backend sets rental `RETURNED`, return task `DONE`, unit `INSPECTION`.<br>5. For the subsequent `UNIT_INSPECTION`, staff examines structure, cleanliness, and locks, submitting `result = "PASS"` and notes to `/ops/tasks/{taskId}/inspection`.<br>6. Backend locks the unit, verifies `INSPECTION`, sets it `AVAILABLE`, and completes the task. Unit is ready for a new rental. |
| **Alternative Scenarios** | **5a:** Damage, mold, or broken locks (`result != "PASS"`, e.g., `"FAIL"`): staff records the defects and submits failure; Backend sets unit `INSPECTION -> MAINTENANCE`. New bookings remain blocked until repair and manager reactivation to `AVAILABLE`. |
| **Exceptions / Error Handling** | **E1:** No active facility personnel -> `400 BAD_REQUEST`, "No facility staff are on duty to inspect the unit" (`ERR-RENT-009`).<br>**E2:** Return appointment before rental start -> `400 BAD_REQUEST`, "The requested return date must not precede the rental start date" (`ERR-RENT-010`).<br>**E3:** Inspection when unit is not `INSPECTION` -> `400 BAD_REQUEST`, `INVALID_UNIT_STATUS_TRANSITION`, "Invalid unit status transition". |
| **Relationships** | Business chain: `UC-011` (request) -> `UC-013` (check-out) -> `UC-017` / `UC-014` (inspection). |
| **Business Rules** | `BR-006`, `BR-007`, `BR-013` |

### 11. UML Sequence `SEQ-03`: Return Request, Check-out & Unit Inspection (`UC-011`, `UC-013`, `UC-014`)

> **[Insert Diagram #11 - UML Sequence Diagram (`SEQ-03`) here]**
> - **Diagram type:** UML 2.5 Sequence Diagram.
> - **Six lifelines:** `CUSTOMER (Actor)` -> `RentalService` -> `MySQL 8.4` -> `FACILITY_MANAGER (Actor)` -> `FACILITY_STAFF (Actor)` -> `OpsService`.
> - **Messages and alt fragments:**
>   1. **Return request (UC-011):** Customer calls `POST /api/v1/rentals/{id}/return-requests (requestedDate)` -> service checks `ACTIVE`/`OVERDUE` and active facility personnel -> sets rental `RETURN_REQUESTED`, inserts `staff_tasks(RETURN_INSPECTION, ASSIGNED)` -> `200 OK`.
>   2. **Check-out (UC-013):** Customer clears belongings and returns keys -> staff calls `POST /api/v1/ops/tasks/{returnTaskId}/return (condition)` -> OpsService locks `storage_units FOR UPDATE`, sets rental `RETURNED`, task `DONE`, unit `INSPECTION` -> `200 OK`.
>   3. **Assignment & inspection (UC-017 / UC-014):** Manager calls `POST /api/v1/ops/tasks (taskType = UNIT_INSPECTION, rentalId, assignedStaffId)` -> insert assigned inspection task. Staff inspects and calls `POST /api/v1/ops/tasks/{inspectTaskId}/inspection (result, notes)`.
>      - **alt [result == "PASS"]:** Unit `AVAILABLE`, task `DONE`, re-listed in catalog.
>      - **else [result == "FAIL"]:** Unit `MAINTENANCE`, task `DONE`, awaiting repair.

---

## 3.4 Screen Flows & Screen Descriptions

### 3.4.1 Screen Flow by User Role

Items **12-16** specify five Screen Navigation Flow Diagrams, one for each user group.

#### 12. Guest & Customer Screen Flow (`FLOW-CUSTOMER`)

> **[Insert Diagram #12 - Screen Flow Diagram (`FLOW-CUSTOMER`) here]**
> - **Diagram type:** Screen Flow / Navigation State Diagram.
> - **Screen nodes:** `SCR-001` Home (`/`); `SCR-002` Facilities (`/facilities`); `SCR-003` Facility Details (`/facilities/:id`); `SCR-004` Three-Step Reservation Wizard (`/reservation/new`); `SCR-005` Payment Result (`/payment/result`); `SCR-006` My Rentals (`/my-rentals`, `RentalDetailDrawer`, `RenewalModal`, `ReturnRequestModal`); `SCR-007` Billing & Payments (`/billing`); `SCR-008` Support (`/support`); `SCR-009` Login & Register (`/auth`); `SCR-010` Forbidden (`/forbidden`); external `VNPay Gateway`.
> - **Transitions:**
>   - `[*] -> SCR-001`; `SCR-001 -> SCR-002` (find storage/view facilities); `SCR-002 -> SCR-003` (select facility); `SCR-003 -> SCR-004` (select available type).
>   - `SCR-001 -> SCR-009` (login/register); `SCR-004 -> SCR-009` (unauthenticated hold `[401]`); `SCR-009 -> SCR-001` (successful email/Google login `[Role = CUSTOMER]`).
>   - `SCR-004 -> VNPay Gateway` (hold created, click pay); `SCR-006 -> VNPay Gateway` (hold/renewal payment); `SCR-007 -> VNPay Gateway` (`PENDING` invoice).
>   - `VNPay Gateway -> SCR-005` (Browser Return); `SCR-005 -> SCR006` (IPN polling complete -> My Rentals).
>   - `SCR-001 -> SCR-006` (authenticated menu); `SCR-006 -> SCR-007` (invoices); `SCR-006 -> SCR-008` (support); `SCR-006 -> SCR-010` (blocked internal `/facility/*`, `/admin/*` access `[403]`).

#### 13. Facility Staff Screen Flow (`FLOW-FACILITY_STAFF`)

> **[Insert Diagram #13 - Screen Flow Diagram (`FLOW-FACILITY_STAFF`) here]**
> - **Diagram type:** Screen navigation for `FACILITY_STAFF`.
> - **Nodes / Drawers:** `SCR-009` Login (`/auth`); `SCR-013` Today's Work (`/staff/operations`); `TaskDrawer` for `HANDOVER` / `RETURN_INSPECTION` / `UNIT_INSPECTION` / `SUPPORT`; `TicketsPanel` for facility ticket filtering/self-assignment; `EmptyState (No Facility)` (`facilityId == null`); `EmptyState (No Role)` blocking `/facility/*`, `/operations/*`, `/admin/*`; `SCR-001` Customer Portal (`/`).
> - **Transitions:**
>   - `[*] -> SCR-009`; then No Facility if `[facilityId == null]`, or `SCR-013` if `[Role = FACILITY_STAFF & facilityId != null]`.
>   - `SCR-013 <-> TaskDrawer`: select task -> start / confirm handover / confirm return / submit inspection `PASS`/`FAIL`.
>   - `SCR-013 -> TicketsPanel -> TaskDrawer`: filter `OPEN` tickets -> **Assign to Me** -> automatic `SUPPORT` task and resolution recording.
>   - `SCR-013 -> EmptyState (No Role)` for unauthorized URLs; `-> SCR-001` for portal; `-> SCR-009` for logout and Refresh Cookie revocation.

#### 14. Facility Manager Screen Flow (`FLOW-FACILITY_MANAGER`)

> **[Insert Diagram #14 - Screen Flow Diagram (`FLOW-FACILITY_MANAGER`) here]**
> - **Diagram type:** Screen navigation for `FACILITY_MANAGER`.
> - **Nodes / Modals:** `SCR-009` Login (`/auth`); `SCR-011` Facility Overview (`/facility/dashboard`); `SCR-012` Units (`/facility/units`, `UnitFormModal`, `UnitDrawer`); `SCR-014` Rentals & Assignment (`/facility/rentals`, `RentalDrawer`, `AssignTaskModal`); `SCR-013` Facility Work (`/staff/operations`).
> - **Transitions:**
>   - `[*] -> SCR-009 -> SCR-011` `[Role = FACILITY_MANAGER & facilityId != null]`.
>   - Dashboard urgent alerts: overdue/expiring rentals -> `SCR-014`; units under `INSPECTION` -> `SCR-012`; open work/tickets -> `SCR-013`.
>   - `SCR-012 <-> UnitFormModal / UnitDrawer`: create unit, edit rent within `UnitType` limits, change `MAINTENANCE`/`AVAILABLE` with a reason.
>   - `SCR-014 -> RentalDrawer / AssignTaskModal -> SCR-013`: select rental, assign `HANDOVER` / `RETURN_INSPECTION` / `UNIT_INSPECTION`, monitor progress, and close tickets.
>   - `SCR-011 -> SCR-009` (logout).

#### 15. Chain Business Manager Screen Flow (`FLOW-BUSINESS_MANAGER`)

> **[Insert Diagram #15 - Screen Flow Diagram (`FLOW-BUSINESS_MANAGER`) here]**
> - **Diagram type:** Screen navigation for `BUSINESS_MANAGER`.
> - **Nodes / Modals:** `SCR-009` Login (`/auth`); `SCR-015` Facility Network (`/operations/facilities`, `FacilityFormModal`, `StatusConfirmModal`); `SCR-016` Policies & Fees (`/operations/policies`, `PolicyDiffModal`, `FeeEditModal`); `SCR-017` Chain Operations Reports (`/operations/reports`).
> - **Transitions:**
>   - `[*] -> SCR-009 -> SCR-015` `[Role = BUSINESS_MANAGER]`.
>   - `SCR-015 <-> FacilityFormModal / StatusConfirmModal`: add/edit facilities or suspend/activate after checking no effective rentals remain.
>   - `SCR-015 <-> SCR-016 <-> PolicyDiffModal / FeeEditModal`: edit seven global parameters, compare Current vs New before confirming, or update `FeeType` amounts/status.
>   - `SCR-016 <-> SCR-017`: analyze collected revenue and occupancy by `month`/`quarter`/`half`/`year`, filter facilities, sort columns, **Export CSV**.
>   - `SCR-017 -> SCR-009` (logout).

#### 16. System Administrator Screen Flow (`FLOW-ADMIN`)

> **[Insert Diagram #16 - Screen Flow Diagram (`FLOW-ADMIN`) here]**
> - **Diagram type:** Screen navigation for `ADMIN`.
> - **Nodes / Modals:** `SCR-009` Login (`/auth`); `SCR-018 (Accounts Tab)` Administration & Security - Users (`/admin/security`); `SCR-018 (Logs Tab)` Activity Logs (same route); `UserFormModal` create/edit, role and `facility_id`; `StatusConfirmModal` disable (`DISABLED`)/restore (`ACTIVE`).
> - **Transitions:**
>   - `[*] -> SCR-009 -> SCR-018 (Accounts)` `[Role = ADMIN]`.
>   - Accounts <-> `UserFormModal`: create/update role/facility with facility-scope validation and last-active-admin protection.
>   - Accounts <-> `StatusConfirmModal`: disable/restore, block self-disable, record `ActivityLog`.
>   - Accounts <-> Logs: keyword search/action filters (`USER_CREATED`, `USER_DISABLED`, `SUPPORT_TICKET_CREATED`, etc.).
>   - `SCR-018 -> SCR-009` (logout).

---

### 3.4.2 Screen Descriptions

| Screen ID & Route | Actor | Screen / Feature | Inputs, Outputs, Actions & UI States | Related UC |
|---|---|---|---|---|
| **SCR-001**<br>`/` | Guest, All Roles | Home & Quick Search (`HomePage`) | **Input:** `CatalogFilters` (facility, type, start date >= today, 1/3/6/12 months).<br>**Output/actions:** Dynamic active-facility/type counts, type-card grid; navigate to `/facilities` with query parameters or `/reservation/new`.<br>**UI:** Spinner, catalog error with **Retry**, empty list. | `UC-004`, `UC-005` |
| **SCR-002**<br>`/facilities` | Guest, All Roles | Facilities & Availability (`FacilityListPage`) | **Input:** Name/address keyword `q`, facility/type/date/months, synchronized URL query parameters.<br>**Output/actions:** `FacilityCard` grid, `availableCount` from `/availability`, **Clear Filters**, select -> `SCR-003`.<br>**UI:** Four-card skeleton, yellow availability-error warning, unmatched-filter `EmptyState`. | `UC-004`, `UC-005` |
| **SCR-003**<br>`/facilities/:facilityId` | Guest, All Roles | Facility Details & Unit Types (`FacilityDetailPage`) | **Input:** URL `facilityId`, `start`, `months`.<br>**Output/actions:** Branch details, status badge, `UnitTypeCard` with `sizeM2`, min-max price, availability; select -> `SCR-004`.<br>**UI:** Loading, 404 `EmptyState`, connection error. | `UC-004`, `UC-005` |
| **SCR-004**<br>`/reservation/new` | CUSTOMER (Guest previews Steps 1-3) | Three-Step Reservation (`ReservationPage`) | **Input:** Step 1 facility/type/date/term/notes/terms checkbox; Step 2 estimated costs; Step 3 confirmation.<br>**Output/actions:** `POST /rentals/holds`, receipt with `unitCode`, 15-minute `holdExpiresAt`, rent/deposit, **Pay Now with VNPay**.<br>**UI:** Three-step stepper; block without terms; `availableCount = 0` warning; red `role="alert"` error. | `UC-005`, `UC-006`, `UC-008` |
| **SCR-005**<br>`/payment/result` | CUSTOMER | VNPay Result (`PaymentResultPage`) | **Input:** `vnp_TxnRef`, `vnp_ResponseCode`, `vnp_TransactionStatus`, `returnVerified`.<br>**Output/actions:** Poll `GET /payments/attempts/{ref}` every three seconds, max ten while `PENDING`; distinguish browser response from Server IPN settlement; **Check Status**, **Back to My Rentals**.<br>**UI:** Red warning for `returnVerified=false`, waiting spinner, success/failure badges. | `UC-008` |
| **SCR-006**<br>`/my-rentals` | CUSTOMER | My Rentals (`MyRentalsPage`) | **Input:** Awaiting Payment / Current / History tabs; `RenewalModal` months; `ReturnRequestModal` appointment and notes.<br>**Output/actions:** `RentalCard`, `RentalDetailDrawer` with linked invoices; Pay, Cancel Hold (two-step inline confirmation), Renew, Request Return.<br>**UI:** Three-card skeleton, empty-state storage-search CTA, action errors. | `UC-007`, `UC-008`, `UC-010`, `UC-011`, `UC-016` |
| **SCR-007**<br>`/billing` | CUSTOMER | Billing & Payments (`BillingPage`) | **Input:** Awaiting Payment / Paid / History tabs.<br>**Output/actions:** `pendingTotal` banner, invoice cards with rent/deposit, `dueAt`, VNPay payment on `PENDING` invoices.<br>**UI:** Skeleton, loading on the clicked invoice button, `ErrorState`, `EmptyState`. | `UC-008`, `UC-009` |
| **SCR-008**<br>`/support` | CUSTOMER | Customer Support (`SupportPage`) | **Input:** `rentalId`, category `UNIT`/`LOCK`/`ACCESS`/`PAYMENT`/`ITEMS`/`OTHER`, title <= 200 characters, description.<br>**Output/actions:** `POST /support-tickets`, own tickets newest first with progress.<br>**UI:** Disable form if no rental exists; inline validation; `EmptyState`. | `UC-015` |
| **SCR-009**<br>`/auth` | Guest | Login & Register (`AuthPage`) | **Input:** Login email/password; registration fullName/email/phone/password >= 8 characters/confirmPassword; **Continue with Google**.<br>**Output/actions:** HttpOnly Cookie + CSRF session; redirect to role default (`/` or Workspace).<br>**UI:** Automatic session restore; hide/disable Google if OAuth disabled; `email_conflict` or disabled-account errors. | `UC-001`, `UC-002`, `UC-003` |
| **SCR-010**<br>`/forbidden` & `*` | All Roles | 403 & 404 (`ForbiddenPage`, `NotFoundPage`) | Show forbidden access (e.g., customer entering internal URLs) or missing route, with Home (`/`) button. | Common (`CR-002`) |
| **SCR-011**<br>`/facility/dashboard` | FACILITY_MANAGER | Facility Overview (`FacilityDashboardPage`) | Four KPIs (occupancy %, available units, current rentals, overdue); color-coded **Needs Attention Today**; six-month revenue bars, occupancy by type, expiring-rental table and quick links. | `UC-019` |
| **SCR-012**<br>`/facility/units` | FACILITY_MANAGER | Physical Units (`FacilityUnitsPage`) | **Input:** Code search, type/status/price filters; `UnitFormModal` code/type/location-floor/monthly min-max price; `UnitDrawer` status/reason.<br>**Output/actions:** Four unit KPIs, eight-row pagination, success toast. | `UC-020` |
| **SCR-013**<br>`/staff/operations` | FACILITY_STAFF, FACILITY_MANAGER | Facility Work & Tickets (`StaffOperationsPage`) | **Input:** Task type/shift/status; `TaskDrawer` handover/return/inspection reports (`PASS`/`FAIL`); `TicketsPanel` status filters.<br>**Actions:** Handover, return, inspection; staff self-assignment or manager ticket assignment/closure. | `UC-012`, `UC-013`, `UC-014`, `UC-018` |
| **SCR-014**<br>`/facility/rentals` | FACILITY_MANAGER | Rentals & Assignment (`FacilityRentalsPage`) | **Input:** Six rental-status tabs, keyword/type/payment filters; `AssignTaskModal` type/staff/date/shift.<br>**Output/actions:** Today's handover appointment cards, paginated rentals, `RentalDrawer` details/assignment. | `UC-017`, `UC-021` |
| **SCR-015**<br>`/operations/facilities` | BUSINESS_MANAGER | Facility Network (`OperationsFacilitiesPage`) | **Input:** Search, `ALL`/`ACTIVE`/`INACTIVE`, `FacilityFormModal`, suspend/activate confirmation.<br>**Output/actions:** Four network KPIs (active facilities, total units, average occupancy, monthly revenue), branch performance table. | `UC-022` |
| **SCR-016**<br>`/operations/policies` | BUSINESS_MANAGER | Policies & Fees (`OperationsPoliciesPage`) | Tab 1: seven business parameters, Old-New comparison before saving. Tab 2: unit-type price ranges. Tab 3: `FeeEditModal` fee amounts/active status. | `UC-023`, `UC-024` |
| **SCR-017**<br>`/operations/reports` | BUSINESS_MANAGER | Chain Reports (`OperationsReportsPage`) | **Input:** This Month / This Quarter / Six Months / Full Year, facility, sortable columns.<br>**Output/actions:** Four summary KPIs with growth %, monthly revenue bars, facility occupancy bars, **Export CSV** (UTF-8 BOM). | `UC-025` |
| **SCR-018**<br>`/admin/security` | ADMIN | Accounts & Audit Logs (`AdminSecurityPage`) | **Input:** Users tab keyword/role/facility/status, `UserFormModal` and `facilityId`, disable/restore dialog; Logs tab action/keyword filters.<br>**Output/actions:** System-wide account lifecycle and access/action history with IP addresses. | `UC-026`, `UC-027`, `UC-028` |

---

## 3.5 Screen & API Authorization Matrix

**Legend:** `G` = Guest; `C` = CUSTOMER; `FS` = FACILITY_STAFF; `FM` = FACILITY_MANAGER; `BM` = BUSINESS_MANAGER; `A` = ADMIN.
- `Y` = Full access through Frontend and Backend.
- `-` = Denied by route guards and/or HTTP `401`/`403`.
- `Y*` = Backend API access for administration/operations support, but hidden/blocked in role-specific Frontend navigation (or limited to preview before API submission).

| Screen / API Function Group | G | C | FS | FM | BM | A | Conditions, Data Scope & Backend Notes |
|---|---|---|---|---|---|---|---|
| **SCR-001..003** Catalog & Availability (`GET /facilities/**`, `/unit-types`, `/availability`) | Y | Y | Y | Y | Y | Y | Public `permitAll`; customer portal returns only `ACTIVE` facilities (BR-011). |
| **SCR-009** Registration / Email / Google (`/auth/**`, `/oauth2/**`) | Y | Y | Y | Y | Y | Y | Self-registration/first Google login always creates `CUSTOMER`. Authenticated `/auth` redirects to role default. |
| **SCR-004** Atomic Hold (`POST /api/v1/rentals/holds`) | - | Y | - | - | - | Y* | Guests preview Steps 1-3; submission requires authentication. `SecurityConfig`: `hasAnyRole("ADMIN","CUSTOMER")`. |
| **SCR-006** My Rentals / Cancel / Renew / Return (`/rentals/me`, `/rentals/{id}/**`) | - | Y | - | - | - | Y* | Check `rental.customer_id == currentUserId` (`RentalService.ownedRental`, BR-013). |
| **SCR-007 & SCR-005** Invoices / VNPay / Results (`/invoices/**`, `/payments/**`) | - | Y | - | - | - | Y* | Invoice owner alone creates payment URL/reads attempt. IPN and Return endpoints are public with HMAC-SHA512 validation. |
| **SCR-008** Customer Support (`/support-tickets`, `/support-tickets/me`) | - | Y | - | - | - | Y* | Customer creates tickets for own rental/facility; logs `SUPPORT_TICKET_CREATED`. |
| **SCR-013** Daily Work / Self-assigned Tickets (`/staff/operations`, `/ops/tasks/**`, `/ops/tickets/**`) | - | - | Y | Y | Y* | Y* | `FacilityAccessService` scope; staff default `onlyMine = true`. |
| **SCR-011** Dashboard / Six-Month Revenue (`/facility/dashboard`, `GET /ops/facilities/{id}/dashboard`, `/revenue`) | - | - | - | Y | Y* | Y* | FE `RequireRole` permits assigned manager; BE `/ops/**` permits chain/admin global queries. See review notes below. |
| **SCR-012** Unit Create/Edit/Status (`/facility/units`, `/ops/units/**`) | - | - | - | Y | Y* | Y* | FE manager only; prices within type bounds (BR-004). Review: add BE checks preventing direct staff writes to `/ops/units`. |
| **SCR-014** Rental Monitoring / Assignment (`/facility/rentals`, `GET /ops/rentals`, `POST /ops/tasks`) | - | - | - | Y | Y* | Y* | FE manager only; assigned staff must be `ACTIVE` at the same facility as rental/ticket. |
| **SCR-015** Facility Network / Suspension (`/operations/facilities`, `/management/facilities/**`) | - | - | - | - | Y | Y* | `hasAnyRole("ADMIN", "BUSINESS_MANAGER")`; block suspension with effective rentals (BR-011). |
| **SCR-016** Policies / Fee Types (`/operations/policies`, `/management/policy`, `/management/fee-types/**`) | - | - | - | - | Y | Y* | Singleton `business_policies(id = 1)` and `fee_types`; record updater/time. |
| **SCR-017** Chain Reports / CSV (`/operations/reports`, `GET /management/reports`) | - | - | - | - | Y | Y* | All facilities or `facilityId` filter; `month` / `quarter` / `halfYear` / `year`. |
| **SCR-018** Accounts / Roles / Audit (`/admin/security`, `/admin/users/**`, `/admin/activity-logs`) | - | - | - | - | - | Y | FE/BE both `hasRole("ADMIN")`; obey `ck_users_facility_scope` and last-admin protection (BR-014). |

---

## 3.6 Non-Screen Functions

Five background/state-synchronization/server-integration functions have no direct user screen.

| NFN ID | Trigger / Frequency | Processing & Business Rules | Output / Errors / Idempotency |
|---|---|---|---|
| **NFN-001** Inline Hold Expiry Sweep | Synchronously at the start of `GET /api/v1/availability`, `/api/v1/rentals/me`, `/api/v1/rentals/{id}`. | `RentalService.expireStaleHolds()` finds `PENDING_PAYMENT` records with `payment_expires_at < Instant.now()` (15 minutes, BR-003); sets rentals and associated pending invoices `EXPIRED`. | Immediately releases availability without cron lag. Repeated calls on expired records have no side effects; `Invoice.markExpired()` checks `PENDING`. |
| **NFN-002** VNPay Server IPN Handler | Asynchronous VNPay webhook: `GET /api/v1/payments/vnpay/ipn`. | `VnPayIpnService.handleIpn()` validates HMAC in constant time, TmnCode, TxnRef, amount x100; `PaymentService.handleGatewayResult()` settles attempt/invoice/rental (`RESERVED`) or renewal (`APPLIED`) (BR-008/009/010). | JSON `RspCode`: `00` success, `01` order not found, `02` already confirmed, `04` wrong amount, `97` bad signature, `99` system error. Duplicate callbacks return `02`; `uq_payment_attempts_one_success` prevents double success. |
| **NFN-003** VNPay Browser Return Verifier | Browser redirected to `GET /api/v1/payments/vnpay/return`. | `VnPayController.returnUrl()` verifies HMAC-SHA512; never updates the DB (BR-009). | `303 SEE_OTHER` to `${vnpay.frontend-return-url}` (`/payment/result`) with reference/status or `returnVerified=false` for tampering. |
| **NFN-004** Google OIDC Callback & Token Rotation | `GET /api/v1/login/oauth2/code/google`; background `POST /api/v1/auth/cookie/refresh`. | Validate PKCE/OIDC (`email_verified == true`); lookup/create case-sensitive `social_identities.provider_subject` (`utf8mb4_bin`); store SHA-256 refresh-token hashes, revoke old tokens on rotation (CR-001, BR-015). | HttpOnly Cookies: `storage_access_token` 30 minutes, `storage_refresh_token` seven days. Destroy temporary session; safely redirect to `/auth?oauth=success` or `email_conflict`, `account_disabled`, `authentication_failed`. |
| **NFN-005** Automated MySQL Backup & Retention | Scheduled OS execution of `infra/ec2/backup-mysql.sh` on AWS EC2 staging/production. | `mysqldump --single-transaction --routines --triggers` consistently exports InnoDB without locking reads; compress UTC-timestamped `.sql.gz`. | Store on encrypted EBS, remove backups older than `RETENTION_DAYS` (default seven). Nonzero exit immediately on connection/compression failure (`pipefail`). |

---

## 3.7 UML State Diagrams

This section specifies **five UML 2.5 State Machine Diagrams**, exceeding the SWR302 minimum of three. States, triggers, `[guards]`, and `/ actions` correspond to Backend enums and services as described in the source document.

### 17. Rental State Diagram (`STATE-01` - `Rental` / `RentalStatus`)

> **[Insert Diagram #17 - UML State Machine Diagram (`STATE-01`) here]**
> - **Diagram type:** UML 2.5 State Machine Diagram.
> - **Eight states:** `PENDING_PAYMENT` (15-minute hold blocking inventory), `RESERVED` (paid, awaiting handover), `ACTIVE` (current rental, unit occupied), `OVERDUE` (rental/payment overdue), `RETURN_REQUESTED` (return scheduled), `RETURNED` (terminal), `CANCELLED` (terminal), `EXPIRED` (15-minute hold expired).
> - **Transitions (`event [guard] / action`):**
>   - `[*] -> PENDING_PAYMENT`: `createHold() [facility ACTIVE & available unit locked] / assign unit_id, create Invoice(RENTAL, PENDING)`.
>   - `PENDING_PAYMENT -> RESERVED`: `handleGatewayResult() [IPN RspCode=00 & Invoice=RENTAL] / Invoice -> PAID`.
>   - `PENDING_PAYMENT -> CANCELLED`: `cancel() [rental owner] / expirePendingInvoices()`.
>   - `PENDING_PAYMENT -> EXPIRED`: `expireStaleHolds() [now > payment_expires_at] / expirePendingInvoices(), release unit schedule`.
>   - `EXPIRED -> RESERVED`: `recoveryTransition() [exceptional reconciliation fallback]`.
>   - `RESERVED -> ACTIVE`: `completeHandover() [Task=HANDOVER & accessMethod != null] / checked_in_at, unit -> OCCUPIED`.
>   - `RESERVED -> CANCELLED`: `cancel() [rental owner] / release unit schedule`.
>   - `ACTIVE -> ACTIVE`: `handleGatewayResult() [IPN RspCode=00 & Invoice=RENEWAL] / extend end_date, Renewal -> APPLIED`.
>   - `ACTIVE -> OVERDUE`: `markOverdue() [term expired without renewal]`.
>   - `ACTIVE -> RETURN_REQUESTED`, `OVERDUE -> RETURN_REQUESTED`: `requestReturn() [requestedDate >= startDate & staff on duty] / create Task(RETURN_INSPECTION)`.
>   - `RETURN_REQUESTED -> ACTIVE`: `cancelReturnRequest() [customer withdraws request]`.
>   - `ACTIVE -> RETURNED`, `OVERDUE -> RETURNED`, `RETURN_REQUESTED -> RETURNED`: `completeReturn() [Task=RETURN_INSPECTION & returned_at >= checked_in_at] / returned_at, unit -> INSPECTION`.
>   - `RETURNED -> [*]`, `CANCELLED -> [*]`.

### 18. Physical Storage Unit State Diagram (`STATE-02`)

> **[Insert Diagram #18 - UML State Machine Diagram (`STATE-02`) here]**
> - **Diagram type:** UML 2.5 State Machine Diagram for `StorageUnit` / `StorageUnitStatus`.
> - **Four states:** `AVAILABLE` (ready/bookable), `OCCUPIED` (customer belongings present; non-overlapping future bookings allowed), `INSPECTION` (post-return inspection, new bookings blocked), `MAINTENANCE` (repair, new bookings blocked).
> - **Transitions:**
>   - `[*] -> AVAILABLE`: `createUnit() [monthlyPrice within UnitType range]`.
>   - `AVAILABLE -> OCCUPIED`: `completeHandover() [Rental=RESERVED]` or `changeUnitStatus() [reason != blank]`.
>   - `AVAILABLE -> MAINTENANCE`: `changeUnitStatus() [FACILITY_MANAGER & reason != blank]`.
>   - `OCCUPIED -> INSPECTION`: `completeReturn() [customer returns unit]` or `changeUnitStatus()`.
>   - `INSPECTION -> AVAILABLE`: `completeUnitInspection() [result == PASS]` or `changeUnitStatus()`.
>   - `INSPECTION -> MAINTENANCE`: `completeUnitInspection() [result != PASS]` or `changeUnitStatus()`.
>   - `MAINTENANCE -> AVAILABLE`: `changeUnitStatus() [technical repair complete]`.

### 19. Invoice & PaymentAttempt State Diagram (`STATE-03`)

> **[Insert Diagram #19 - UML State Machine Diagram (`STATE-03`) here]**
> - **Diagram type:** UML 2.5 state machine with two parallel regions.
> - **Region A - Invoice.Status (five states):** `PENDING`, `PAID`, `EXPIRED` (hold expiry/rental cancellation), `CANCELLED`, `WAIVED`.
>   - `[*] -> PENDING : Invoice.create(RENTAL / RENEWAL / EXTRA / OVERDUE)`.
>   - `PENDING -> PAID : markPaid() [PaymentAttempt -> SUCCESS]`.
>   - `PENDING -> EXPIRED : markExpired() [hold older than 15 minutes or rental cancelled]`.
>   - `PENDING -> CANCELLED : markCancelled()`; `PENDING -> WAIVED : markWaived()`.
>   - `PAID`, `EXPIRED`, `CANCELLED`, `WAIVED` -> `[*]`.
> - **Region B - PaymentAttempt.Status (four states):** `PENDING` (VNPay URL created), `SUCCESS` (IPN `00`, at most one per invoice), `FAILED` (bank rejection/customer cancellation), `REFUNDED` (audited manual refund).
>   - `[*] -> PENDING : startAttempt() [Invoice=PENDING & amount=totalAmount]`.
>   - `PENDING -> SUCCESS : succeed() [valid IPN HMAC & RspCode=00] / paid_at, gateway_transaction_no`.
>   - `PENDING -> FAILED : fail() [IPN RspCode != 00]`.
>   - `SUCCESS -> REFUNDED : refund() [record refunded_at, refunded_by_user_id, refund_note] / release success_invoice_id`.

### 20. Support Ticket State Diagram (`STATE-04`)

> **[Insert Diagram #20 - UML State Machine Diagram (`STATE-04`) here]**
> - **Diagram type:** UML 2.5 state machine for `SupportTicket` / `SupportTicket.Status`.
> - **Four states:** `OPEN` (received), `IN_PROGRESS` (facility processing), `RESOLVED`, `CLOSED`.
> - **Transitions:**
>   - `[*] -> OPEN`: `SupportTicketService.create() [customer submission] / ActivityLog(SUPPORT_TICKET_CREATED)`.
>   - `OPEN -> OPEN`: `assignTicket(staffId) [assign staff & create SUPPORT task]`.
>   - `OPEN -> IN_PROGRESS`: `startTicket() [staff begins investigation]`.
>   - `IN_PROGRESS -> IN_PROGRESS`: `assignTicket(sameStaffId) [update assignment notes]`.
>   - `IN_PROGRESS -> RESOLVED`: `resolveTicket() / resolved_at = UTC_NOW`.
>   - `RESOLVED -> CLOSED`: `closeTicket() [manager/staff confirms closure]`.
>   - `CLOSED -> [*]`.

### 21. StaffTask & RentalRenewal State Diagram (`STATE-05`)

> **[Insert Diagram #21 - UML State Machine Diagram (`STATE-05`) here]**
> - **Diagram type:** UML 2.5 with two state machines.
> - **Region A - StaffTask / TaskStatus:** `ASSIGNED`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
>   - `[*] -> ASSIGNED : assignTask() / requestReturn() / assignTicket()`.
>   - `ASSIGNED -> IN_PROGRESS : startTask()`.
>   - `ASSIGNED -> DONE : completeHandover / completeReturn / completeInspection` (combines the start step via `startIfNotStarted`).
>   - `IN_PROGRESS -> DONE : complete() / completed_at = UTC_NOW`.
>   - `ASSIGNED -> CANCELLED`, `IN_PROGRESS -> CANCELLED : cancel()`; `DONE`, `CANCELLED` -> `[*]`.
> - **Region B - RentalRenewal / RenewalStatus:** `REQUESTED` (request and invoice created), `APPROVED` (manual-approval fallback), `APPLIED` (paid and end date extended), `REJECTED`.
>   - `[*] -> REQUESTED : requestRenewal() [no booking conflict]`.
>   - `REQUESTED -> APPLIED : PaymentService.handleGatewayResult() [successful IPN] / rental.extendTo(requestedEndDate)`.
>   - `REQUESTED -> APPROVED : approve()`; `APPROVED -> APPLIED : apply()`.
>   - `REQUESTED -> REJECTED`, `APPROVED -> REJECTED : reject()`; `APPLIED`, `REJECTED` -> `[*]`.

---

## 3.8 Level-1 Data Flow Diagrams

This section specifies **four Level-1 DFDs**, exceeding the SWR302 minimum of three. Yourdon/DeMarco notation:
- **External entity:** Rectangle `[E1: Actor Name]`.
- **Process:** Circle/rounded shape with hierarchical numbering `((1.1 Process Name))`.
- **Data store:** Storage cylinder `[("D1: table_name")]`.
- **Data flow:** Arrow labeled with a noun describing the transmitted data package. No store-to-store or external-entity-to-store flow may bypass a process.

### 22. `DFD-L1-01`: Process 1.0 - Availability Search & Atomic Hold

> **[Insert Diagram #22 - Data Flow Diagram Level 1 (`DFD-L1-01`) here]**
> - **Type:** Yourdon/DeMarco Level-1 DFD.
> - **External entity:** `E1: Guest & CUSTOMER`.
> - **Processes:** `1.1 Expire Holds Older than 15 Minutes`; `1.2 Search Catalog & Calculate Availability`; `1.3 Pessimistically Lock Unit & Create Hold`; `1.4 Issue Initial Rental Invoice`.
> - **Stores:** `D1: facilities & unit_types`, `D2: storage_units`, `D3: rentals`, `D4: business_policies`, `D5: invoices`.
> - **Flows:**
>   - `E1 -> 1.1` (search `facilityId, startDate, endDate`); `D3 <-> 1.1` (read expired `PENDING_PAYMENT` holds, set `EXPIRED`); `1.1 -> D5` (pending invoices -> expired); `1.1 -> 1.2`.
>   - `D1, D2, D3 -> 1.2` (active facilities, units, overlapping blocking rentals `[start, end)`); `1.2 -> E1` (available counts/price ranges).
>   - `E1 -> 1.3` (hold request `facilityId, unitTypeId, startDate, rentalMonths`); `D1, D2, D3 -> 1.3` (`FOR UPDATE`-locked candidate); `1.3 -> D3` (new rental `PENDING_PAYMENT`, `unit_id`, price snapshot); `1.3 -> 1.4`.
>   - `D4 -> 1.4` (`deposit_percent`); `1.4 -> D5` (`Invoice RENTAL, PENDING, rent + deposit`); `1.4 -> E1` (receipt `unitCode, holdExpiresAt, totalAmount`).

### 23. `DFD-L1-02`: Process 2.0 - Invoicing & Online VNPay Payment

> **[Insert Diagram #23 - Data Flow Diagram Level 1 (`DFD-L1-02`) here]**
> - **Type:** Yourdon/DeMarco Level-1 DFD.
> - **Entities:** `E1: CUSTOMER`, `E2: VNPay Gateway v2.1.0`.
> - **Processes:** `2.1 Start Payment Attempt & Sign URL`; `2.2 Verify Browser Return Signature`; `2.3 Validate IPN & Reconcile Transaction`; `2.4 Confirm Reservation / Apply Renewal`; `2.5 Poll Payment Status`.
> - **Stores:** `D5: invoices`, `D6: payment_attempts`, `D3: rentals`, `D7: rental_renewals`.
> - **Flows:**
>   - `E1 -> 2.1` (`invoiceId`, client IP), `D5 -> 2.1` (`PENDING` invoice); `2.1 -> D6` (`PaymentAttempt PENDING, vnp_TxnRef`); `2.1 -> E1 -> E2` (HMAC-SHA512-signed URL).
>   - `E2 -> 2.2 -> E1` (Browser Return parameters -> `HTTP 303` and `returnVerified`).
>   - `E2 -> 2.3` (IPN webhook); `D6 <-> 2.3` (check/update `SUCCESS/FAILED`, `paid_at`, `transaction_no`); `2.3 -> E2` (`RspCode 00/01/02/04/97`); `2.3 -> 2.4`.
>   - `2.4 -> D5` (invoice `PAID`); `2.4 -> D3` (rental `PENDING_PAYMENT -> RESERVED` or extend `end_date`); `2.4 -> D7` (renewal `REQUESTED -> APPLIED`).
>   - `E1 <-> 2.5 <-> D6` (reference query and final verified payment result).

### 24. `DFD-L1-03`: Process 3.0 - Handover, Renewal, Return & Inspection

> **[Insert Diagram #24 - Data Flow Diagram Level 1 (`DFD-L1-03`) here]**
> - **Type:** Yourdon/DeMarco Level-1 DFD.
> - **Entities:** `E1: CUSTOMER`, `E3: FACILITY_MANAGER`, `E4: FACILITY_STAFF`.
> - **Processes:** `3.1 Assign Facility Tasks`; `3.2 Check-in Handover`; `3.3 Receive Renewal / Return Requests`; `3.4 Check-out Return`; `3.5 Inspect Unit`.
> - **Stores:** `D8: users`, `D3: rentals`, `D2: storage_units`, `D9: staff_tasks`, `D7: rental_renewals`, `D5: invoices`.
> - **Flows:**
>   - `E3 -> 3.1` (`taskType, rentalId, staffId, scheduledAt`), `D8, D3 -> 3.1`; `3.1 -> D9` (`StaffTask ASSIGNED`).
>   - `E4 -> 3.2` (`taskId, accessMethod, handoverCondition`), `D9, D3 -> 3.2`; `3.2 -> D3` (rental `ACTIVE`, `checked_in_at`); `3.2 -> D2` (unit `OCCUPIED`); `3.2 -> D9` (task `DONE`).
>   - `E1 -> 3.3` (`additionalMonths` or `requestedDate`), `D3, D8 -> 3.3`; `3.3 -> D7` (renewal `REQUESTED`), `3.3 -> D5` (renewal invoice), or `3.3 -> D3` (rental `RETURN_REQUESTED`) and `3.3 -> D9` (`RETURN_INSPECTION` task).
>   - `E4 -> 3.4` (`taskId, returnCondition`); `3.4 -> D3` (rental `RETURNED`, `returned_at`); `3.4 -> D2` (unit `INSPECTION`); `3.4 -> D9` (task `DONE`).
>   - `E4 -> 3.5` (`taskId, result PASS/FAIL, notes`), `D2 -> 3.5`; `3.5 -> D2` (unit `AVAILABLE`/`MAINTENANCE`); `3.5 -> D9` (task `DONE`).

### 25. `DFD-L1-04`: Process 4.0 - Customer Support & Ticket Coordination

> **[Insert Diagram #25 - Data Flow Diagram Level 1 (`DFD-L1-04`) here]**
> - **Type:** Yourdon/DeMarco Level-1 DFD.
> - **Entities:** `E1: CUSTOMER`, `E3: FACILITY_MANAGER`, `E4: FACILITY_STAFF`.
> - **Processes:** `4.1 Create Support Ticket & Audit Log`; `4.2 Assign / Self-assign Ticket & Create Task`; `4.3 Handle Incident, Resolve & Close Ticket`.
> - **Stores:** `D3: rentals`, `D10: support_tickets`, `D8: users`, `D9: staff_tasks`, `D11: activity_logs`.
> - **Flows:**
>   - `E1 -> 4.1` (`facilityId, rentalId, category, title, description`), `D3 -> 4.1`; `4.1 -> D10` (`SupportTicket OPEN`); `4.1 -> D11` (`SUPPORT_TICKET_CREATED`); `4.1 -> E1` (ticket ID).
>   - `E3 / E4 -> 4.2` (assignment/self-assignment `ticketId, staffId`), `D8, D10 -> 4.2`; `4.2 -> D10` (`assigned_staff_id`); `4.2 -> D9` (`StaffTask SUPPORT, ASSIGNED`).
>   - `E4 / E3 -> 4.3` (start/resolution/closure); `4.3 -> D9` (`IN_PROGRESS -> DONE`); `4.3 -> D10` (`IN_PROGRESS -> RESOLVED -> CLOSED`); `D10 -> E1` (updated ticket progress).

---

## 3.9 Data Models & Entity Descriptions

### 26. Conceptual Domain Class Diagram (`DATA-01`)

> **[Insert Diagram #26 - UML Conceptual Domain Class Diagram (`DATA-01`) here]**
> - **Type:** UML 2.5 Conceptual Class Diagram: class names, principal business attributes, and multiplicities only; omit physical SQL column types.
> - **Fifteen domain classes and attributes:**
>   1. `Facility`: `code, name, address, status`.
>   2. `UnitType`: `name, sizeM2, minMonthlyPrice, maxMonthlyPrice`.
>   3. `StorageUnit`: `unitCode, locationLabel, monthlyPrice, status`.
>   4. `User`: `fullName, email, phone, role, status`.
>   5. `SocialIdentity`: `provider, providerSubject`.
>   6. `RefreshToken`: `tokenHash, expiresAt, revokedAt`.
>   7. `BusinessPolicy`: `depositPercent, renewalNoticeDays, cancellationFee, returnNoticeDays, overdueGraceDays, overdueFeePerDay, maxDiscountPercent`.
>   8. `FeeType`: `code, name, defaultAmount, active`.
>   9. `Rental`: `startDate, endDate, pricePerMonth, status, paymentExpiresAt, checkedInAt, accessMethod, returnedAt`.
>   10. `RentalRenewal`: `previousEndDate, requestedEndDate, status, requestedAt, decidedAt`.
>   11. `Invoice`: `invoiceType, amount, discountAmount, totalAmount, dueAt, status`.
>   12. `PaymentAttempt`: `method, amount, providerReference, gatewayTransactionNo, status, paidAt, refundedAt`.
>   13. `SupportTicket`: `category, title, description, status, resolvedAt`.
>   14. `StaffTask`: `taskType, scheduledAt, status, completedAt, notes`.
>   15. `ActivityLog`: `action, entityType, entityId, ipAddress, createdAt`.
> - **Associations / Compositions & Multiplicities:**
>   - `Facility (1) *-- (0..*) StorageUnit` (owns premises).
>   - `UnitType (1) --> (0..*) StorageUnit` (size/price classification).
>   - `Facility (0..1) --> (0..*) User` (staff/manager assignment).
>   - `User (1) *-- (0..*) RefreshToken` (sessions); `User (1) *-- (0..*) SocialIdentity` (OAuth2 links).
>   - `User (0..1) --> (0..*) ActivityLog` (audit); `User (0..1) --> (0..1) BusinessPolicy` (last updater).
>   - `User (1) --> (0..*) Rental` (customer); `StorageUnit (1) --> (0..*) Rental` (date-based allocation).
>   - `Rental (1) *-- (0..*) RentalRenewal` (renewals); `Rental (1) *-- (1..*) Invoice` (billing).
>   - `RentalRenewal (0..1) --> (0..1) Invoice` (renewal invoice); `FeeType (0..1) --> (0..*) Invoice` (`EXTRA` fees).
>   - `Invoice (1) *-- (0..*) PaymentAttempt` (payment attempts); `User (0..1) --> (0..*) PaymentAttempt` (refund confirmation).
>   - `User (1) --> (0..*) SupportTicket` (requester); `Facility (1) --> (0..*) SupportTicket` (receiving facility); `Rental (0..1) --> (0..*) SupportTicket` (related rental); `User (0..1) --> (0..*) SupportTicket` (assigned staff).
>   - `User (1) --> (0..*) StaffTask` (assignee); `Rental (0..1) --> (0..*) StaffTask` (unit tasks); `SupportTicket (0..1) --> (0..*) StaffTask` (support tasks).

---

### 27. Logical Data Model (`DATA-02` - All 15 MySQL 8.4 Tables)

> **[Insert Diagram #27 - Logical Entity-Relationship Diagram (`DATA-02`) here]**
> - **Type:** Crow's Foot Logical ERD - 15 MySQL 8.4 InnoDB tables accumulated from Flyway `V001` through `V010`.
> - **Tables, columns, data types, and keys (PK / FK / UK) to show:**

>   1. **`facilities`**: `id` (`BIGINT PK`), `code` (`VARCHAR(30) UK`), `name` (`VARCHAR(150)`), `address` (`TEXT`), `status` (`VARCHAR(12)`: `ACTIVE|INACTIVE`), `created_at` (`DATETIME(6)`).
>   2. **`users`**: `id` (`BIGINT PK`), `facility_id` (`BIGINT FK NULL -> facilities.id`), `full_name` (`VARCHAR(120)`), `email` (`VARCHAR(255) UK`), `phone` (`VARCHAR(30)`), `password_hash` (`TEXT`), `role` (`VARCHAR(24)`: 5 roles), `status` (`VARCHAR(12)`: `ACTIVE|DISABLED`), `created_at` (`DATETIME(6)`).
>   3. **`refresh_tokens`**: `id` (`BIGINT PK`), `user_id` (`BIGINT FK -> users.id`), `token_hash` (`VARCHAR(64) UK`), `expires_at` (`DATETIME(6)`), `revoked_at` (`DATETIME(6) NULL`), `created_at` (`DATETIME(6)`).
>   4. **`social_identities`**: `id` (`BIGINT PK`), `provider` (`VARCHAR(16)`), `provider_subject` (`VARCHAR(255) utf8mb4_bin`), `user_id` (`BIGINT FK -> users.id`) - `UK(provider, provider_subject)`.
>   5. **`unit_types`**: `id` (`BIGINT PK`), `name` (`VARCHAR(80) UK`), `size_m2` (`DECIMAL(8,2)`), `min_monthly_price` (`DECIMAL(14,2)`), `max_monthly_price` (`DECIMAL(14,2)`), `description` (`TEXT`).
>   6. **`storage_units`**: `id` (`BIGINT PK`), `facility_id` (`BIGINT FK -> facilities.id`), `unit_type_id` (`BIGINT FK -> unit_types.id`), `unit_code` (`VARCHAR(40)`), `location_label` (`VARCHAR(100)`), `monthly_price` (`DECIMAL(14,2)`), `status` (`VARCHAR(16)`: `AVAILABLE|OCCUPIED|INSPECTION|MAINTENANCE`) - `UK(facility_id, unit_code)`.
>   7. **`business_policies`**: `id` (`SMALLINT PK = 1`), `deposit_percent` (`DECIMAL(5,2)`), `renewal_notice_days` (`INT`), `cancellation_fee` (`DECIMAL(14,2)`), `return_notice_days` (`INT`), `overdue_grace_days` (`INT`), `overdue_fee_per_day` (`DECIMAL(14,2)`), `max_discount_percent` (`DECIMAL(5,2)`), `updated_by_user_id` (`BIGINT FK NULL -> users.id`), `updated_at` (`DATETIME(6)`).
>   8. **`fee_types`**: `id` (`BIGINT PK`), `code` (`VARCHAR(40) UK`), `name` (`VARCHAR(120)`), `default_amount` (`DECIMAL(14,2)`), `active` (`BOOLEAN`).
>   9. **`rentals`**: `id` (`BIGINT PK`), `customer_id` (`BIGINT FK -> users.id`), `unit_id` (`BIGINT FK -> storage_units.id`), `start_date` (`DATE`), `end_date` (`DATE`), `appointment_at` (`DATETIME(6) NULL`), `price_per_month` (`DECIMAL(14,2)`), `status` (`VARCHAR(20)`: 8 states), `payment_expires_at` (`DATETIME(6) NULL`), `checked_in_at` (`DATETIME(6) NULL`), `access_method` (`VARCHAR(20) NULL`), `handover_condition` (`TEXT NULL`), `returned_at` (`DATETIME(6) NULL`), `return_condition` (`TEXT NULL`), `created_at` (`DATETIME(6)`).
>   10. **`rental_renewals`**: `id` (`BIGINT PK`), `rental_id` (`BIGINT FK -> rentals.id`), `previous_end_date` (`DATE`), `requested_end_date` (`DATE`), `status` (`VARCHAR(12)`: `REQUESTED|APPROVED|REJECTED|APPLIED`), `approved_by_user_id` (`BIGINT FK NULL -> users.id`), `requested_at` (`DATETIME(6)`), `decided_at` (`DATETIME(6) NULL`).
>   11. **`invoices`**: `id` (`BIGINT PK`), `rental_id` (`BIGINT FK -> rentals.id`), `renewal_id` (`BIGINT FK UK NULL -> rental_renewals.id`), `fee_type_id` (`BIGINT FK NULL -> fee_types.id`), `invoice_type` (`VARCHAR(12)`: `DEPOSIT|RENTAL|RENEWAL|EXTRA|OVERDUE`), `description` (`TEXT`), `amount` (`DECIMAL(14,2)`), `discount_amount` (`DECIMAL(14,2)`), `total_amount` (`DECIMAL(14,2) GENERATED STORED`), `due_at` (`DATETIME(6)`), `status` (`VARCHAR(12)`: `PENDING|PAID|WAIVED|CANCELLED|EXPIRED`), `created_at` (`DATETIME(6)`).
>   12. **`payment_attempts`**: `id` (`BIGINT PK`), `invoice_id` (`BIGINT FK -> invoices.id`), `amount` (`DECIMAL(14,2)`), `method` (`VARCHAR(30)`), `provider_reference` (`VARCHAR(120) UK`), `gateway_transaction_no` (`VARCHAR(120) NULL`), `status` (`VARCHAR(12)`: `PENDING|SUCCESS|FAILED|REFUNDED`), `paid_at` (`DATETIME(6) NULL`), `refunded_at` (`DATETIME(6) NULL`), `refunded_by_user_id` (`BIGINT FK NULL -> users.id`), `refund_note` (`VARCHAR(255) NULL`), `created_at` (`DATETIME(6)`), `success_invoice_id` (`BIGINT GENERATED STORED UK`).
>   13. **`support_tickets`**: `id` (`BIGINT PK`), `customer_id` (`BIGINT FK -> users.id`), `facility_id` (`BIGINT FK -> facilities.id`), `rental_id` (`BIGINT FK NULL -> rentals.id`), `assigned_staff_id` (`BIGINT FK NULL -> users.id`), `category` (`VARCHAR(20)`), `title` (`VARCHAR(200)`), `description` (`TEXT`), `status` (`VARCHAR(16)`: `OPEN|IN_PROGRESS|RESOLVED|CLOSED`), `created_at` (`DATETIME(6)`), `resolved_at` (`DATETIME(6) NULL`).
>   14. **`staff_tasks`**: `id` (`BIGINT PK`), `assigned_staff_id` (`BIGINT FK -> users.id`), `rental_id` (`BIGINT FK NULL -> rentals.id`), `ticket_id` (`BIGINT FK NULL -> support_tickets.id` - XOR with `rental_id`), `task_type` (`VARCHAR(20)`: `HANDOVER|RETURN_INSPECTION|UNIT_INSPECTION|SUPPORT`), `scheduled_at` (`DATETIME(6)`), `status` (`VARCHAR(12)`: `ASSIGNED|IN_PROGRESS|DONE|CANCELLED`), `completed_at` (`DATETIME(6) NULL`), `notes` (`TEXT NULL`).
>   15. **`activity_logs`**: `id` (`BIGINT PK`), `user_id` (`BIGINT FK NULL -> users.id`), `action` (`VARCHAR(80)`), `entity_type` (`VARCHAR(60)`), `entity_id` (`BIGINT`), `ip_address` (`VARCHAR(45)`), `metadata` (`JSON`), `created_at` (`DATETIME(6)`).

---

---

### 3.9.3 Entity Descriptions / Data Dictionary

| Table / Entity | Business Meaning | PK / FK | Relationships & Main Integrity Constraints |
|---|---|---|---|
| **facilities** (`Facility`) | Physical storage branches in the business network. | PK `id BIGINT` | 1:N with units, users, support tickets; unique `uq_facilities_code`; `ck_facilities_status`: `ACTIVE`/`INACTIVE`. |
| **users** (`User`) | Identity accounts for five system roles. | PK `id BIGINT`; FK `facility_id -> facilities(id)` (`ON DELETE RESTRICT`) | Unique `uq_users_email`; five roles via `ck_users_role`; `ck_users_facility_scope`: staff/manager require facility, customer/business manager/admin require NULL. |
| **refresh_tokens** (`RefreshToken`) | SHA-256 JWT refresh-token hashes for rotation/revocation. | PK `id BIGINT`; FK `user_id -> users(id)` (`ON DELETE CASCADE`) | `uq_refresh_tokens_hash`, no raw JWT stored; `ix_refresh_tokens_user(user_id, expires_at)`. |
| **social_identities** (`SocialIdentity`) | Links users to external Google OAuth2/OIDC identities. | PK `id BIGINT`; FK `user_id -> users(id)` | `uk_social_identity`: unique `(provider, provider_subject)`; case-sensitive `utf8mb4_bin` subject (V010). |
| **unit_types** (`UnitType`) | Standardized areas (m²) and monthly price bounds. | PK `id BIGINT` | Unique `uq_unit_types_name`; `ck_unit_types_size`: `size_m2 > 0`; `ck_unit_types_price_range`: `0 <= min_monthly_price <= max_monthly_price`. |
| **storage_units** (`StorageUnit`) | Specific physical unit; row locked `FOR UPDATE` during allocation. | PK `id BIGINT`; FKs `facility_id -> facilities(id)`, `unit_type_id -> unit_types(id)` | `uq_storage_units_facility_code`: unique facility/code; `ck_storage_units_status`: four physical states; price must be within unit-type min/max. |
| **business_policies** (`BusinessPolicy`) | Singleton holding seven global commercial parameters. | PK `id SMALLINT`, default 1; FK `updated_by_user_id -> users(id)` (`SET NULL`) | `ck_business_policies_singleton`: `CHECK(id = 1)`; deposit/discount percentages in `[0,100]`; fees/days >= 0. |
| **fee_types** (`FeeType`) | Standard service/penalty fee catalog for `EXTRA` invoices. | PK `id BIGINT` | Unique `uq_fee_types_code`; `ck_fee_types_amount`: `default_amount >= 0`. |
| **rentals** (`Rental`) | Central rental/hold entity for `[start_date, end_date)`. | PK `id BIGINT`; FKs `customer_id -> users(id)`, `unit_id -> storage_units(id)` | `ck_rentals_dates`: end > start; `ck_rentals_status`: eight states; `ck_rentals_pending_expiry`: pending requires expiry; `ck_rentals_return_order`: returned >= checked-in. |
| **rental_renewals** (`RentalRenewal`) | History of customer requests to extend an existing rental. | PK `id BIGINT`; FKs `rental_id -> rentals(id)`, `approved_by_user_id -> users(id)` | `ck_rental_renewals_extends`: requested end > previous end; `ck_rental_renewals_status`: `REQUESTED`, `APPROVED`, `REJECTED`, `APPLIED`. |
| **invoices** (`Invoice`) | Receivables for new rentals, renewals, deposits, overdue charges, and extra fees. | PK `id BIGINT`; FKs rental, renewal, fee type | `total_amount = amount - discount_amount` (`GENERATED STORED`); `uq_invoices_renewal`: max one invoice/renewal; `ck_invoices_renewal_ref`, `ck_invoices_extra_ref` enforce type-specific references. |
| **payment_attempts** (`PaymentAttempt`) | Each VNPay transaction session, reconciliation, and refund status. | PK `id BIGINT`; FKs `invoice_id -> invoices(id)`, `refunded_by_user_id -> users(id)` | Unique `uq_payment_attempts_reference` (`vnp_TxnRef`); generated `success_invoice_id` + `uq_payment_attempts_one_success` prevent two successful payments on one invoice at DB level. |
| **support_tickets** (`SupportTicket`) | Customer technical/service support requests to their facility. | PK `id BIGINT`; FKs customer, facility, rental, assigned staff | `ck_support_tickets_category`: `UNIT`, `LOCK`, `ACCESS`, `PAYMENT`, `ITEMS`, `OTHER`; `ck_support_tickets_status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. |
| **staff_tasks** (`StaffTask`) | On-site handover, return, inspection, and support assignments. | PK `id BIGINT`; FKs assigned staff, rental, ticket | `ck_staff_tasks_target`: `SUPPORT` requires ticket and NULL rental; the three unit task types require rental and NULL ticket. |
| **activity_logs** (`ActivityLog`) | Immutable audit log of security/critical administrative actions with JSON metadata. | PK `id BIGINT`; FK `user_id -> users(id)` (`ON DELETE SET NULL`) | `ix_activity_logs_user_time(user_id, created_at DESC)` optimizes newest-first history. |

---

# 4. NON-FUNCTIONAL REQUIREMENTS

## 4.1 Usability & User Experience

| NFR ID | Requirement / Metric | Target / Acceptance Threshold | Verification Method |
|---|---|---|---|
| **4.1-01** | Time for a new customer to complete the three-step self-service hold wizard on `/reservation/new`. | Select facility/type/dates and create a hold in <= 3 minutes without external instructions. | User walkthrough & Playwright E2E (`role-flows.spec.ts`). |
| **4.1-02** | Learning time for new facility staff on `/staff/operations`. | Complete `HANDOVER` and `RETURN_INSPECTION` after <= 15 minutes of visual guidance. | Internal-role acceptance testing & `TaskDrawer` review. |
| **4.1-03** | UI feedback coverage on API-connected screens. | 100% of main screens clearly show loading (`SkeletonList`/`LoadingSpinner`), empty (`EmptyState`), network error (`ErrorState` + Retry), and confirmation for risky actions (cancel hold, disable account, save policy). | React source inspection & Vitest (`frontend/src/**/*.test.tsx`). |
| **4.1-04** | Accessibility and Vietnamese localization. | 100% of dialogs use `role="dialog"`, `aria-modal="true"`, Escape support; errors use `role="alert"`; visible `:focus-visible`; `vi-VN` currency (`₫`), `tabular-nums`, dates `dd/MM/yyyy`. | `src/components/ui/` inspection & live browser testing. |

## 4.2 Reliability & Transaction Safety

| NFR ID | Requirement / Metric | Target / Acceptance Threshold | Verification Method |
|---|---|---|---|
| **4.2-01** | Zero double-booking under concurrent requests for the same interval. | Zero cases of two overlapping blocking rentals assigned the same `unit_id`. | MySQL 8.4 Testcontainers integration (`RentalSelfCheck`, `SELECT ... FOR UPDATE`). |
| **4.2-02** | Idempotency/financial integrity for duplicate, invalid, or late IPN. | 100% of duplicates return `RspCode=02`, no second success; forged signatures (`97`) and mismatched amounts (`04`) fully blocked; late payments do not reclaim released units. | `VnPayIpnServiceTest`, `PaymentServiceTest`, `CustomerFlowE2ETests`. |
| **4.2-03** | Deterministic migration and monetary arithmetic. | 100% of local/CI/staging environments initialize empty DBs via Flyway `V001-V010`, `ddl-auto: validate`; money uses `DECIMAL(14,2)`, `BigDecimal`, `RoundingMode.HALF_UP`, without floating-point error. | GitHub Actions `./mvnw -B verify`; `StorageApplicationTests`. |
| **4.2-04** | Scheduled backups and disaster recovery. | `infra/ec2/backup-mysql.sh` produces consistent `--single-transaction` `.sql.gz` backups without read locks; retention at least seven days on encrypted EBS. | Script inspection and restoration drill on MySQL 8.4 container. |

## 4.3 Performance

| NFR ID | Requirement / Metric | Target / Acceptance Threshold | Verification Method |
|---|---|---|---|
| **4.3-01** | Public catalog/availability API response (`GET /facilities`, `/availability`). | p95 <= 500 ms under normal staging/demo load, supported by `ix_storage_units_facility_type`, `ix_rentals_status_end`. | HTTP integration timing on staging. |
| **4.3-02** | Atomic hold and IPN processing time. | Server p95 <= 1,000 ms, excluding user activity on VNPay/bank pages. | HTTP integration (`CustomerFlowE2ETests`). |
| **4.3-03** | Internal operations aggregation (`/ops/rentals`, `/ops/tasks`, `/ops/tickets`). | Avoid N+1: `OpsService.lookup()` batch-loads units/rentals/users/invoices through `IN` queries with a fixed query count independent of result rows. | `OpsService.java` inspection; `FacilityOpsE2ETests`. |
| **4.3-04** | Stable operation within AWS EC2 t3.medium resource limits. | Backend JVM <= 1,536 MB (`-XX:MaxRAMPercentage=55.0`); MySQL 8.4 <= 768 MB (`innodb_buffer_pool_size=256M`). | Container monitoring using `infra/ec2/docker-compose.staging.yml`. |

## 4.4 Reusability & Maintainability

| NFR ID | Requirement / Metric | Target / Acceptance Threshold | Verification Method |
|---|---|---|---|
| **4.4-01** | Shared UI Kit & Design Tokens across Customer/Internal channels. | Both `PublicLayout` and `WorkspaceLayout` share 100% of color/type tokens in `tokens.css` and 11 standard UI primitives in `frontend/src/components/ui/`, without overlapping heavy UI libraries. | `frontend/package.json`, `oxlint`, `tsc --noEmit`. |
| **4.4-02** | Modular Monolith separation and standardized API envelopes. | Business APIs use independent `account`, `facility`, `rental`, `ops`, `payment`, `support`, `management` packages and shared `ApiResponse<T>`, `GlobalExceptionHandler`, `ErrorCode`. | `com.storage.*` package review & integration tests. |
| **4.4-03** | Reuse of facility-scope and analytics services. | All branch checks use `FacilityAccessService`; occupancy/monthly revenue formulas use `com.storage.shared.service.Analytics`. | Backend source inspection (`commit f8e5499`). |

## 4.5 Scalability

| NFR ID | Requirement / Metric | Target / Acceptance Threshold | Verification Method |
|---|---|---|---|
| **4.5-01** | Expand facilities, unit types, and fee catalogs without code changes. | Add facilities/units and configure `fee_types`, `business_policies` through management UI at runtime. | `ManagementAdminE2ETests`, `FacilityManagementTests`. |
| **4.5-02** | Stateless security ready for separate CDN Frontend and API Backend. | `SessionCreationPolicy.STATELESS`, `NullSecurityContextRepository`, except temporary OAuth handshake sessions destroyed after callback; static Frontend delivered independently by Cloudflare Pages. | `SecurityConfig.java`, `.github/workflows/ci.yml`. |
| **4.5-03** | Upgrade hold-expiry processing as traffic increases. | `RentalService.expireStaleHolds()` is an isolated transactional method, allowing `@Scheduled` integration when read frequency grows without schema changes. | `RentalService.java` design inspection (lines 265-282 in the source reference). |

---

## 4.6 External Interfaces

### 4.6.1 User Interfaces

| Interface ID | Channel / User Group | Main Characteristics | Browser, Device & Acceptance Constraints |
|---|---|---|---|
| **EXT-UI-01** | Web - Customer Portal (`PublicLayout`: Guest, CUSTOMER) | Modern editorial *Nordic Industrial Calm* style; forest green `#24553e`, light `#f6f7f2`, Inter; sticky horizontal navigation collapsing to hamburger menu; optimized search -> hold -> VNPay journey. | Current Chrome, Edge, Firefox, Safari; responsive Mobile >= 375px, Tablet >= 768px, Desktop >= 1280px. |
| **EXT-UI-02** | Web - Internal Workspace (`WorkspaceLayout`: four internal roles) | Fixed 256px sidebar with role-filtered menus, 64px top bar with chain-management facility switcher, paginated tables, right drawers, confirmation modals. | Desktop >= 1280px with content up to 1440px; landscape tablet >= 1024px; `overflow-x-auto` for large tables. |

### 4.6.2 Communications & Third-Party Interfaces

| Interface ID | External System | Purpose & Exchanged Data | Protocol, Security & Error Handling |
|---|---|---|---|
| **EXT-COM-01** | VNPay Payment Gateway (Sandbox / PAY v2.1.0) | **Outbound:** Redirect URL `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` with `vnp_Version=2.1.0`, `vnp_Command=pay`, `vnp_TmnCode`, `vnp_Amount` (VND x100), `vnp_TxnRef` (`VNP-{invoiceId}-{12HEX}`), create/expire dates (+15 minutes, Asia/Ho_Chi_Minh), ReturnUrl, IpAddr, SecureHash.<br>**Inbound:** Browser `/api/v1/payments/vnpay/return` and server `/api/v1/payments/vnpay/ipn`. | HTTPS; `VNPAY_HASH_SECRET` only in Backend environment. `HmacSHA512` over lexicographically sorted UTF-8 URL-encoded parameters (`TreeMap`); constant-time `MessageDigest.isEqual`. Missing config -> `503 PAYMENT_GATEWAY_UNAVAILABLE`. Only valid IPN settles invoices; duplicates -> `02`. |
| **EXT-COM-02** | Google Identity Platform (OAuth 2.0 / OIDC) | **Outbound:** `/api/v1/oauth2/authorization/google`, scopes `openid`, `email`, `profile`, plus state/nonce/PKCE code_challenge.<br>**Inbound:** `/api/v1/login/oauth2/code/google` receives authorization code, exchanged for ID Token with immutable `sub`, email, email_verified. | Authorization Code + PKCE over HTTPS; `GOOGLE_CLIENT_SECRET` Backend only. `GOOGLE_LOGIN_ENABLED` and `GET /auth/google/config`. Require verified email; reject automatic merge with existing password account (`?oauth_error=email_conflict`); never put JWT in redirect URLs. |

---

# 5. SUPPORTING INFORMATION

## 5.1 Business Rules Catalog

| BR ID | Scope / Related Entities | Testable Rule Statement | Verification / Status |
|---|---|---|---|
| **BR-001** | `UC-005`, `UC-006`, `UC-010`; rentals | **Half-open periods:** Calendar months, `end_date = start_date.plusMonths(months)`, months >= 1, start >= today UTC. `[s1,e1)` and `[s2,e2)` overlap iff `s1 < e2 AND s2 < e1`. End date remains available to the next customer. | Unit/integration `RentalAvailabilitySelfCheck` / Draft |
| **BR-002** | `UC-006`; units, rentals | **Automatic allocation & atomic pessimistic locking:** Select available candidates by `monthly_price ASC, id ASC`, lock using `SELECT ... FOR UPDATE` (`PESSIMISTIC_WRITE`), and recheck overlap before inserting rental; only one conflicting concurrent transaction succeeds. | Integration `RentalSelfCheck` / Draft |
| **BR-003** | `UC-006`, `UC-008`, `NFN-001`; rentals, invoices | **15-minute hold:** `PENDING_PAYMENT` holds and VNPay payment links are valid for 15 minutes from creation (`payment_expires_at = created_at + 15 minutes`). Unpaid expiry sets rental and associated pending invoices `EXPIRED` and releases the schedule. | Integration `CustomerFlowE2ETests` / Draft |
| **BR-004** | `UC-006`, `UC-020`; types, units, policies, invoices | **Price range/snapshot/initial charges:** `min_monthly_price <= monthly_price <= max_monthly_price`. Hold snapshots `price_per_month = unit.monthly_price`; `rent = price_per_month * months`; `deposit = round((rent * deposit_percent) / 100, 2)`; `total_amount = rent + deposit - discount_amount`. | Unit/E2E `FacilityManagementTests`, `CustomerFlowE2ETests` / Draft |
| **BR-005** | `UC-010`; rentals, renewals, invoices | **Renewal:** Only `ACTIVE`/`OVERDUE`, additional months >= 1, unit not inspection/maintenance, no other blocking rental in `[end_date, end_date + additionalMonths)`. Use snapshotted monthly price, zero new deposit. Extend end date only after successful renewal payment. | Integration `FacilityOpsE2ETests` / Draft |
| **BR-006** | `UC-012`; rentals, units, tasks | **Handover:** Only through `HANDOVER` for a fully paid `RESERVED` rental with `KEY`, `ACCESS_CARD`, or `ACCESS_CODE`. Completion -> rental `ACTIVE`, unit `OCCUPIED`. | Integration `RentalHandoverSelfCheck` / Draft |
| **BR-007** | `UC-011`, `UC-013`, `UC-014`; rentals, units, tasks | **Mandatory post-return inspection:** `completeReturn` -> rental `RETURNED`, unit `OCCUPIED -> INSPECTION`, blocking new bookings. Only completed `UNIT_INSPECTION` with `PASS` restores `AVAILABLE`; any other result -> `MAINTENANCE`. | Integration `FacilityOpsE2ETests` / Draft |
| **BR-008** | `UC-005`, `UC-006`, `UC-020`; units, rentals | **Availability:** Unit status is neither `INSPECTION` nor `MAINTENANCE`, and no rental in `{PENDING_PAYMENT, RESERVED, ACTIVE, OVERDUE, RETURN_REQUESTED}` overlaps `[start,end)`. Currently occupied units can be booked for non-overlapping future terms. | Unit `RentalAvailabilitySelfCheck` / Draft |
| **BR-009** | `UC-008`, `NFN-002`, `NFN-003`; invoices, attempts | **IPN source of truth:** Browser ReturnUrl never settles an invoice. Attempt `SUCCESS` and invoice `PAID` require server IPN HMAC-SHA512 and `vnp_Amount == total_amount * 100` validation. At most one successful attempt per invoice (`uq_payment_attempts_one_success`). | Unit/HTTP `VnPayIpnServiceTest`, `CustomerFlowE2ETests` / Draft |
| **BR-010** | `UC-008`, `NFN-002`; attempts, invoices, rentals | **Late payment safety:** Successful IPN after rental/invoice `EXPIRED` records attempt `SUCCESS` to preserve the cash-flow trail, retains invoice expiry, does not reclaim the unit, and enters audited manual refund reconciliation (`refunded_by_user_id`, `refund_note`). | Unit `PaymentServiceTest` / Draft |
| **BR-011** | `UC-004`, `UC-006`, `UC-022`; facilities, rentals | **Facility suspension:** Block `ACTIVE -> INACTIVE` while any rental is `ACTIVE`, `RESERVED`, or `OVERDUE`. Inactive facilities are hidden in customer catalogs and reject new hold API requests. | E2E `ManagementAdminE2ETests`, `CustomerFlowE2ETests` / Draft |
| **BR-012** | `UC-017`, `UC-018`; tickets, tasks | **Assignment:** Assignee must be active at the same facility as rental/ticket. `SUPPORT` tasks originate only through ticket assignment (`ticket_id IS NOT NULL AND rental_id IS NULL`); unit-operation tasks require rental and NULL ticket. | Unit/E2E `SupportTicketServiceTest`, `FacilityOpsE2ETests` / Draft |
| **BR-013** | All UC; users, rentals, invoices, tickets | **Scope/ownership isolation:** Staff/manager require exactly one facility, cross-facility actions -> `403`. Customer/business manager/admin require NULL facility. Customers access only records matching their session `customer_id`. | Security `RbacAndScopeTests` / Draft |
| **BR-014** | `UC-026`, `UC-027`; users | **Admin lockout prevention:** Prohibit self-disabling the current administrator and demotion/disabling of the last active administrator. | Integration `AdminAndAuditTests` / Draft |
| **BR-015** | `UC-001`, `UC-003`; users, social identities | **Google account takeover prevention:** Link only using verified `(provider, provider_subject)` with `email_verified=true`. If email matches an existing password account without a social link, reject with `email_conflict`, without automatic merge. | Integration `GoogleLoginTests` / Draft |

---

## 5.2 Common Requirements

| CR ID | Category | Requirement & Observable Behavior | Applies To / Reference |
|---|---|---|---|
| **CR-001** | Authentication & Sessions | Passwords are 8-100 characters, hashed with `BCryptPasswordEncoder`. Support Bearer JWT and HttpOnly Cookies (`SameSite=Lax`, `Secure` under HTTPS). Access TTL 30 minutes; Refresh TTL seven days; store only SHA-256 hashes in `refresh_tokens`, rotate/revoke old tokens on refresh/logout. Cookie-session writes require `X-XSRF-TOKEN`. | Five roles; `UC-001`..`UC-003`, `ADR-0001`. |
| **CR-002** | Multi-layer Authorization | Independently validate every API call at three layers: role-based paths in `SecurityConfig`, facility scope in `FacilityAccessService`, and record `customer_id` ownership in services. Hidden buttons or Frontend route guards never replace Backend security. | `/api/v1/**`; `BR-013`, Section 3.5. |
| **CR-003** | Validation | All Controller JSON payloads use Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Email`, `@Min`, `@Max`, `@NotNull`) plus MySQL CHECK/UNIQUE/FK constraints. Violations -> `400 BAD_REQUEST` with per-field `error.details`. | All forms/write endpoints. |
| **CR-004** | Audit / Logging | Record key registration/login/admin/support events in `activity_logs` with user, action, entity type/id, JSON metadata, and UTC timestamp. Failed-login logging uses independent `REQUIRES_NEW`. Never log secrets, passwords, or JWTs. | `AuthService`, `AdminOpsService`, `SupportController`; `UC-028`. |
| **CR-005** | Errors & Response Standardization | REST APIs use `ApiResponse<T>`: success `{"success":true,"data":...}`; failure `{"success":false,"error":{"code":"...","message":"...","details":...}}` via `GlobalExceptionHandler`, without browser-visible stack traces. VNPay IPN follows its own contract. | `/api/v1/**` except `/payments/vnpay/ipn`; Section 5.3. |
| **CR-006** | Time & Currency | MySQL/JVM instant timestamps use UTC (`DATETIME(6)`, `Instant`). VNPay parameters use `Asia/Ho_Chi_Minh` (`GMT+7`). All money is VND in `DECIMAL(14,2)`. | All 15 DB tables; rental, payment, management. |

---

## 5.3 Application Messages & Error Codes

This table translates the standardized `ErrorCode.java` messages used by the Backend, UI, and automated tests. The running application's original messages are in Vietnamese; the English text below is their translation.

| Message ID | Type | Trigger / HTTP & ErrorCode | Standard Message (English Translation) | Related UC |
|---|---|---|---|---|
| **MSG-AUTH-001** | Success | Logout (`200 OK`) | Logged out successfully. | `UC-002` |
| **MSG-HOLD-001** | Success | Atomic hold created (`200 OK`) | Show receipt with allocated unit code and 15-minute payment deadline. | `UC-006` |
| **MSG-VNP-001** | Success | Valid IPN confirmation (`RspCode=00`) | Confirm Success | `UC-008`, `NFN-002` |
| **ERR-SYS-001** | Error | Bean Validation (`400 / VALIDATION_ERROR`) | Invalid input data (with field details). | Common, `CR-003` |
| **ERR-SYS-002** | Error | Malformed request / invalid parameters (`400 / BAD_REQUEST`) | Invalid request. | Common |
| **ERR-SYS-003** | Error | Resource missing (`404 / NOT_FOUND`) | Requested resource not found. | Common |
| **ERR-SYS-004** | Error | Unhandled server exception (`500 / INTERNAL_SERVER_ERROR`) | Internal server processing error. | Common, `CR-005` |
| **ERR-AUTH-001** | Error | Unauthenticated protected API (`401 / UNAUTHORIZED`) | Authentication is required to access this resource. | `CR-001` |
| **ERR-AUTH-002** | Error | Wrong email/password (`401 / INVALID_CREDENTIALS`) | Incorrect email or password. | `UC-002` |
| **ERR-AUTH-003** | Error | Invalid/revoked/expired token (`401 / INVALID_TOKEN`) | Invalid or expired token. | `UC-002`, `NFN-004` |
| **ERR-AUTH-004** | Error | Insufficient role (`403 / FORBIDDEN`) | You do not have permission to access this resource. | `CR-002` |
| **ERR-AUTH-005** | Error | Unassigned facility (`403 / FORBIDDEN`) | You do not have access to this storage facility. | `UC-012`..`UC-021` |
| **ERR-AUTH-006** | Error | Disabled account login (`403 / USER_INACTIVE`) | This account has been disabled. | `UC-002`, `UC-003` |
| **ERR-AUTH-007** | Error | Duplicate registration/Google email (`409 / EMAIL_ALREADY_EXISTS`) | This email already exists in the system. | `UC-001`, `UC-003` |
| **ERR-ADM-001** | Error | Self-disable (`400 / BAD_REQUEST`) | You cannot disable your own account. | `UC-027` |
| **ERR-ADM-002** | Error | Demote/disable last active admin (`400 / BAD_REQUEST`) | The last administrator cannot be demoted. | `UC-026`, `UC-027` |
| **ERR-ADM-003** | Error | Missing/inappropriate facility assignment (`400`) | Role {ROLE} requires a facility / Role {ROLE} must not be assigned a facility. | `UC-026` |
| **ERR-FAC-001** | Error | Duplicate facility code/type name/unit code (`409 / *_EXISTS`) | Facility code already exists / Unit type name already exists / Unit code already exists within this facility. | `UC-020`, `UC-022` |
| **ERR-FAC-002** | Error | Suspend with effective rentals (`400 / BAD_REQUEST`) | {N} effective rentals remain; the facility cannot be suspended. | `UC-022` |
| **ERR-RENT-001** | Error | Past start date (`400 / BAD_REQUEST`) | The start date must not be in the past. | `UC-006` |
| **ERR-RENT-002** | Error | Hold at inactive facility (`400 / BAD_REQUEST`) | The facility is temporarily inactive; booking is unavailable. | `UC-006` |
| **ERR-RENT-003** | Error | No suitable availability (`400 / BAD_REQUEST`) | No suitable available unit was found. Please select another facility or unit type. | `UC-006` |
| **ERR-RENT-004** | Error | Missing business policy (`400 / BAD_REQUEST`) | Business policy has not been configured. | `UC-006` |
| **ERR-RENT-005** | Error | Cancel active/finished rental (`400 / BAD_REQUEST`) | Only rentals awaiting payment or reserved rentals can be cancelled. | `UC-007` |
| **ERR-RENT-006** | Error | Renew non-active/non-overdue rental (`400 / BAD_REQUEST`) | Only active or overdue rentals can be renewed. | `UC-010` |
| **ERR-RENT-007** | Error | Renewal booking conflict (`400 / BAD_REQUEST`) | The unit has another rental during the renewal period; please select another unit. | `UC-010` |
| **ERR-RENT-008** | Error | Return request outside active/overdue (`400`) | A return can only be requested for an active or overdue rental. | `UC-011` |
| **ERR-RENT-009** | Error | No active facility staff (`400`) | No facility staff are on duty to inspect the unit. | `UC-011` |
| **ERR-RENT-010** | Error | Return before rental start (`400 / BAD_REQUEST`) | The requested return date must not precede the rental start date. | `UC-011` |
| **ERR-OPS-001** | Error | Unit price outside type bounds (`400`) | The unit price must be within its unit type's price range. | `UC-020` |
| **ERR-OPS-002** | Error | Invalid physical-state transition (`400 / INVALID_UNIT_STATUS_TRANSITION`) | Invalid unit status transition. | `UC-014`, `UC-020` |
| **ERR-OPS-003** | Error | Manual OCCUPIED without reason (`400`) | A reason is required when changing a unit to OCCUPIED. | `UC-020` |
| **ERR-OPS-004** | Error | Handover before RESERVED (`400`) | Only paid and allocated rentals can be checked in. | `UC-012` |
| **ERR-SUP-001** | Error | Reassign resolved/closed/other-assignee ticket (`400`) | The ticket has been resolved and cannot be reassigned / The ticket is already assigned to someone else. | `UC-018` |
| **ERR-SUP-002** | Error | Invalid OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED sequence (`400`) | Only open tickets can be started / Only in-progress tickets can be resolved / Only resolved tickets can be closed. | `UC-018` |
| **ERR-PAY-001** | Error | Missing VNPay configuration (`503 / PAYMENT_GATEWAY_UNAVAILABLE`) | The VNPay payment gateway is not fully configured. | `UC-008` |
| **WARN-HOLD-001** | Warning | Cancel hold (`SCR-006`) | Two-step confirmation: Confirm Cancellation / No. | `UC-007` |
| **WARN-POL-001** | Warning | Save global policy (`SCR-016`) | Compare Old-New values and confirm before applying to new bookings. | `UC-023` |
| **INFO-PAY-001** | Info | Return page awaiting IPN (`SCR-005`) | Show transaction reconciliation in progress; refresh every three seconds. | `UC-008` |
| **INFO-CAT-001** | Info | No rentals/matching facilities (`EmptyState`) | No unit types are currently available / No matching facilities found. | `UC-004`, `UC-016` |

---

## 5.4 Appendices & Supporting Evidence

### 5.4.1 Repository Appendix Catalog

| Appendix ID | Title & Repository Path | Status | Owner |
|---|---|---|---|
| **APP-A** | Original Stitch prototypes & UI audits (`stitch_self_storage_editorial_homepage_system/`, `docs/architecture/fe1-01-stitch-audit.md`, `docs/architecture/FE2-01-internal-audit.md`) | Informative - design reference | Trần Xuân Khoa (FE1) & Bùi Tuấn Thanh (FE2) |
| **APP-B** | Executable Flyway MySQL schema & reference ERD (`backend/src/main/resources/db/migration/mysql/V001..V010`, `sql/self_storage_erd.mmd`) | Normative - technical constraints | Bùi Văn Tình (BE1) & Lê Trí Thiện (BE3) |
| **APP-C** | VNPay integration & OAuth2/JWT (`docs/api/vnpay-integration.md`, `docs/architecture/adr-0001-authentication-token-strategy.md`, `docs/social-login.md`) | Normative - security/integration | Bùi Văn Tình (BE1), Lê Trí Thiện (BE3), Trần Xuân Khoa (FE1) |
| **APP-D** | Seven Frontend/API flows and architecture (`FE_Architecture_And_Flows.html`) | Informative - flow reference | Trần Xuân Khoa (FE1) & Bùi Tuấn Thanh (FE2) |
| **APP-E** | Integration/E2E reports (`docs/api/e2e-test-report-2026-10-11.md`, `Role_Testing_Report.html`, `backend/src/test/java/com/storage/e2e/`, `frontend/e2e/role-flows.spec.ts`) | Normative - verification evidence | All five members |
| **APP-F** | Docker, AWS EC2 CloudFormation & MySQL backup (`infra/aws/staging.yaml`, `infra/ec2/docker-compose.staging.yml`, `infra/ec2/backup-mysql.sh`, `.github/workflows/ci.yml`) | Informative - deployment/operations | Bùi Văn Tình (BE1) & Trần Xuân Khoa (FE1) |

### 5.4.2 Frontend / Backend Open Alignment Notes

During source extraction for SRS `v1.0`, the following discrepancies between `frontend/` and `backend/` were recorded for resolution before UAT:

1. **RETURN_REQUESTED in staff UI:** After `UC-011`, Backend sets `RETURN_REQUESTED`, but `canReturn()` in `frontend/src/features/facility/rentalRules.ts` currently permits only `ACTIVE | OVERDUE`. Add `RETURN_REQUESTED` to enable return confirmation in `TaskDrawer`.
2. **Method-level authorization for `/api/v1/ops/**`:** `SecurityConfig.java` allows all four internal roles under `/ops/**`. Add Controller/Service role checks preventing direct `FACILITY_STAFF` calls to manager-only unit writes (`/ops/units`), task assignment (`POST /ops/tasks`), or ticket closure.
3. **SupportTicket synchronization after StaffTask(SUPPORT):** When staff completes support work in `TaskDrawer` (`POST /ops/tasks/{id}/complete`), also transition the ticket to `RESOLVED` (`/ops/tickets/{id}/resolve`) so the manager can close it (`CLOSED`).
4. **Facility-manager filter thresholds:** Align the Expiring Rentals warning window (Frontend 14 days; Backend `OpsService.EXPIRING_WINDOW_DAYS = 30`) and `low / mid / high` unit-price filters.

---

# REVIEW CHECKLIST

- [x] All five SWR302 chapters were completed in Vietnamese based on actual source code and Git history (the source document translated in this edition).
- [x] All five user roles and the screen/API authorization matrix were cross-checked.
- [x] Five detailed Use Case specifications, three UML sequence diagram specifications, three UML swimlane business process specifications, five UML state machines, four Level-1 DFDs, a UML conceptual class model, and a 15-table logical ERD specification are provided.
- [x] Use Cases `UC-001`..`UC-028`, Business Rules `BR-001`..`BR-015`, NFRs, Common Requirements `CR-001`..`CR-006`, and messages/error codes have stable IDs and test-evidence references.
- [x] VNPay v2.1.0, idempotent IPN handling, late payments, and Google OIDC + PKCE are specified against the executable source.
- [ ] Enter the official class/group code and supervisor name, and obtain signatures after the team Review Gate.
