import { useMemo, useState } from 'react'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { formatNumber } from '../../../lib/format'
import {
  createFacility,
  setFacilityStatus,
  updateFacility,
  type FacilityInput,
} from '../api/managementApi'
import { useFacilityOverviews } from '../hooks/useManagement'
import { validateFacilityInput } from '../managementRules'
import type { FacilityOverview } from '../types'

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

type FormState = { mode: 'create' } | { mode: 'edit'; facility: FacilityOverview }

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

export function OperationsFacilitiesPage() {
  const { user } = useSession()
  const { overviews, loading, error, reload } = useFacilityOverviews()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [form, setForm] = useState<FormState | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<FacilityOverview | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const query = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      overviews
        .filter((facility) => (statusFilter === 'ALL' ? true : facility.status === statusFilter))
        .filter((facility) =>
          query
            ? `${facility.code} ${facility.name} ${facility.address} ${facility.managerName ?? ''}`
                .toLowerCase()
                .includes(query)
            : true,
        ),
    [overviews, statusFilter, query],
  )

  const kpis = [
    { label: 'Tổng cơ sở', value: overviews.length },
    { label: 'Đang hoạt động', value: overviews.filter((item) => item.status === 'ACTIVE').length },
    { label: 'Tổng số kho', value: overviews.reduce((total, item) => total + item.unitTotal, 0) },
    {
      label: 'Lấp đầy trung bình',
      value: (() => {
        const total = overviews.reduce((sum, item) => sum + item.unitTotal, 0)
        const occupied = overviews.reduce((sum, item) => sum + item.unitOccupied, 0)
        return total > 0 ? `${Math.round((occupied / total) * 1000) / 10}%` : '—'
      })(),
    },
  ]

  const handleFormSubmit = async (input: FacilityInput) => {
    if (form?.mode === 'edit') {
      await updateFacility(form.facility.id, input, user.fullName)
      setNotice(`Đã cập nhật cơ sở ${input.code.toUpperCase()}.`)
    } else {
      await createFacility(input, user.fullName)
      setNotice(`Đã tạo cơ sở ${input.code.toUpperCase()}.`)
    }
    setForm(null)
    await reload()
  }

  const handleToggleStatus = async () => {
    if (!confirmTarget) {
      return
    }
    const nextStatus = confirmTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setBusy(true)
    setActionError(null)
    try {
      await setFacilityStatus(confirmTarget.id, nextStatus, user.fullName)
      setNotice(
        nextStatus === 'INACTIVE'
          ? `Đã tạm dừng nhận khách mới tại ${confirmTarget.name}.`
          : `Đã kích hoạt lại ${confirmTarget.name}.`,
      )
      setConfirmTarget(null)
      await reload()
    } catch (toggleError) {
      setActionError(toggleError instanceof Error ? toggleError.message : 'Không đổi được trạng thái.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Trụ sở & Quản trị</p>
        <h1 className="mt-1 text-page-title text-text-main">Mạng lưới cơ sở lưu trữ</h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Quản lý danh mục cơ sở toàn hệ thống. Không xóa vĩnh viễn cơ sở đã có hợp đồng — chỉ tạm
          dừng nhận khách mới.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-space-lg flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="hover:opacity-70">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface rounded-xl border border-border-hairline p-space-xl">
            <p className="text-label-help text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="facility-search" className="sr-only">
            Tìm cơ sở
          </label>
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="facility-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã, tên, địa chỉ hoặc quản lý…"
            className="w-full h-11 rounded-lg border border-border-hairline bg-surface pl-10 pr-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>
        <div className="flex items-center gap-1" role="tablist">
          {(
            [
              { id: 'ALL' as const, label: `Tất cả (${overviews.length})` },
              {
                id: 'ACTIVE' as const,
                label: `Đang hoạt động (${overviews.filter((item) => item.status === 'ACTIVE').length})`,
              },
              {
                id: 'INACTIVE' as const,
                label: `Tạm ngừng (${overviews.filter((item) => item.status === 'INACTIVE').length})`,
              },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={statusFilter === item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`h-11 px-space-md rounded-lg text-label-help font-medium transition-colors ${
                statusFilter === item.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-muted border border-border-hairline hover:text-text-main'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setForm({ mode: 'create' })} className="shrink-0">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          Thêm cơ sở mới
        </Button>
      </div>

      <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        {error ? (
          <div className="p-space-xl text-center">
            <p role="alert" className="text-body-default text-danger">
              {error}
            </p>
            <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
              Thử lại
            </Button>
          </div>
        ) : loading ? (
          <div className="p-space-lg space-y-3" role="status">
            <span className="sr-only">Đang tải danh sách cơ sở…</span>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="domain_disabled"
            title="Không có cơ sở khớp bộ lọc."
            description="Thử đổi trạng thái hoặc từ khóa tìm kiếm."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-ui-table">
              <thead>
                <tr className="bg-surface-muted text-left text-text-muted">
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Mã cơ sở</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Tên & Địa chỉ</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Kho (thuê/tổng)</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Lấp đầy</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Quản lý</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((facility) => (
                  <tr key={facility.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-space-lg py-space-md font-medium text-text-main">{facility.code}</td>
                    <td className="px-space-lg py-space-md">
                      <span className="block text-text-main">{facility.name}</span>
                      <span className="block text-badge-caption text-text-muted">{facility.address}</span>
                    </td>
                    <td className="px-space-lg py-space-md text-right tabular-nums">
                      {formatNumber(facility.unitOccupied)}/{formatNumber(facility.unitTotal)}
                    </td>
                    <td className="px-space-lg py-space-md text-right tabular-nums">
                      {facility.occupancyRate}%
                    </td>
                    <td className="px-space-lg py-space-md">{facility.managerName ?? '—'}</td>
                    <td className="px-space-lg py-space-md">
                      <span className="inline-flex items-center gap-1.5 text-label-help text-text-main">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            facility.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'
                          }`}
                          aria-hidden="true"
                        />
                        {facility.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
                      </span>
                    </td>
                    <td className="px-space-lg py-space-md text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setForm({ mode: 'edit', facility })}
                        className="text-label-help font-medium text-primary hover:underline mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null)
                          setConfirmTarget(facility)
                        }}
                        className={`text-label-help font-medium hover:underline ${
                          facility.status === 'ACTIVE' ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {facility.status === 'ACTIVE' ? 'Tạm ngừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <FacilityFormModal
          facility={form.mode === 'edit' ? form.facility : undefined}
          existing={overviews.map((item) => ({ id: item.id, code: item.code }))}
          onClose={() => setForm(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {confirmTarget && (
        <Modal
          title={confirmTarget.status === 'ACTIVE' ? 'Tạm dừng nhận khách mới' : 'Kích hoạt lại cơ sở'}
          onClose={() => setConfirmTarget(null)}
        >
          <p className="text-body-default text-text-main">
            {confirmTarget.status === 'ACTIVE'
              ? `Cơ sở ${confirmTarget.name} sẽ không nhận đặt chỗ mới. Các hợp đồng hiện có vẫn giữ nguyên và tiếp tục được quản lý.`
              : `Cơ sở ${confirmTarget.name} sẽ nhận đặt chỗ mới trở lại.`}
          </p>
          {actionError && (
            <p role="alert" className="mt-space-md text-label-help text-danger">
              {actionError}
            </p>
          )}
          <div className="mt-space-2xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={busy}>
              Hủy
            </Button>
            <Button
              variant={confirmTarget.status === 'ACTIVE' ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => void handleToggleStatus()}
            >
              {busy ? 'Đang lưu…' : 'Xác nhận'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

interface FacilityFormModalProps {
  facility?: FacilityOverview
  existing: Array<{ id: number; code: string }>
  onClose: () => void
  onSubmit: (input: FacilityInput) => Promise<void>
}

function FacilityFormModal({ facility, existing, onClose, onSubmit }: FacilityFormModalProps) {
  const [code, setCode] = useState(facility?.code ?? '')
  const [name, setName] = useState(facility?.name ?? '')
  const [address, setAddress] = useState(facility?.address ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const input: FacilityInput = { code: code.trim(), name: name.trim(), address: address.trim() }
    const validation = validateFacilityInput(input, existing, facility?.id ?? null)
    setErrors(validation)
    setSubmitError(null)
    if (Object.keys(validation).length > 0) {
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(input)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không lưu được cơ sở.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={facility ? `Sửa cơ sở ${facility.code}` : 'Thêm cơ sở mới'} onClose={onClose}>
      <div>
        <label htmlFor="facility-code" className="text-label-help font-medium text-text-main">
          Mã cơ sở *
        </label>
        <input
          id="facility-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ví dụ: CS-HN-CG01"
          aria-invalid={Boolean(errors.code)}
          className={INPUT_CLASS}
        />
        {errors.code && <p className="mt-1 text-label-help text-danger">{errors.code}</p>}
      </div>

      <div className="mt-space-lg">
        <label htmlFor="facility-name" className="text-label-help font-medium text-text-main">
          Tên cơ sở *
        </label>
        <input
          id="facility-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          className={INPUT_CLASS}
        />
        {errors.name && <p className="mt-1 text-label-help text-danger">{errors.name}</p>}
      </div>

      <div className="mt-space-lg">
        <label htmlFor="facility-address" className="text-label-help font-medium text-text-main">
          Địa chỉ *
        </label>
        <input
          id="facility-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-invalid={Boolean(errors.address)}
          className={INPUT_CLASS}
        />
        {errors.address && <p className="mt-1 text-label-help text-danger">{errors.address}</p>}
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
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Đang lưu…' : facility ? 'Lưu thay đổi' : 'Tạo cơ sở'}
        </Button>
      </div>
    </Modal>
  )
}
