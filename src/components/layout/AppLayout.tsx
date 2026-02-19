import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { OfflineBanner } from './OfflineBanner'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-[100dvh]">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-200 opacity-30 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-sky-200 opacity-30 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-pink-200 opacity-30 blur-3xl" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar onNavigate={() => {}} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative h-full w-72 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center border-b px-4 py-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-2 bg-gradient-to-r from-purple-600 via-pink-500 to-sky-500 bg-clip-text text-lg font-semibold text-transparent">Teenie ToDo</span>
        </div>

        <OfflineBanner />

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
