export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'INSPECTION' | 'MAINTENANCE'

export type PriceBand = 'low' | 'mid' | 'high'

export type UserRole =
  | 'CUSTOMER'
  | 'FACILITY_STAFF'
  | 'FACILITY_MANAGER'
  | 'BUSINESS_MANAGER'
  | 'ADMIN'

export interface Facility {
  id: number
  code: string
  name: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface UnitType {
  id: number
  name: string
  sizeM2: number
  minMonthlyPrice: number
  maxMonthlyPrice: number
}

export interface StorageUnit {
  id: number
  facilityId: number
  unitTypeId: number
  unitCode: string
  locationLabel: string
  monthlyPrice: number
  status: UnitStatus
}

export interface StorageUnitInput {
  facilityId: number
  unitTypeId: number
  unitCode: string
  locationLabel: string
  monthlyPrice: number
}

export interface UnitFilters {
  facilityId: number
  search: string
  unitTypeId: number | null
  status: UnitStatus | null
  priceBand: PriceBand | null
}

export interface UnitSummary {
  total: number
  byStatus: Record<UnitStatus, number>
}

export type RentalStatus =
  | 'PENDING_PAYMENT'
  | 'RESERVED'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'RETURNED'
  | 'CANCELLED'
  | 'EXPIRED'

export type PaymentState = 'PAID' | 'PENDING' | 'OVERDUE'

export type AccessMethod = 'KEY' | 'ACCESS_CARD' | 'ACCESS_CODE'

export type RentalTab = 'all' | 'reserved' | 'active' | 'expiring' | 'overdue' | 'ended'

export type TaskType = 'HANDOVER' | 'RETURN_INSPECTION' | 'UNIT_INSPECTION' | 'SUPPORT'

export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

export type TaskSlot = 'all' | 'morning' | 'afternoon'

export interface Rental {
  id: number
  facilityId: number
  customerName: string
  customerPhone: string
  unitId: number
  unitCode: string
  unitTypeId: number
  unitTypeName: string
  startDate: string
  endDate: string
  pricePerMonth: number
  status: RentalStatus
  paymentState: PaymentState
  appointmentAt: string | null
  checkedInAt: string | null
  accessMethod: AccessMethod | null
  handoverCondition: string | null
  returnedAt: string | null
  returnCondition: string | null
  assignedStaffName: string | null
  openHandoverTaskId: number | null
}

export interface StaffMember {
  id: number
  fullName: string
  facilityId: number
}

export interface StaffTask {
  id: number
  facilityId: number
  taskType: TaskType
  status: TaskStatus
  assignedStaffId: number
  assignedStaffName: string
  rentalId: number | null
  ticketId: number | null
  unitCode: string | null
  customerName: string | null
  paymentState: PaymentState | null
  scheduledAt: string
  completedAt: string | null
  notes: string | null
}

export interface RentalFilters {
  facilityId: number
  tab: RentalTab
  search: string
  paymentState: PaymentState | null
  unitTypeId: number | null
}

export interface TaskFilters {
  facilityId: number
  tab: TaskType | 'all'
  status: TaskStatus | null
  slot: TaskSlot
  day: 'today' | 'all'
  rentalId: number | null
  search: string
}

export interface RentalSummary {
  total: number
  byStatus: Record<RentalStatus, number>
  byTab: Record<Exclude<RentalTab, 'all'>, number>
}

export interface TaskSummary {
  byStatus: Record<TaskStatus, number>
  byType: Record<TaskType, number>
}

export type UnitInspectionResult = 'PASS' | 'FAIL'

export type TicketCategory = 'UNIT' | 'LOCK' | 'ACCESS' | 'PAYMENT' | 'ITEMS' | 'OTHER'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface SupportTicket {
  id: number
  facilityId: number
  customerName: string
  rentalId: number | null
  unitCode: string | null
  category: TicketCategory
  title: string
  description: string
  status: TicketStatus
  createdAt: string
  resolvedAt: string | null
  assignedStaffName: string | null
}

export interface TicketFilters {
  facilityId: number
  status: TicketStatus | null
  search: string
}

export interface ActivityLog {
  id: number
  actorName: string
  action: string
  entityType: string | null
  entityId: number | null
  detail: string
  ipAddress: string
  createdAt: string
}
