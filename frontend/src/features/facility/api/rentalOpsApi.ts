import { withQuery, workspaceClient } from '../../../api/workspaceClient'
import type { AccessMethod, Rental, RentalFilters, RentalSummary, StaffMember, StaffTask, TaskFilters, TaskSummary, TaskType, UnitInspectionResult } from '../types'

export const listRentals = (filters: RentalFilters): Promise<{ items: Rental[]; summary: RentalSummary }> => workspaceClient.get(withQuery('/ops/rentals', filters))
export const getRental = (id: number): Promise<Rental> => workspaceClient.get(`/ops/rentals/${id}`)
export const listStaffTasks = (filters: TaskFilters): Promise<{ items: StaffTask[]; summary: TaskSummary }> => workspaceClient.get(withQuery('/ops/tasks', filters))
export const listStaffMembers = (facilityId: number): Promise<StaffMember[]> => workspaceClient.get(withQuery('/ops/staff', { facilityId }))

export interface AssignTaskInput {
  facilityId: number
  rentalId: number
  taskType: TaskType
  assignedStaffId: number
  scheduledAt: string
  notes?: string
}
export interface HandoverInput { accessMethod: AccessMethod; handoverCondition: string }
export interface ReturnInput { condition: string }
export interface UnitInspectionInput { result: UnitInspectionResult; notes: string }

export const assignTask = (input: AssignTaskInput): Promise<StaffTask> => workspaceClient.post('/ops/tasks', input)
export const startTask = (taskId: number): Promise<StaffTask> => workspaceClient.post(`/ops/tasks/${taskId}/start`, {})
export const completeTask = (taskId: number, notes: string): Promise<StaffTask> => workspaceClient.post(`/ops/tasks/${taskId}/complete`, { notes })
export const completeHandover = (taskId: number, input: HandoverInput): Promise<{ task: StaffTask; rental: Rental }> => workspaceClient.post(`/ops/tasks/${taskId}/handover`, input)
export const completeReturn = (taskId: number, input: ReturnInput): Promise<{ task: StaffTask; rental: Rental }> => workspaceClient.post(`/ops/tasks/${taskId}/return`, input)
export const completeUnitInspection = (taskId: number, input: UnitInspectionInput): Promise<{ task: StaffTask; rental: Rental }> => workspaceClient.post(`/ops/tasks/${taskId}/inspection`, input)
