import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { formatCurrency } from '../../../lib/format'
import { validateUnitInput } from '../unitRules'
import type { StorageUnit, StorageUnitInput, UnitType } from '../types'

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

interface UnitFormModalProps {
  unit?: StorageUnit
  facilityId: number
  unitTypes: UnitType[]
  onClose: () => void
  onSubmit: (input: StorageUnitInput) => Promise<void>
}

export function UnitFormModal({ unit, facilityId, unitTypes, onClose, onSubmit }: UnitFormModalProps) {
  const [unitCode, setUnitCode] = useState(unit?.unitCode ?? '')
  const [unitTypeId, setUnitTypeId] = useState<number>(unit?.unitTypeId ?? unitTypes[0]?.id ?? 0)
  const [locationLabel, setLocationLabel] = useState(unit?.locationLabel ?? '')
  const [priceText, setPriceText] = useState(unit ? String(unit.monthlyPrice) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedType = unitTypes.find((unitType) => unitType.id === unitTypeId)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const input: StorageUnitInput = {
      facilityId,
      unitTypeId,
      unitCode: unitCode.trim(),
      locationLabel: locationLabel.trim(),
      monthlyPrice: Number(priceText),
    }
    const validation = validateUnitInput(input, unitTypes, [], unit?.id ?? null)
    setErrors(validation)
    setSubmitError(null)
    if (Object.keys(validation).length > 0) {
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(input)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không lưu được kho.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={unit ? `Sửa kho ${unit.unitCode}` : 'Thêm kho mới'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="unit-code" className="text-label-help font-medium text-text-main">
            Mã định danh kho *
          </label>
          <input
            id="unit-code"
            value={unitCode}
            onChange={(event) => setUnitCode(event.target.value)}
            aria-invalid={Boolean(errors.unitCode)}
            placeholder="Ví dụ: #24, LK-01"
            className={INPUT_CLASS}
          />
          {errors.unitCode && <p className="mt-1 text-label-help text-danger">{errors.unitCode}</p>}
        </div>

        <div className="mt-space-lg">
          <label htmlFor="unit-type" className="text-label-help font-medium text-text-main">
            Loại kho *
          </label>
          <select
            id="unit-type"
            value={unitTypeId}
            onChange={(event) => setUnitTypeId(Number(event.target.value))}
            className={INPUT_CLASS}
          >
            {unitTypes.map((unitType) => (
              <option key={unitType.id} value={unitType.id}>
                {unitType.name} — {formatCurrency(unitType.minMonthlyPrice)} –{' '}
                {formatCurrency(unitType.maxMonthlyPrice)}
              </option>
            ))}
          </select>
          {errors.unitTypeId && <p className="mt-1 text-label-help text-danger">{errors.unitTypeId}</p>}
        </div>

        <div className="mt-space-lg">
          <label htmlFor="unit-location" className="text-label-help font-medium text-text-main">
            Vị trí / Tầng *
          </label>
          <input
            id="unit-location"
            value={locationLabel}
            onChange={(event) => setLocationLabel(event.target.value)}
            aria-invalid={Boolean(errors.locationLabel)}
            placeholder="Ví dụ: Tầng 2"
            className={INPUT_CLASS}
          />
          {errors.locationLabel && (
            <p className="mt-1 text-label-help text-danger">{errors.locationLabel}</p>
          )}
        </div>

        <div className="mt-space-lg">
          <label htmlFor="unit-price" className="text-label-help font-medium text-text-main">
            Giá thuê niêm yết (₫/tháng) *
          </label>
          <input
            id="unit-price"
            type="number"
            min={0}
            step={10000}
            value={priceText}
            onChange={(event) => setPriceText(event.target.value)}
            aria-invalid={Boolean(errors.monthlyPrice)}
            className={INPUT_CLASS}
          />
          {selectedType && (
            <p className="mt-1 text-label-help text-text-muted">
              Khoảng giá cho phép theo loại kho: {formatCurrency(selectedType.minMonthlyPrice)} –{' '}
              {formatCurrency(selectedType.maxMonthlyPrice)}
            </p>
          )}
          {errors.monthlyPrice && <p className="mt-1 text-label-help text-danger">{errors.monthlyPrice}</p>}
        </div>

        {submitError && (
          <p role="alert" className="mt-space-md text-label-help text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-space-2xl flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu…' : unit ? 'Lưu thay đổi' : 'Tạo kho'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
