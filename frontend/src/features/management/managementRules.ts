export interface PolicyInput {
  depositPercent: number
  renewalNoticeDays: number
  returnNoticeDays: number
  overdueGraceDays: number
  overdueFeePerDay: number
  cancellationFee: number
  maxDiscountPercent: number
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

export function validatePolicy(input: PolicyInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!Number.isFinite(input.depositPercent) || input.depositPercent < 0 || input.depositPercent > 100) {
    errors.depositPercent = 'Phần trăm cọc phải trong khoảng 0 – 100%.'
  }
  if (
    !Number.isFinite(input.maxDiscountPercent) ||
    input.maxDiscountPercent < 0 ||
    input.maxDiscountPercent > 100
  ) {
    errors.maxDiscountPercent = 'Giảm giá tối đa phải trong khoảng 0 – 100%.'
  }
  if (!isNonNegativeInteger(input.renewalNoticeDays)) {
    errors.renewalNoticeDays = 'Số ngày báo gia hạn phải là số nguyên không âm.'
  }
  if (!isNonNegativeInteger(input.returnNoticeDays)) {
    errors.returnNoticeDays = 'Số ngày báo trả kho phải là số nguyên không âm.'
  }
  if (!isNonNegativeInteger(input.overdueGraceDays)) {
    errors.overdueGraceDays = 'Số ngày ân hạn quá hạn phải là số nguyên không âm.'
  }
  if (!isNonNegative(input.overdueFeePerDay)) {
    errors.overdueFeePerDay = 'Phí phạt trả chậm phải là số không âm.'
  }
  if (!isNonNegative(input.cancellationFee)) {
    errors.cancellationFee = 'Phí hủy phải là số không âm.'
  }
  return errors
}

export function validateFeeTypeInput(input: { name: string; defaultAmount: number }): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!input.name.trim()) {
    errors.name = 'Nhập tên phụ phí.'
  }
  if (!isNonNegative(input.defaultAmount)) {
    errors.defaultAmount = 'Mức phí phải là số không âm.'
  }
  return errors
}

export function validateFeeTypeCreateInput(
  input: { code: string; name: string; defaultAmount: number },
  existingCodes: string[] = [],
): Record<string, string> {
  const errors = validateFeeTypeInput(input)
  const code = input.code.trim().toUpperCase()
  if (!code) {
    errors.code = 'Nhập mã phụ phí.'
  } else if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    errors.code = 'Mã phụ phí gồm 2–40 ký tự chữ, số, _ hoặc -.'
  } else if (existingCodes.some((item) => item.trim().toUpperCase() === code)) {
    errors.code = 'Mã phụ phí đã tồn tại.'
  }
  return errors
}

function validateImageUrl(imageUrl?: string): string | null {
  const trimmed = imageUrl?.trim() ?? ''
  if (!trimmed) {
    return null
  }
  if (trimmed.length > 500) {
    return 'Đường dẫn ảnh tối đa 500 ký tự.'
  }
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) {
    return 'Đường dẫn ảnh phải bắt đầu bằng http://, https:// hoặc /.'
  }
  return null
}

export function validateUnitTypeInput(
  input: {
    name: string
    sizeM2: number
    minMonthlyPrice: number
    maxMonthlyPrice: number
    imageUrl?: string
  },
  existing: Array<{ id: number; name: string }> = [],
  editingId: number | null = null,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const name = input.name.trim()
  if (!name) {
    errors.name = 'Nhập tên loại kho.'
  } else if (name.length > 80) {
    errors.name = 'Tên loại kho tối đa 80 ký tự.'
  } else if (
    existing.some(
      (item) => item.id !== editingId && item.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Tên loại kho đã tồn tại.'
  }
  if (!Number.isFinite(input.sizeM2) || input.sizeM2 <= 0) {
    errors.sizeM2 = 'Diện tích phải lớn hơn 0.'
  }
  if (!Number.isFinite(input.minMonthlyPrice) || input.minMonthlyPrice <= 0) {
    errors.minMonthlyPrice = 'Giá sàn phải lớn hơn 0.'
  }
  if (!Number.isFinite(input.maxMonthlyPrice) || input.maxMonthlyPrice <= 0) {
    errors.maxMonthlyPrice = 'Giá trần phải lớn hơn 0.'
  } else if (
    Number.isFinite(input.minMonthlyPrice) &&
    input.minMonthlyPrice > 0 &&
    input.maxMonthlyPrice < input.minMonthlyPrice
  ) {
    errors.maxMonthlyPrice = 'Giá trần phải lớn hơn hoặc bằng giá sàn.'
  }
  const imageError = validateImageUrl(input.imageUrl)
  if (imageError) {
    errors.imageUrl = imageError
  }
  return errors
}

export function validateFacilityInput(
  input: { code: string; name: string; address: string; imageUrl?: string },
  existing: Array<{ id: number; code: string }>,
  editingId: number | null,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const code = input.code.trim()
  if (!code) {
    errors.code = 'Nhập mã cơ sở.'
  } else if (
    existing.some(
      (facility) => facility.id !== editingId && facility.code.toLowerCase() === code.toLowerCase(),
    )
  ) {
    errors.code = 'Mã cơ sở đã tồn tại.'
  }
  if (!input.name.trim()) {
    errors.name = 'Nhập tên cơ sở.'
  }
  if (!input.address.trim()) {
    errors.address = 'Nhập địa chỉ cơ sở.'
  }
  const imageError = validateImageUrl(input.imageUrl)
  if (imageError) {
    errors.imageUrl = imageError
  }
  return errors
}

export type ReportPeriod = 'month' | 'quarter' | 'halfYear' | 'year'

export function periodRange(period: ReportPeriod, now: Date): { from: Date; to: Date } {
  const year = now.getFullYear()
  const month = now.getMonth()
  switch (period) {
    case 'month':
      return { from: new Date(year, month, 1), to: now }
    case 'quarter':
      return { from: new Date(year, month - (month % 3), 1), to: now }
    case 'halfYear':
      return { from: new Date(year, month - 5, 1), to: now }
    case 'year':
      return { from: new Date(year, 0, 1), to: now }
  }
}

export function monthLabel(date: Date): string {
  return `T${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}
