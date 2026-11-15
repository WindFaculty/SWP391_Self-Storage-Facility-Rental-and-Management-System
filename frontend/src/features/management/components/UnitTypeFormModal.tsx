import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { handleWarehouseImageError, resolveUnitTypeImage } from '../../catalog/lib/catalogImages'
import type { UnitType } from '../../facility/types'
import type { UnitTypeInput } from '../api/managementApi'
import { validateUnitTypeInput } from '../managementRules'

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

interface UnitTypeFormModalProps {
  unitType: UnitType | null
  existingUnitTypes: UnitType[]
  onClose: () => void
  onSubmit: (input: UnitTypeInput) => Promise<void>
}

export function UnitTypeFormModal({
  unitType,
  existingUnitTypes,
  onClose,
  onSubmit,
}: UnitTypeFormModalProps) {
  const isEditing = unitType !== null
  const [name, setName] = useState(unitType?.name ?? '')
  const [sizeM2, setSizeM2] = useState(String(unitType?.sizeM2 ?? ''))
  const [minMonthlyPrice, setMinMonthlyPrice] = useState(String(unitType?.minMonthlyPrice ?? ''))
  const [maxMonthlyPrice, setMaxMonthlyPrice] = useState(String(unitType?.maxMonthlyPrice ?? ''))
  const [description, setDescription] = useState(unitType?.description ?? '')
  const [imageUrl, setImageUrl] = useState(unitType?.imageUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const parsedSizePreview = Number(sizeM2)

  const handleSubmit = async () => {
    const parsedSize = Number(sizeM2)
    const parsedMin = Number(minMonthlyPrice)
    const parsedMax = Number(maxMonthlyPrice)
    const trimmedImageUrl = imageUrl.trim()
    const validationErrors = validateUnitTypeInput(
      {
        name,
        sizeM2: parsedSize,
        minMonthlyPrice: parsedMin,
        maxMonthlyPrice: parsedMax,
        imageUrl: trimmedImageUrl,
      },
      existingUnitTypes,
      unitType?.id ?? null,
    )
    const firstError =
      validationErrors.name ??
      validationErrors.sizeM2 ??
      validationErrors.minMonthlyPrice ??
      validationErrors.maxMonthlyPrice ??
      validationErrors.imageUrl
    if (firstError) {
      setError(firstError)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        sizeM2: parsedSize,
        minMonthlyPrice: parsedMin,
        maxMonthlyPrice: parsedMax,
        description: description.trim(),
        imageUrl: trimmedImageUrl,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không lưu được loại kho.')
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEditing ? `Sửa khung giá ${unitType.name}` : 'Thêm loại kho mới'}
      onClose={onClose}
    >
      <div>
        <label htmlFor="unit-type-name" className="text-label-help font-medium text-text-main">
          Tên loại kho *
        </label>
        <input
          id="unit-type-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="VD: Standard (10 m2)"
          className={INPUT_CLASS}
        />
      </div>

      <div className="mt-space-lg">
        <label htmlFor="unit-type-size" className="text-label-help font-medium text-text-main">
          Diện tích (m²) *
        </label>
        <input
          id="unit-type-size"
          type="number"
          min={0.1}
          step={0.5}
          value={sizeM2}
          onChange={(event) => setSizeM2(event.target.value)}
          placeholder="VD: 10"
          className={INPUT_CLASS}
        />
      </div>

      <div className="mt-space-lg grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <div>
          <label htmlFor="unit-type-min-price" className="text-label-help font-medium text-text-main">
            Giá sàn (₫/tháng) *
          </label>
          <input
            id="unit-type-min-price"
            type="number"
            min={0}
            step={10_000}
            value={minMonthlyPrice}
            onChange={(event) => setMinMonthlyPrice(event.target.value)}
            placeholder="VD: 1000000"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="unit-type-max-price" className="text-label-help font-medium text-text-main">
            Giá trần (₫/tháng) *
          </label>
          <input
            id="unit-type-max-price"
            type="number"
            min={0}
            step={10_000}
            value={maxMonthlyPrice}
            onChange={(event) => setMaxMonthlyPrice(event.target.value)}
            placeholder="VD: 1500000"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="mt-space-lg">
        <label htmlFor="unit-type-description" className="text-label-help font-medium text-text-main">
          Mô tả
        </label>
        <textarea
          id="unit-type-description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Mô tả sức chứa hoặc đặc điểm loại kho (tùy chọn)"
          className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="mt-space-lg">
        <label htmlFor="unit-type-image-url" className="text-label-help font-medium text-text-main">
          Đường dẫn ảnh (URL)
        </label>
        <input
          id="unit-type-image-url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Ví dụ: /images/unit-types/medium.jpg hoặc https://..."
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-badge-caption text-text-muted">
          Để trống để dùng ảnh mặc định theo kích thước loại kho.
        </p>
        <div className="mt-space-sm aspect-[16/10] w-full max-w-[240px] overflow-hidden rounded-lg border border-border-hairline bg-surface-muted">
          <img
            src={resolveUnitTypeImage({
              name,
              sizeM2: Number.isFinite(parsedSizePreview) && parsedSizePreview > 0 ? parsedSizePreview : null,
              imageUrl,
            })}
            alt="Xem trước ảnh loại kho"
            onError={handleWarehouseImageError}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-space-md text-label-help text-danger">
          {error}
        </p>
      )}

      <div className="mt-space-2xl flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo loại kho'}
        </Button>
      </div>
    </Modal>
  )
}
