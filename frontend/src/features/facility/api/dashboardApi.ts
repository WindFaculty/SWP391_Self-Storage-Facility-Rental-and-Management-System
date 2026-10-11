import { workspaceClient } from '../../../api/workspaceClient'
import type { Rental } from '../types'

export interface DashboardAttentionItem {
  id: string
  severity: 'danger' | 'warning' | 'info'
  title: string
  detail: string
  path: string
}

export interface OccupancyByType {
  name: string
  occupied: number
  total: number
  rate: number
}

export interface FacilityDashboard {
  unitTotal: number
  unitOccupied: number
  unitAvailable: number
  unitInspection: number
  unitMaintenance: number
  occupancyRate: number
  activeRentals: number
  overdueRentals: number
  expiringRentals: number
  tasksToday: number
  tasksOpen: number
  activeTickets: number
  attention: DashboardAttentionItem[]
  expiringRentalList: Rental[]
  occupancyByType: OccupancyByType[]
}

export const getFacilityDashboard = (facilityId: number): Promise<FacilityDashboard> => workspaceClient.get(`/ops/facilities/${facilityId}/dashboard`)
