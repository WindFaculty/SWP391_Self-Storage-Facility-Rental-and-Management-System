import type { BusinessPolicy, FeeType } from '../types'

export interface PaymentRecord {
  id: number
  facilityId: number
  amount: number
  paidAt: string
}

const PRICE_POOL = [650_000, 1_450_000, 2_600_000]

function buildPayments(): PaymentRecord[] {
  const records: PaymentRecord[] = []
  let id = 0
  const now = new Date()
  for (let facilityId = 1; facilityId <= 4; facilityId += 1) {
    for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
      const count = 4 + ((facilityId + monthOffset) % 3)
      for (let index = 0; index < count; index += 1) {
        const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
        const paidAt = new Date(
          start.getFullYear(),
          start.getMonth(),
          3 + index * 7,
          10,
          30,
        )
        if (paidAt.getTime() > now.getTime()) {
          continue
        }
        id += 1
        records.push({
          id,
          facilityId,
          amount: PRICE_POOL[(index + facilityId + monthOffset) % PRICE_POOL.length],
          paidAt: paidAt.toISOString(),
        })
      }
    }
  }
  return records
}

export const MOCK_PAYMENTS: PaymentRecord[] = buildPayments()

export const MANAGER_BY_FACILITY: Record<number, string> = {
  1: 'Lê Hoàng Nam',
  2: 'Nguyễn Minh Tuấn',
  3: 'Đặng Thanh Huyền',
  4: 'Vũ Hoàng Nam',
}

export const MOCK_POLICY: BusinessPolicy = {
  depositPercent: 100,
  renewalNoticeDays: 7,
  returnNoticeDays: 3,
  overdueGraceDays: 3,
  overdueFeePerDay: 20_000,
  cancellationFee: 200_000,
  maxDiscountPercent: 10,
  updatedAt: null,
  updatedBy: 'Lê Phương Mai',
}

export const MOCK_FEE_TYPES: FeeType[] = [
  { id: 1, code: 'FEE-01', name: 'Phôi khóa / thẻ RFID bổ sung', defaultAmount: 150_000, active: true },
  { id: 2, code: 'FEE-02', name: 'Xe đẩy pallet hỗ trợ', defaultAmount: 0, active: true },
  { id: 3, code: 'FEE-03', name: 'Lưu kho ngoài giờ (22:00 – 06:00)', defaultAmount: 50_000, active: true },
  { id: 4, code: 'FEE-04', name: 'Vệ sinh kho khi trả', defaultAmount: 200_000, active: true },
]
