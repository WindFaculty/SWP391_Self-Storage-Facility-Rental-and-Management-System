import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { WorkspaceTopbar } from './WorkspaceTopbar'

export function WorkspaceLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceSidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="lg:pl-[248px] min-h-screen flex flex-col">
        <WorkspaceTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 pt-[68px]">
          <div className="page-container p-space-lg sm:p-space-2xl lg:p-space-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
