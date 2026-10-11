import { describe, expect, it } from 'vitest'
import {
  monthLabel,
  periodRange,
  validateFacilityInput,
  validateFeeTypeInput,
  validatePolicy,
} from './managementRules'

const VALID_POLICY = {
  depositPercent: 100,
  renewalNoticeDays: 7,
  returnNoticeDays: 3,
  overdueGraceDays: 3,
  overdueFeePerDay: 20_000,
  cancellationFee: 200_000,
  maxDiscountPercent: 10,
}

describe('validatePolicy', () => {
  it('accepts a valid policy', () => {
    expect(validatePolicy(VALID_POLICY)).toEqual({})
  })

  it('rejects percents outside 0-100 and negative values', () => {
    expect(validatePolicy({ ...VALID_POLICY, depositPercent: 150 }).depositPercent).toBeTruthy()
    expect(validatePolicy({ ...VALID_POLICY, maxDiscountPercent: -1 }).maxDiscountPercent).toBeTruthy()
    expect(validatePolicy({ ...VALID_POLICY, overdueFeePerDay: -5 }).overdueFeePerDay).toBeTruthy()
  })

  it('rejects non-integer day counts', () => {
    expect(validatePolicy({ ...VALID_POLICY, renewalNoticeDays: 2.5 }).renewalNoticeDays).toBeTruthy()
    expect(validatePolicy({ ...VALID_POLICY, overdueGraceDays: -1 }).overdueGraceDays).toBeTruthy()
  })
})

describe('validateFeeTypeInput', () => {
  it('requires a name and non-negative amount', () => {
    expect(validateFeeTypeInput({ name: 'Phí xe đẩy', defaultAmount: 0 })).toEqual({})
    expect(validateFeeTypeInput({ name: '  ', defaultAmount: 10 }).name).toBeTruthy()
    expect(validateFeeTypeInput({ name: 'Phí', defaultAmount: -1 }).defaultAmount).toBeTruthy()
  })
})

describe('validateFacilityInput', () => {
  const existing = [
    { id: 1, code: 'CS-HN-CG01' },
    { id: 2, code: 'CS-HCM-Q701' },
  ]

  it('accepts a new valid facility', () => {
    expect(
      validateFacilityInput(
        { code: 'CS-DN-HC01', name: 'Cơ sở Hải Châu', address: '12 Bạch Đằng' },
        existing,
        null,
      ),
    ).toEqual({})
  })

  it('rejects duplicate codes case-insensitively but allows the edited facility itself', () => {
    expect(
      validateFacilityInput({ code: 'cs-hn-cg01', name: 'X', address: 'Y' }, existing, null).code,
    ).toBeTruthy()
    expect(
      validateFacilityInput({ code: 'CS-HN-CG01', name: 'X', address: 'Y' }, existing, 1).code,
    ).toBeUndefined()
  })

  it('requires name and address', () => {
    const errors = validateFacilityInput({ code: 'CS-X', name: ' ', address: '' }, existing, null)
    expect(errors.name).toBeTruthy()
    expect(errors.address).toBeTruthy()
  })
})

describe('periodRange', () => {
  const now = new Date(2026, 4, 20)

  it('covers the current month, quarter, half-year and year', () => {
    expect(periodRange('month', now).from).toEqual(new Date(2026, 4, 1))
    expect(periodRange('quarter', now).from).toEqual(new Date(2026, 3, 1))
    expect(periodRange('halfYear', now).from).toEqual(new Date(2025, 11, 1))
    expect(periodRange('year', now).from).toEqual(new Date(2026, 0, 1))
    expect(periodRange('month', now).to).toEqual(now)
  })

  it('formats month labels for vi-VN display', () => {
    expect(monthLabel(new Date(2026, 0, 1))).toBe('T01/2026')
    expect(monthLabel(new Date(2026, 11, 1))).toBe('T12/2026')
  })
})
