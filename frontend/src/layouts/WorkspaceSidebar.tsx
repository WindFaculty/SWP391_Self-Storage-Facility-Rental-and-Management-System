import { NavLink } from 'react-router-dom'
import { useSession } from '../app/providers/SessionProvider'
import type { UserRole } from '../features/facility/types'

interface MenuItem {
  title: string
  path: string
  icon: string
  roles: UserRole[]
}

interface MenuGroup {
  label: string
  badge: string
  items: MenuItem[]
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'Cơ sở vận hành',
    badge: 'Facility',
    items: [
      {
        title: 'Tổng quan cơ sở',
        path: '/facility/dashboard',
        icon: 'grid_view',
        roles: ['FACILITY_MANAGER'],
      },
      {
        title: 'Quản lý kho lưu trữ',
        path: '/facility/units',
        icon: 'warehouse',
        roles: ['FACILITY_MANAGER'],
      },
      {
        title: 'Hợp đồng & Phân công',
        path: '/facility/rentals',
        icon: 'assignment_turned_in',
        roles: ['FACILITY_MANAGER'],
      },
      {
        title: 'Công việc tại cơ sở',
        path: '/staff/operations',
        icon: 'checklist',
        roles: ['FACILITY_STAFF', 'FACILITY_MANAGER'],
      },
    ],
  },
  {
    label: 'Trụ sở & Quản trị',
    badge: 'HQ & Ops',
    items: [
      {
        title: 'Mạng lưới cơ sở',
        path: '/operations/facilities',
        icon: 'domain',
        roles: ['BUSINESS_MANAGER'],
      },
      {
        title: 'Chính sách & Bảng phí',
        path: '/operations/policies',
        icon: 'price_change',
        roles: ['BUSINESS_MANAGER'],
      },
      {
        title: 'Báo cáo toàn mạng',
        path: '/operations/reports',
        icon: 'monitoring',
        roles: ['BUSINESS_MANAGER'],
      },
      {
        title: 'Quản trị & Bảo mật',
        path: '/admin/security',
        icon: 'shield_person',
        roles: ['ADMIN'],
      },
    ],
  },
]

const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  FACILITY_STAFF: 'Nhân viên cơ sở',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  BUSINESS_MANAGER: 'Quản lý kinh doanh',
  ADMIN: 'Quản trị hệ thống',
}

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function WorkspaceSidebar() {
  const { user } = useSession()

  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(user.role)),
  })).filter((group) => group.items.length > 0)

  return (
    <aside className="fixed left-0 top-0 h-full w-[248px] bg-surface z-50 flex flex-col justify-between border-r border-border-hairline select-none">
      <div className="flex flex-col">
        <div className="h-[68px] px-space-xl flex items-center gap-space-sm border-b border-border-hairline">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
            KT
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight leading-tight text-text-main uppercase">
              Khoảng Thở
            </span>
            <span className="text-[11px] text-text-muted font-medium tracking-wide">
              Hệ thống Vận hành Ops
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 max-h-[calc(100vh-140px)]">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>{group.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-text-muted font-bold">
                  {group.badge}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? 'bg-forest-tint text-primary font-semibold border-l-[3px] border-primary pl-[9px]'
                          : 'text-text-muted hover:bg-surface-muted hover:text-text-main font-normal'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-border-hairline bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[12px] font-bold">
            {initials(user.fullName)}
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-text-main leading-tight">{user.fullName}</span>
            <span className="text-[10px] text-text-muted leading-tight">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
