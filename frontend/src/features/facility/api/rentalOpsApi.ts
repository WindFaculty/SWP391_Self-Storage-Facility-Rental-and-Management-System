import {
  canHandover,
  filterRentals,
  filterTasks,
  isSameDay,
  isTaskTransitionAllowed,
  matchesRentalTab,
  TASK_TYPE_LABELS,
} from '../rentalRules'
import type {
  AccessMethod,
  Rental,
  RentalFilters,
  RentalStatus,
  RentalSummary,
  StaffMember,
  StaffTask,
  TaskFilters,
  TaskStatus,
  TaskSummary,
  TaskType,
} from '../types'
import { MOCK_RENTALS, MOCK_STAFF, MOCK_STAFF_TASKS, today } from './rentalMockData'

const LATENCY_MS = 150

const rentalStore: Rental[] = MOCK_RENTALS.map((rental) => ({ ...rental }))
const taskStore: StaffTask[] = MOCK_STAFF_TASKS.map((task) => ({ ...task }))
let taskIdSequence = taskStore.reduce((max, task) => Math.max(max, task.id), 0)

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

export async function listRentals(
  filters: RentalFilters,
): Promise<{ items: Rental[]; summary: RentalSummary }> {
  await delay()
  const facilityRentals = rentalStore.filter((rental) => rental.facilityId === filters.facilityId)
  const byStatus: Record<RentalStatus, number> = {
    PENDING_PAYMENT: 0,
    RESERVED: 0,
    ACTIVE: 0,
    OVERDUE: 0,
    RETURNED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  }
  facilityRentals.forEach((rental) => {
    byStatus[rental.status] += 1
  })
  const now = today()
  const byTab: RentalSummary['byTab'] = {
    reserved: 0,
    active: 0,
    expiring: 0,
    overdue: 0,
    ended: 0,
  }
  const tabKeys = Object.keys(byTab) as Array<keyof typeof byTab>
  facilityRentals.forEach((rental) => {
    tabKeys.forEach((tab) => {
      if (matchesRentalTab(rental, tab, now)) {
        byTab[tab] += 1
      }
    })
  })
  return {
    items: filterRentals(facilityRentals, filters, now).map((rental) => ({ ...rental })),
    summary: { total: facilityRentals.length, byStatus, byTab },
  }
}

export async function getRental(id: number): Promise<Rental> {
  await delay()
  const rental = rentalStore.find((item) => item.id === id)
  if (!rental) {
    throw new Error('Không tìm thấy hợp đồng.')
  }
  return { ...rental }
}

export async function listStaffTasks(
  filters: TaskFilters,
): Promise<{ items: StaffTask[]; summary: TaskSummary }> {
  await delay()
  const facilityTasks = taskStore.filter((task) => task.facilityId === filters.facilityId)
  const now = today()
  const scoped = filterTasks(facilityTasks, filters, now)
  const byStatus: Record<TaskStatus, number> = {
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELLED: 0,
  }
  const byType: Record<TaskType, number> = {
    HANDOVER: 0,
    RETURN_INSPECTION: 0,
    UNIT_INSPECTION: 0,
    SUPPORT: 0,
  }
  facilityTasks
    .filter((task) => (filters.day === 'today' ? isSameDay(task.scheduledAt, now) : true))
    .forEach((task) => {
      byStatus[task.status] += 1
      byType[task.taskType] += 1
    })
  return {
    items: scoped.map((task) => ({ ...task })),
    summary: { byStatus, byType },
  }
}

export async function listStaffMembers(facilityId: number): Promise<StaffMember[]> {
  await delay()
  return MOCK_STAFF.filter((member) => member.facilityId === facilityId).map((member) => ({ ...member }))
}

export interface AssignTaskInput {
  facilityId: number
  rentalId: number
  taskType: TaskType
  assignedStaffId: number
  scheduledAt: string
  notes?: string
}

