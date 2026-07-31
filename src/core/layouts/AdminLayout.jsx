import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from '@/core/components/ui/sonner'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminBottomNav } from './components/AdminBottomNav'
import { AdminHeader } from './components/AdminHeader'

export function AdminLayout() {
  const Loader = () => (
    <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
      Cargando...
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden relative bg-zinc-50/50 dark:bg-zinc-900/30">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
        <AdminHeader />
        <main className="p-6 flex-1">
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <AdminBottomNav />
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
