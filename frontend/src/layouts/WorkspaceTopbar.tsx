import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Building2, Check, ChevronDown, Globe, Menu } from 'lucide-react'
import { ROLE_LABELS } from '../app/providers/session-context'
import { useSession } from '../app/providers/useSession'
import { ThemeToggle } from '../components/ui/ThemeToggle'

const PAGE_META: Record<string, { title: string; category: string }> = {
  '/facility/dashboard': { title: 'Tổng quan cơ sở', category: 'Cơ sở vận hành' },
  '/facility/units': { title: 'Quản lý kho lưu trữ', category: 'Cơ sở vận hành' },
  '/facility/rentals': { title: 'Hợp đồng & Phân công', category: 'Cơ sở vận hành' },
  '/staff/operations': { title: 'Công việc tại cơ sở', category: 'Cơ sở vận hành' },
  '/operations/facilities': { title: 'Mạng lưới cơ sở', category: 'Trụ sở & Quản trị' },
  '/operations/policies': { title: 'Chính sách & Bảng phí', category: 'Trụ sở & Quản trị' },
  '/operations/reports': { title: 'Báo cáo toàn mạng', category: 'Trụ sở & Quản trị' },
  '/admin/dashboard': { title: 'Dashboard hệ thống', category: 'Quản trị hệ thống' },
  '/admin/security': { title: 'Quản trị & Bảo mật', category: 'Quản trị hệ thống' },
}

interface WorkspaceTopbarProps {
  onOpenMobileNav?: () => void
}

export function WorkspaceTopbar({ onOpenMobileNav }: WorkspaceTopbarProps) {
  const { user, facilitiesInScope, activeFacilityId, setActiveFacilityId } = useSession()
  const location = useLocation()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const meta = PAGE_META[location.pathname] ?? { title: 'Hệ thống', category: 'Kho Việt Ops' }
  const activeFacility = facilitiesInScope.find((facility) => facility.id === activeFacilityId)
  const isSystemScope = location.pathname.startsWith('/admin/')

  return (
    <header className="fixed top-0 left-0 lg:left-[248px] right-0 h-[68px] bg-surface/95 backdrop-blur-md z-40 border-b border-border-hairline px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            aria-label="Mở thanh điều hướng"
            onClick={onOpenMobileNav}
            className="rounded-md p-2 text-text-muted hover:bg-surface-muted hover:text-text-main lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[12.5px] text-text-muted min-w-0">
          <span className="hidden sm:inline">Kho Việt Ops</span>
          <span className="hidden sm:inline">/</span>
          <span className="hidden md:inline">{meta.category}</span>
          <span className="hidden md:inline">/</span>
          <span className="text-text-main font-semibold truncate max-w-[200px] sm:max-w-[240px]">
            {meta.title}
          </span>
        </div>

        <div className="h-4 w-px bg-border-hairline hidden md:block" />

        {isSystemScope ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-[12.5px] text-text-main font-medium">
            <Globe className="size-4 text-primary shrink-0" aria-hidden="true" />
            <span>Toàn hệ thống</span>
          </div>
        ) : facilitiesInScope.length > 1 ? (
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setSwitcherOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={switcherOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-hairline bg-surface hover:bg-surface-muted transition-colors text-[12.5px] text-text-main font-medium"
            >
              <Building2 className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>{activeFacility?.name ?? 'Chọn cơ sở'}</span>
              <ChevronDown className="size-4 text-text-muted shrink-0" aria-hidden="true" />
            </button>

            {switcherOpen && (
              <div
                role="listbox"
                className="absolute left-0 mt-1.5 w-64 bg-surface rounded-xl shadow-popover border border-border-hairline py-1.5 z-50"
              >
                {facilitiesInScope.map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    role="option"
                    aria-selected={facility.id === activeFacilityId}
                    onClick={() => {
                      setActiveFacilityId(facility.id)
                      setSwitcherOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-[12.5px] flex items-center justify-between hover:bg-surface-muted ${
                      facility.id === activeFacilityId
                        ? 'text-primary font-semibold bg-forest-tint/60'
                        : 'text-text-main'
                    }`}
                  >
                    <span className="truncate">{facility.name}</span>
                    {facility.id === activeFacilityId && (
                      <Check className="size-4 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          activeFacility && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-[12.5px] text-text-main font-medium">
              <Building2 className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>{activeFacility.name}</span>
            </div>
          )
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <ThemeToggle showLabel />
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[12.5px] font-semibold text-text-main leading-tight">{user.fullName}</span>
          <span className="text-[10.5px] text-text-muted leading-tight">{ROLE_LABELS[user.role]}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-[12px] font-bold">
          {user.fullName.split(/\s+/).slice(-1)[0]?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
