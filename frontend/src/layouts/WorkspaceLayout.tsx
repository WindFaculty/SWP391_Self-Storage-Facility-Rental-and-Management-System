import { Outlet } from 'react-router-dom'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { WorkspaceTopbar } from './WorkspaceTopbar'

export function WorkspaceLayout() {
  return (
    <div className="min-h-screen bg-background">
      <WorkspaceSidebar />
      <div className="pl-[248px] min-h-screen flex flex-col">
        <WorkspaceTopbar />
        <main className="flex-1 pt-[68px]">
          <div className="w-full max-w-[1440px] mx-auto p-space-2xl lg:p-space-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