export async function assignTask(input: AssignTaskInput): Promise<StaffTask> {
  await delay()
  const rental = rentalStore.find((item) => item.id === input.rentalId)
  if (!rental) {
    throw new Error('Không tìm thấy hợp đồng.')
  }
  const staff = MOCK_STAFF.find(
    (member) => member.id === input.assignedStaffId && member.facilityId === input.facilityId,
  )
  if (!staff) {
    throw new Error('Nhân viên không thuộc cơ sở này.')
  }
  if (!input.scheduledAt) {
    throw new Error('Chọn thời gian thực hiện công việc.')
  }
  const existingOpen = taskStore.find(
    (task) =>
      task.rentalId === rental.id &&
      task.taskType === input.taskType &&
      task.status !== 'DONE' &&
      task.status !== 'CANCELLED',
  )
  if (existingOpen) {
    throw new Error(`Hợp đồng đã có công việc ${TASK_TYPE_LABELS[input.taskType]} đang mở.`)
  }
  taskIdSequence += 1
  const task: StaffTask = {
    id: taskIdSequence,
    facilityId: input.facilityId,
    taskType: input.taskType,
    status: 'ASSIGNED',
    assignedStaffId: staff.id,
    assignedStaffName: staff.fullName,
    rentalId: rental.id,
    ticketId: null,
    unitCode: rental.unitCode,
    customerName: rental.customerName,
    paymentState: rental.paymentState,
    scheduledAt: input.scheduledAt,
    completedAt: null,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
  taskStore.push(task)
  if (input.taskType === 'HANDOVER') {
    rental.assignedStaffName = staff.fullName
    rental.openHandoverTaskId = task.id
  }
  return { ...task }
}

export async function startTask(taskId: number): Promise<StaffTask> {
  await delay()
  const task = taskStore.find((item) => item.id === taskId)
  if (!task) {
    throw new Error('Không tìm thấy công việc.')
  }
  const transition = isTaskTransitionAllowed(task.status, 'IN_PROGRESS')
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  task.status = 'IN_PROGRESS'
  return { ...task }
}

export async function completeTask(taskId: number, notes: string): Promise<StaffTask> {
  await delay()
  const task = taskStore.find((item) => item.id === taskId)
  if (!task) {
    throw new Error('Không tìm thấy công việc.')
  }
  if (task.taskType === 'HANDOVER') {
    throw new Error('Công việc bàn giao cần hoàn tất bằng biểu mẫu check-in.')
  }
  const transition = isTaskTransitionAllowed(task.status, 'DONE')
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  if (!notes.trim()) {
    throw new Error('Nhập ghi nhận kết quả công việc.')
  }
  task.status = 'DONE'
  task.completedAt = new Date().toISOString()
  task.notes = notes.trim()
  return { ...task }
}

export interface HandoverInput {
  accessMethod: AccessMethod
  handoverCondition: string
}

export async function completeHandover(
  taskId: number,
  input: HandoverInput,
): Promise<{ task: StaffTask; rental: Rental }> {
  await delay()
  const task = taskStore.find((item) => item.id === taskId)
  if (!task) {
    throw new Error('Không tìm thấy công việc.')
  }
  if (task.taskType !== 'HANDOVER') {
    throw new Error('Công việc này không phải bàn giao kho.')
  }
  const rental = task.rentalId
    ? rentalStore.find((item) => item.id === task.rentalId)
    : undefined
  if (!rental) {
    throw new Error('Không tìm thấy hợp đồng của công việc.')
  }
  if (task.status === 'ASSIGNED') {
    throw new Error('Cần nhận việc trước khi hoàn tất bàn giao.')
  }
  const transition = isTaskTransitionAllowed(task.status, 'DONE')
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  const eligibility = canHandover(rental)
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason)
  }
  if (!input.handoverCondition.trim()) {
    throw new Error('Ghi nhận tình trạng bàn giao kho.')
  }
  const now = new Date().toISOString()
  rental.status = 'ACTIVE'
  rental.checkedInAt = now
  rental.accessMethod = input.accessMethod
  rental.handoverCondition = input.handoverCondition.trim()
  rental.openHandoverTaskId = null
  task.status = 'DONE'
  task.completedAt = now
  task.notes = input.handoverCondition.trim()
  return { task: { ...task }, rental: { ...rental } }
}
