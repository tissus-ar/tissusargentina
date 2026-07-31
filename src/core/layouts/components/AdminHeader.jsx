import { useNavigate, Link } from 'react-router-dom'
import { User, LogOut, Store } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import { useAuth } from '@/core/context/AuthContext'
import { APP_ROUTES } from '@/core/lib/routes'

export function AdminHeader() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(APP_ROUTES.HOME())
  }

  return (
    <header className="h-14 border-b bg-background px-6 flex items-center justify-between md:justify-end shrink-0">
      {/* Logo on mobile only, since desktop has AdminSidebar */}
      <div className="flex items-center gap-2 md:hidden">
        <Link to={APP_ROUTES.HOME()} className="flex items-center gap-2">
          <img src="/logo-compacto.png" alt="Tissus" className="h-6 w-auto object-contain dark:invert" />
          <span className="font-bold text-base tracking-tight">Tissus Admin</span>
        </Link>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(APP_ROUTES.ACCOUNT())}>
                <User className="mr-2 h-4 w-4 text-muted-foreground" /> Mi cuenta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(APP_ROUTES.HOME())}>
                <Store className="mr-2 h-4 w-4 text-muted-foreground" /> Ir a la tienda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
