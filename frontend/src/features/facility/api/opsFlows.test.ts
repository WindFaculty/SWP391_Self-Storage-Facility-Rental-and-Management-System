import { describe, expect, it } from 'vitest'
import { listUnits } from './facilityUnitsApi'
import { rentalStore, taskStore, ticketStore } from './opsStore'
import { completeHandover, completeReturn, completeUnitInspection, startTask } from './rentalOpsApi'
import { assignTicket } from './supportTicketsApi'

const ALL_UNIT_FILTERS = { search: '', unitTypeId: null, status: null, priceBand: null }

describe('support ticket assignment', () => {
  it('assigns a ticket, creates a SUPPORT task and moves the ticket to IN_PROGRESS', async () => {
    const before = taskStore.length
    const result = await assignTicket({
      facilityId: 1,
      ticketId: 2,
      staffId: 202,
      scheduledAt: new Date().toISOString(),
    })

    expect(result.ticket.status).toBe('IN_PROGRESS')
    expect(result.ticket.assignedStaffName).toBe('Trần Thị Mai')
    expect(result.task.taskType).toBe('SUPPORT')
    expect(result.task.ticketId).toBe(2)
    expect(taskStore).toHaveLength(before + 1)

    const storedTicket = ticketStore.find((ticket) => ticket.id === 2)
    expect(storedTicket?.status).toBe('IN_PROGRESS')
  })

  it('rejects assigning a ticket twice while a support task is open', async () => {
    await expect(
      assignTicket({
        facilityId: 1,
        ticketId: 2,
        staffId: 201,
        scheduledAt: new Date().toISOString(),
      }),
    ).rejects.toThrow('đang mở')
  })
})

describe('return and inspection flows', () => {
  it('completes return: rental -> RETURNED and unit -> INSPECTION', async () => {
    const result = await completeReturn(3, { condition: 'Kho sạch, đã thu hồi thẻ truy cập.' })

    expect(result.task.status).toBe('DONE')
    expect(result.rental.status).toBe('RETURNED')
    expect(result.rental.returnedAt).toBeTruthy()

    const storedRental = rentalStore.find((rental) => rental.id === 8)
    expect(storedRental?.status).toBe('RETURNED')

    const units = await listUnits({ facilityId: 1, ...ALL_UNIT_FILTERS })
    const unit = units.items.find((item) => item.id === result.rental.unitId)
    expect(unit?.status).toBe('INSPECTION')
  })

  it('blocks handover when the rental is not fully paid', async () => {
    await startTask(2)
    await expect(
      completeHandover(2, { accessMethod: 'ACCESS_CARD', handoverCondition: 'Bàn giao thử.' }),
    ).rejects.toThrow('Chưa thu đủ')
  })

  it('records a passed unit inspection: unit -> AVAILABLE', async () => {
    await startTask(5)
    const result = await completeUnitInspection(5, { result: 'PASS', notes: 'Kho đạt yêu cầu.' })

    expect(result.task.status).toBe('DONE')
    expect(result.task.notes).toContain('Đạt kiểm tra')

    const units = await listUnits({ facilityId: 1, ...ALL_UNIT_FILTERS })
    const unit = units.items.find((item) => item.id === result.rental.unitId)
    expect(unit?.status).toBe('AVAILABLE')
  })
})
