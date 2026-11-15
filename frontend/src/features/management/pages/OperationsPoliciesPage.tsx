import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { NoticeBanner } from '../../../components/ui/NoticeBanner'
import { Tabs } from '../../../components/ui/Tabs'
import { formatArea, formatCurrency } from '../../../lib/format'
import { handleWarehouseImageError, resolveUnitTypeImage } from '../../catalog/lib/catalogImages'
import { useUnitTypes } from '../../facility/hooks/useUnitTypes'
import type { UnitType } from '../../facility/types'
import {
  createFeeType,
  createUnitType,
  updateBusinessPolicy,
  updateFeeType,
  updateUnitType,
} from '../api/managementApi'
import { FeeFormModal } from '../components/FeeFormModal'
import { PolicyFormSection } from '../components/PolicyFormSection'
import { UnitTypeFormModal } from '../components/UnitTypeFormModal'
import { usePolicyData } from '../hooks/useManagement'
import type { FeeType } from '../types'

type TabId = 'policy' | 'pricing' | 'fees'

export function OperationsPoliciesPage() {
  const queryClient = useQueryClient()
  const { policy, fees, loading, error, reload } = usePolicyData()
  const { unitTypes, reload: reloadUnitTypes } = useUnitTypes()
  const [tab, setTab] = useState<TabId>('policy')
  const [creatingUnitType, setCreatingUnitType] = useState(false)
  const [editingUnitType, setEditingUnitType] = useState<UnitType | null>(null)
  const [creatingFee, setCreatingFee] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeType | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const tabItems = [
    { id: 'policy', label: 'Chính sách thuê' },
    { id: 'pricing', label: 'Bảng giá & loại kho' },
    { id: 'fees', label: 'Phụ phí' },
  ]

  if (error) {
    return (
      <div className="text-center py-space-4xl">
        <p role="alert" className="text-body-default text-danger">
          {error}
        </p>
        <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Trụ sở & Quản trị</p>
        <h1 className="mt-1 text-page-title text-text-main">Chính sách kinh doanh & Biểu phí</h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Thiết lập chính sách thuê, khung giá và phụ phí áp dụng toàn hệ thống. Thay đổi lớn cần
          xem trước giá trị cũ/mới trước khi áp dụng.
        </p>
      </div>

      <NoticeBanner message={notice} onDismiss={() => setNotice(null)} />

      <div className="mt-space-lg">
        <Tabs items={tabItems} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      {loading || !policy ? (
        <div className="mt-space-lg space-y-3" role="status">
          <span className="sr-only">Đang tải chính sách…</span>
          <div className="h-24 rounded-xl bg-surface-muted animate-pulse" />
          <div className="h-24 rounded-xl bg-surface-muted animate-pulse" />
        </div>
      ) : (
        <>
          {tab === 'policy' && (
            <PolicyFormSection
              policy={policy}
              onSave={async (input) => {
                await updateBusinessPolicy(input)
                setNotice('Đã lưu chính sách kinh doanh và ghi nhật ký hoạt động.')
                await reload()
              }}
            />
          )}

          {tab === 'pricing' && (
            <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
              <div className="px-space-lg py-space-md border-b border-border-hairline flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-subsection text-text-main">Khung giá niêm yết theo loại kho</h2>
                  <p className="text-label-help text-text-muted">
                    Giá thuê từng kho tại các cơ sở phải nằm trong khoảng Giá sàn – Giá trần của loại kho.
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreatingUnitType(true)}>
                  Thêm loại kho
                </Button>
              </div>
              {unitTypes.length === 0 ? (
                <EmptyState
                  title="Chưa có loại kho"
                  description="Thêm mới loại kho và khung giá sàn – giá trần để áp dụng cho toàn hệ thống."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-ui-table">
                    <thead>
                      <tr className="bg-surface-muted text-left text-text-muted">
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Loại kho</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Diện tích</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Giá sàn</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Giá trần</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitTypes.map((unitType) => (
                        <tr key={unitType.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-space-lg py-space-md font-medium text-text-main">
                            <div className="flex items-center gap-3">
                              <img
                                src={resolveUnitTypeImage(unitType)}
                                alt={`Ảnh ${unitType.name}`}
                                onError={handleWarehouseImageError}
                                className="h-10 w-14 shrink-0 rounded-md border border-border-hairline bg-surface-muted object-cover"
                              />
                              <span>{unitType.name}</span>
                            </div>
                          </td>
                          <td className="px-space-lg py-space-md">{formatArea(unitType.sizeM2)}</td>
                          <td className="px-space-lg py-space-md text-right tabular-nums">
                            {formatCurrency(unitType.minMonthlyPrice)}
                          </td>
                          <td className="px-space-lg py-space-md text-right tabular-nums">
                            {formatCurrency(unitType.maxMonthlyPrice)}
                          </td>
                          <td className="px-space-lg py-space-md text-right">
                            <button
                              type="button"
                              onClick={() => setEditingUnitType(unitType)}
                              className="text-label-help font-medium text-primary hover:underline"
                            >
                              Sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === 'fees' && (
            <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
              <div className="px-space-lg py-space-md border-b border-border-hairline flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-subsection text-text-main">Biểu phí dịch vụ & phụ phí</h2>
                <Button size="sm" onClick={() => setCreatingFee(true)}>
                  Thêm phụ phí
                </Button>
              </div>
              {fees.length === 0 ? (
                <EmptyState
                  title="Chưa có phụ phí"
                  description="Thêm mới biểu phí dịch vụ hoặc phụ phí để áp dụng cho các đơn thuê."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-ui-table">
                    <thead>
                      <tr className="bg-surface-muted text-left text-text-muted">
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Mã</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Tên phụ phí</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Mức phí</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee) => (
                        <tr key={fee.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-space-lg py-space-md font-medium text-text-main">{fee.code}</td>
                          <td className="px-space-lg py-space-md">{fee.name}</td>
                          <td className="px-space-lg py-space-md text-right tabular-nums">
                            {fee.defaultAmount === 0 ? 'Miễn phí' : formatCurrency(fee.defaultAmount)}
                          </td>
                          <td className="px-space-lg py-space-md">
                            {fee.active ? 'Đang áp dụng' : 'Tạm ngừng'}
                          </td>
                          <td className="px-space-lg py-space-md text-right">
                            <button
                              type="button"
                              onClick={() => setEditingFee(fee)}
                              className="text-label-help font-medium text-primary hover:underline"
                            >
                              Sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {creatingFee && (
        <FeeFormModal
          fee={null}
          existingCodes={fees.map((item) => item.code)}
          onClose={() => setCreatingFee(false)}
          onSubmit={async (input) => {
            const created = await createFeeType({
              code: input.code,
              name: input.name,
              defaultAmount: input.defaultAmount,
              active: input.active,
            })
            setCreatingFee(false)
            setNotice(`Đã thêm phụ phí ${created.code}.`)
            await reload()
          }}
        />
      )}

      {editingFee && (
        <FeeFormModal
          fee={editingFee}
          existingCodes={fees.map((item) => item.code)}
          onClose={() => setEditingFee(null)}
          onSubmit={async (input) => {
            await updateFeeType(editingFee.id, {
              name: input.name,
              defaultAmount: input.defaultAmount,
              active: input.active,
            })
            setEditingFee(null)
            setNotice(`Đã cập nhật phụ phí ${editingFee.code}.`)
            await reload()
          }}
        />
      )}

      {creatingUnitType && (
        <UnitTypeFormModal
          unitType={null}
          existingUnitTypes={unitTypes}
          onClose={() => setCreatingUnitType(false)}
          onSubmit={async (input) => {
            const created = await createUnitType(input)
            setCreatingUnitType(false)
            setNotice(`Đã thêm loại kho ${created.name}.`)
            await Promise.all([
              reloadUnitTypes(),
              queryClient.invalidateQueries({ queryKey: ['unit-types'] }),
              queryClient.invalidateQueries({ queryKey: ['facility-unit-types'] }),
            ])
          }}
        />
      )}

      {editingUnitType && (
        <UnitTypeFormModal
          unitType={editingUnitType}
          existingUnitTypes={unitTypes}
          onClose={() => setEditingUnitType(null)}
          onSubmit={async (input) => {
            const updated = await updateUnitType(editingUnitType.id, input)
            setEditingUnitType(null)
            setNotice(`Đã cập nhật khung giá loại kho ${updated.name}.`)
            await Promise.all([
              reloadUnitTypes(),
              queryClient.invalidateQueries({ queryKey: ['unit-types'] }),
              queryClient.invalidateQueries({ queryKey: ['facility-unit-types'] }),
            ])
          }}
        />
      )}
    </div>
  )
}
